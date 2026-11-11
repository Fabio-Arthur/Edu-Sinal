# Coisas que quase todas as rotas usam:
#   - usuario_logado: descobre quem está fazendo o pedido, pelo cookie;
#   - carregar_progresso: lê o progresso e já aplica o tempo que passou
#     (vidas e energia que voltaram, ofensiva perdida, virada da semana da liga);
#   - salvar_progresso;
#   - montar_estado: tudo que o app precisa saber do usuário, num JSON só.
#
# Por que "estado"? Depois de qualquer ação (responder, comprar, resgatar...),
# a API devolve o estado inteiro e o app só copia. Assim o app nunca calcula
# moeda, XP ou vida por conta própria: quem manda é o servidor.

from datetime import timedelta

from fastapi import Cookie, HTTPException

from src.database.conexao import conectar
from src.repositories import extras_repository, progresso_repository, trilha_repository, usuarios_repository
from src.services import (
    datas_service,
    energia_service,
    ligas_service,
    ofensiva_service,
    senha_service,
    vidas_service,
)


NOME_DO_COOKIE = "sessao"

# Partes do mascote: nome no banco → nome no JSON.
PARTES_DO_MASCOTE = {"Roupa": "roupa", "Chapeu": "chapeu", "Rosto": "rosto", "Peito": "peito", "Fundo": "fundo"}
VISUAL_PADRAO = {"roupa": "camiseta-branca", "chapeu": "", "rosto": "", "peito": "", "fundo": ""}


def usuario_logado(sessao: str | None = Cookie(default=None)) -> int:
    # O FastAPI lê o cookie "sessao" sozinho e entrega aqui.
    # As rotas usam assim: id_usuario: int = Depends(usuario_logado)
    if not sessao:
        raise HTTPException(status_code=401, detail="Você precisa entrar na sua conta.")

    # O banco só conhece o hash do código, então procuramos pelo hash.
    token_hash = senha_service.hash_do_codigo(sessao)
    agora = datas_service.para_o_banco(datas_service.agora_utc())
    with conectar() as conexao:
        id_usuario = usuarios_repository.usuario_da_sessao(conexao, token_hash, agora)

    if id_usuario is None:
        raise HTTPException(status_code=401, detail="Sua sessão acabou. Entre de novo.")
    return id_usuario


def carregar_progresso(conexao, id_usuario: int, agora) -> dict:
    progresso = progresso_repository.ler(conexao, id_usuario)

    # O banco devolve as horas sem fuso: dizemos que são UTC.
    progresso["proxima_vida"] = datas_service.colocar_fuso_utc(progresso["proxima_vida"])
    progresso["proxima_energia"] = datas_service.colocar_fuso_utc(progresso["proxima_energia"])

    # 1. Vidas e energia que voltaram com o tempo.
    progresso["vidas"], progresso["proxima_vida"] = vidas_service.recuperar_vidas(
        progresso["vidas"], progresso["proxima_vida"], agora
    )
    progresso["energia"], progresso["proxima_energia"] = energia_service.recuperar_energia(
        progresso["energia"], progresso["proxima_energia"], agora
    )

    # 2. Ofensiva: perdeu algum dia? O protetor salva?
    hoje = datas_service.dia_em_brasilia(agora)
    situacao = ofensiva_service.conferir_ofensiva(
        progresso["sequencia_dias"], progresso["protetores"], progresso["data_ultima_atividade"], hoje
    )
    progresso["sequencia_dias"] = situacao.ofensiva
    progresso["protetores"] = situacao.protetores
    progresso["data_ultima_atividade"] = situacao.ultimo_dia_praticado
    for dia in situacao.dias_salvos:
        progresso_repository.marcar_dia_salvo(conexao, id_usuario, dia)

    # 3. Liga: virou a semana? Vê como o usuário foi na semana passada.
    progresso["id_liga"] = liga_depois_da_virada(conexao, id_usuario, progresso["id_liga"], hoje)
    return progresso


def liga_depois_da_virada(conexao, id_usuario: int, id_liga: int, hoje) -> int:
    segunda = datas_service.segunda_da_semana(hoje)
    semana_passada = segunda - timedelta(days=7)
    jogou = progresso_repository.ler_semana(conexao, id_usuario, semana_passada)

    # Não jogou na semana passada, ou ela já foi fechada: nada muda.
    if jogou is None or jogou["resultado"] is not None:
        return id_liga

    # Jogou: vê a posição dele no ranking da semana passada.
    jogadores = progresso_repository.ranking(conexao, semana_passada, jogou["id_liga"])
    ranking = ligas_service.montar_ranking(
        [{"id_aluno": j["id_usuario"], "apelido": j["nome"], "xp": j["xp"]} for j in jogadores]
    )
    posicao = 0
    for jogador in ranking:
        if jogador["id_aluno"] == id_usuario:
            posicao = jogador["posicao"]

    # As ligas no banco vão de 1 (Bronze) a 5 (Diamante); nas regras, de 0 a 4.
    nova = ligas_service.nova_liga(jogou["id_liga"] - 1, posicao, len(ranking)) + 1
    resultado = "Subiu" if nova > jogou["id_liga"] else "Desceu" if nova < jogou["id_liga"] else "Ficou"
    progresso_repository.fechar_semana(conexao, id_usuario, semana_passada, resultado)
    return nova


def salvar_progresso(conexao, id_usuario: int, progresso: dict) -> None:
    # Antes de guardar, tira o fuso das horas (o banco guarda em UTC, sem fuso).
    para_salvar = dict(progresso)
    para_salvar["proxima_vida"] = datas_service.para_o_banco(progresso["proxima_vida"])
    para_salvar["proxima_energia"] = datas_service.para_o_banco(progresso["proxima_energia"])
    progresso_repository.salvar(conexao, id_usuario, para_salvar)


def montar_estado(conexao, id_usuario: int, progresso: dict, agora) -> dict:
    # Tudo que o app precisa para desenhar as telas. Horas em Brasília
    # ("2026-11-11T10:30:00-03:00") e dias como "2026-11-11".
    usuario = usuarios_repository.buscar_por_id(conexao, id_usuario)
    hoje = datas_service.dia_em_brasilia(agora)
    segunda = datas_service.segunda_da_semana(hoje)
    dia = progresso_repository.ler_dia(conexao, id_usuario, hoje)
    semana = progresso_repository.ler_semana(conexao, id_usuario, segunda)

    dias_praticados = []
    dias_salvos = []
    for linha in progresso_repository.todos_os_dias(conexao, id_usuario):
        if linha["tipo_dia"] == "Protetor":
            dias_salvos.append(linha["data_atividade"])
        else:
            dias_praticados.append(linha["data_atividade"])

    mascote = dict(VISUAL_PADRAO)
    for tipo, codigo in extras_repository.visual(conexao, id_usuario).items():
        mascote[PARTES_DO_MASCOTE[tipo]] = codigo

    return {
        "apelido": usuario["nome"],
        "email": usuario["email"],
        "meta_diaria": usuario["meta_diaria"],
        "xp": progresso["xp"],
        "moedas": progresso["moedas"],
        "vidas": progresso["vidas"],
        "proxima_vida_em": datas_service.para_brasilia(progresso["proxima_vida"]),
        "energia": progresso["energia"],
        "proxima_energia_em": datas_service.para_brasilia(progresso["proxima_energia"]),
        "recarga_energia_em": progresso["data_recarga_energia"],
        "ofensiva": progresso["sequencia_dias"],
        "ultimo_dia_praticado": progresso["data_ultima_atividade"],
        "protetores": progresso["protetores"],
        "liga": progresso["id_liga"] - 1,  # 0 = Bronze ... 4 = Diamante
        "premio_desafio_em": progresso["data_premio_desafio"],
        "ganhou_bonus_primeira": bool(progresso["ganhou_bonus_primeira"]),
        "concluidas": trilha_repository.concluidas(conexao, id_usuario),
        "itens": extras_repository.itens_do_usuario(conexao, id_usuario),
        "mascote": mascote,
        "dias_praticados": dias_praticados,
        "dias_salvos": dias_salvos,
        "sinais_vistos": extras_repository.vistas(conexao, id_usuario),
        "hoje": {
            "dia": hoje,
            "atividades": dia["atividades_feitas"],
            "xp": dia["xp_ganho"],
            "sinais_vistos": extras_repository.vistas(conexao, id_usuario, hoje),
            "missoes_resgatadas": missoes_para_o_app(extras_repository.missoes_resgatadas(conexao, id_usuario, hoje)),
        },
        "semana": {
            "segunda": segunda,
            "xp": semana["xp"] if semana else 0,
            "missoes_resgatadas": missoes_para_o_app(extras_repository.missoes_resgatadas(conexao, id_usuario, segunda)),
        },
    }


# Missões: número no banco ↔ nome no app.
MISSOES = {1: "exercicios", 2: "xp", 3: "dicionario", 4: "xp-semana", 5: "ofensiva"}


def missoes_para_o_app(numeros: list[int]) -> list[str]:
    return [MISSOES[numero] for numero in numeros if numero in MISSOES]


def estado_atualizado(id_usuario: int) -> dict:
    # Atalho: abre o banco, aplica o tempo, salva e devolve o estado.
    agora = datas_service.agora_utc()
    with conectar() as conexao:
        progresso = carregar_progresso(conexao, id_usuario, agora)
        salvar_progresso(conexao, id_usuario, progresso)
        estado = montar_estado(conexao, id_usuario, progresso, agora)
        conexao.commit()
    return estado
