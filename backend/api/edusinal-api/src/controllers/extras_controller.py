# Rotas do resto do jogo: missões, lojinha, mascote, liga e dicionário.
# Todas devolvem o "estado" atualizado (ver montar_estado em comum.py).

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException

from src.controllers.comum import (
    MISSOES,
    PARTES_DO_MASCOTE,
    carregar_progresso,
    montar_estado,
    salvar_progresso,
    usuario_logado,
)
from src.database.conexao import conectar
from src.repositories import extras_repository, progresso_repository, trilha_repository
from src.schemas.entradas import Compra, Visual
from src.services import (
    datas_service,
    dicionario_service,
    energia_service,
    ligas_service,
    lojinha_service,
    missoes_service,
    vidas_service,
)


router = APIRouter(tags=["Missões, lojinha, mascote, liga e dicionário"])

# Conquistas que liberam itens do mascote: nome no banco → regra no ligas_service.
CONQUISTAS = {"Etapa vencida": "etapa", "Em chamas": "ofensiva", "Subindo": "liga"}


def finalizar(conexao, id_usuario: int, progresso: dict, agora) -> dict:
    # Fim comum das rotas: salva, monta o estado e confirma tudo no banco.
    salvar_progresso(conexao, id_usuario, progresso)
    estado = montar_estado(conexao, id_usuario, progresso, agora)
    conexao.commit()
    return estado


# ----- Missões -----

@router.post("/missoes/{id_missao}/resgatar")
def resgatar_missao(id_missao: str, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    with conectar() as conexao:
        progresso = carregar_progresso(conexao, id_usuario, agora)
        estado = montar_estado(conexao, id_usuario, progresso, agora)

        # As listas de missões com o progresso de agora (mesmas regras do app).
        do_dia = missoes_service.missoes_do_dia(
            estado["meta_diaria"], estado["hoje"]["atividades"], estado["hoje"]["xp"], len(estado["hoje"]["sinais_vistos"])
        )
        da_semana = missoes_service.missoes_da_semana(estado["semana"]["xp"], estado["ofensiva"])

        missao = next((m for m in do_dia + da_semana if m["id"] == id_missao), None)
        if missao is None:
            raise HTTPException(status_code=404, detail="Essa missão não existe.")
        e_do_dia = missao in do_dia
        ja_resgatadas = estado["hoje"]["missoes_resgatadas"] if e_do_dia else estado["semana"]["missoes_resgatadas"]
        if not missoes_service.pode_resgatar(missao, ja_resgatadas):
            raise HTTPException(status_code=409, detail="Essa missão ainda não foi completada ou já foi resgatada.")

        # A do dia fica guardada com o dia; a da semana, com a segunda-feira.
        periodo = estado["hoje"]["dia"] if e_do_dia else estado["semana"]["segunda"]
        numero = next(numero for numero, nome in MISSOES.items() if nome == id_missao)
        extras_repository.resgatar_missao(conexao, id_usuario, numero, periodo)
        progresso["moedas"] += missao["moedas"]
        return finalizar(conexao, id_usuario, progresso, agora)


# ----- Lojinha -----

def itens_para_regras(cosmeticos: list[dict]) -> list[dict]:
    # O formato que o lojinha_service usa ({"id", "parte", "jeito", "preco"}), na ordem do banco.
    return [{"id": item["codigo"], "parte": item["tipo_cosmetico"],
             "jeito": "moedas" if item["forma_liberar"] == "Moedas" else "outro",
             "preco": item["custo_moedas"], "id_cosmetico": item["id_cosmetico"]}
            for item in cosmeticos]


@router.get("/lojinha")
def ver_lojinha(id_usuario: int = Depends(usuario_logado)):
    hoje = datas_service.dia_em_brasilia(datas_service.agora_utc())
    with conectar() as conexao:
        itens = itens_para_regras(extras_repository.todos_os_cosmeticos(conexao))
    vitrine = lojinha_service.vitrine_do_dia(hoje, itens)
    return {"ajudas": lojinha_service.AJUDAS,
            "vitrine": [{"id": item["id"], "preco": item["preco"]} for item in vitrine]}


@router.post("/lojinha/compras")
def comprar(compra: Compra, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    hoje = datas_service.dia_em_brasilia(agora)

    with conectar() as conexao:
        progresso = carregar_progresso(conexao, id_usuario, agora)

        ajuda = lojinha_service.buscar_ajuda(compra.id)
        if ajuda is not None:
            # Ajuda: recarga de energia, recarga de vidas ou protetor de ofensiva.
            motivo = lojinha_service.motivo_para_nao_comprar_ajuda(
                compra.id, progresso["moedas"], progresso["vidas"], progresso["energia"],
                progresso["protetores"], progresso["data_recarga_energia"] == hoje,
            )
            if motivo:
                raise HTTPException(status_code=409, detail=motivo)
            progresso["moedas"] -= ajuda["preco"]
            if compra.id == "recarga-energia":
                progresso["energia"], progresso["proxima_energia"] = energia_service.ENERGIA_MAXIMA, None
                progresso["data_recarga_energia"] = hoje
            elif compra.id == "recarga-vidas":
                progresso["vidas"], progresso["proxima_vida"] = vidas_service.VIDAS_MAXIMAS, None
            else:
                progresso["protetores"] += 1
            return finalizar(conexao, id_usuario, progresso, agora)

        # Item do mascote: só se estiver na vitrine de hoje.
        vitrine = lojinha_service.vitrine_do_dia(hoje, itens_para_regras(extras_repository.todos_os_cosmeticos(conexao)))
        item = next((item for item in vitrine if item["id"] == compra.id), None)
        if item is None:
            raise HTTPException(status_code=400, detail="Esse item não está na vitrine de hoje.")
        if compra.id in extras_repository.itens_do_usuario(conexao, id_usuario):
            raise HTTPException(status_code=409, detail="Você já tem esse item.")
        if progresso["moedas"] < item["preco"]:
            raise HTTPException(status_code=409, detail="Moedas insuficientes.")
        progresso["moedas"] -= item["preco"]
        extras_repository.dar_item(conexao, id_usuario, item["id_cosmetico"], item["preco"])
        return finalizar(conexao, id_usuario, progresso, agora)


# ----- Mascote -----

@router.put("/mascote")
def vestir(visual: Visual, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    tipo = next((tipo for tipo, nome in PARTES_DO_MASCOTE.items() if nome == visual.parte), None)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Essa parte do mascote não existe.")

    with conectar() as conexao:
        progresso = carregar_progresso(conexao, id_usuario, agora)

        if visual.id_item == "":
            extras_repository.tirar(conexao, id_usuario, tipo)  # "" = tirar o que tinha
            return finalizar(conexao, id_usuario, progresso, agora)

        item = next((item for item in extras_repository.todos_os_cosmeticos(conexao)
                     if item["codigo"] == visual.id_item and item["tipo_cosmetico"] == tipo), None)
        if item is None:
            raise HTTPException(status_code=404, detail="Esse item não existe para essa parte do mascote.")

        # O usuário pode usar esse item? Grátis sempre; comprado ou prêmio, se
        # estiver na lista dele; de conquista, se já cumpriu a conquista.
        pode = item["forma_liberar"] == "Gratis" or visual.id_item in extras_repository.itens_do_usuario(conexao, id_usuario)
        if item["forma_liberar"] == "Conquista":
            concluidas = trilha_repository.concluidas(conexao, id_usuario)
            etapas = len([codigo for codigo in concluidas if codigo.endswith(":final")])
            pode = ligas_service.conquista_liberada(
                CONQUISTAS.get(item["conquista"], ""), etapas, progresso["sequencia_dias"], progresso["id_liga"] - 1
            )
        if not pode:
            raise HTTPException(status_code=409, detail="Você ainda não tem esse item.")

        # O banco só deixa vestir o que está em cosmeticos_usuario: os grátis e os
        # de conquista entram lá na primeira vez que são usados.
        extras_repository.dar_item(conexao, id_usuario, item["id_cosmetico"], 0)
        extras_repository.vestir(conexao, id_usuario, item["id_cosmetico"], tipo)
        return finalizar(conexao, id_usuario, progresso, agora)


# ----- Liga -----

@router.get("/ligas/semana")
def ver_ranking(id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    with conectar() as conexao:
        progresso = carregar_progresso(conexao, id_usuario, agora)
        segunda = datas_service.segunda_da_semana(datas_service.dia_em_brasilia(agora))
        jogadores = progresso_repository.ranking(conexao, segunda, progresso["id_liga"])
        estado = finalizar(conexao, id_usuario, progresso, agora)

    # Quem ainda não ganhou XP nesta semana aparece com 0, no fim da lista.
    lista = [{"id_aluno": j["id_usuario"], "apelido": j["nome"], "xp": j["xp"]} for j in jogadores]
    if not any(jogador["id_aluno"] == id_usuario for jogador in lista):
        lista.append({"id_aluno": id_usuario, "apelido": estado["apelido"], "xp": 0})
    ranking = ligas_service.montar_ranking(lista)

    return {
        "liga": progresso["id_liga"] - 1,
        "termina_em": segunda + timedelta(days=7),
        "ranking": [{"posicao": jogador["posicao"], "apelido": jogador["apelido"], "xp": jogador["xp"],
                     "sou_eu": jogador["id_aluno"] == id_usuario,  # o id dos outros não sai daqui
                     "zona": ligas_service.zona(jogador["posicao"], len(ranking))}
                    for jogador in ranking],
        "estado": estado,
    }


# ----- Dicionário -----

@router.post("/dicionario/{codigo}/visto")
def marcar_visto(codigo: str, id_usuario: int = Depends(usuario_logado)):
    # Conta para a missão "veja 3 sinais" e para a conquista "Explorador".
    agora = datas_service.agora_utc()
    with conectar() as conexao:
        id_palavra = extras_repository.buscar_palavra(conexao, codigo)
        if id_palavra is None:
            raise HTTPException(status_code=404, detail="Esse sinal não existe no dicionário.")
        # Palavra bloqueada ainda não pode ser vista (o alfabeto é sempre aberto).
        if not dicionario_service.sinal_aberto(codigo, extras_repository.palavras_desbloqueadas(conexao, id_usuario)):
            raise HTTPException(status_code=409, detail="Esse sinal ainda está bloqueado. Aprenda ele na trilha!")
        progresso = carregar_progresso(conexao, id_usuario, agora)
        extras_repository.marcar_vista(conexao, id_usuario, id_palavra, datas_service.dia_em_brasilia(agora))
        return finalizar(conexao, id_usuario, progresso, agora)
