# Rotas das atividades: trilha, letras do alfabeto e Desafia-me.
#
# O caminho de uma atividade no app:
#   1. POST /atividades/{codigo}/comecar    → confere se pode (trancada? energia? vidas?)
#   2. POST /atividades/{codigo}/respostas  → uma vez por pergunta: confere e, se errou, tira 1 vida
#   3. POST /atividades/{codigo}/concluir   → no fim: XP, moedas, ofensiva e energia
#
# Quem decide se a resposta está certa é SEMPRE o servidor. O app só mostra.
# O {codigo} é o mesmo id do app: "numeros:pratica-um-a-cinco", "numeros:final",
# "alfabeto:A" ou "alfabeto:desafio".

import random

from fastapi import APIRouter, Depends, HTTPException

from src.controllers.comum import carregar_progresso, montar_estado, salvar_progresso, usuario_logado
from src.database.conexao import conectar
from src.repositories import extras_repository, progresso_repository, trilha_repository
from src.schemas.entradas import Resposta
from src.services import (
    datas_service,
    desafio_service,
    energia_service,
    ofensiva_service,
    trilha_service,
    vidas_service,
)


router = APIRouter(prefix="/atividades", tags=["Atividades"])

ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
PERGUNTAS_POR_EXERCICIO_NA_PROVA = 2
ITEM_DA_PRIMEIRA_ATIVIDADE = "broche-sinal"


# ----- Ajudantes -----

def buscar_ou_404(conexao, codigo: str) -> dict:
    atividade = trilha_repository.buscar_atividade(conexao, codigo)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Essa atividade não existe.")
    return atividade


def letras_aprendidas(concluidas: list[str]) -> list[str]:
    return [letra for letra in ALFABETO if f"alfabeto:{letra}" in concluidas]


def esta_liberada(conexao, atividade: dict, concluidas: list[str]) -> bool:
    if atividade["codigo"] in concluidas:
        return True

    # Letras: abrem em ordem, uma de cada vez.
    if atividade["tipo"] == "Letra":
        proxima = next((letra for letra in ALFABETO if f"alfabeto:{letra}" not in concluidas), None)
        return atividade["codigo"] == f"alfabeto:{proxima}"

    # Desafia-me: abre com 5 letras aprendidas.
    if atividade["tipo"] == "Desafio":
        return len(letras_aprendidas(concluidas)) >= desafio_service.PERGUNTAS_NO_DESAFIO

    # Trilha: mesmas regras do trilha_service (ordem das atividades e das etapas).
    da_etapa = trilha_repository.atividades_da_etapa(conexao, atividade["id_etapa"])
    ids_das_atividades = [a["codigo"].split(":")[1] for a in da_etapa if a["tipo"] != "Prova final"]
    return trilha_service.atividade_liberada(
        atividade["codigo_etapa"], atividade["codigo"].split(":")[1], ids_das_atividades,
        trilha_repository.etapas_da_trilha(conexao), concluidas,
    )


def perguntas_da_tentativa(conexao, atividade: dict, id_tentativa: int, concluidas: list[str]) -> list[dict]:
    # A lista de perguntas, na ordem em que o app mostra.
    if atividade["tipo"] == "Prova final":
        return trilha_repository.perguntas_da_prova(conexao, atividade["id_etapa"], PERGUNTAS_POR_EXERCICIO_NA_PROVA)

    if atividade["tipo"] == "Desafio":
        # 5 letras sorteadas entre as aprendidas, 1 pergunta de cada. O sorteio usa
        # o número da tentativa como semente: na hora de conferir a resposta,
        # sorteia de novo e dá exatamente as mesmas perguntas.
        sorteio = random.Random(id_tentativa)
        letras = letras_aprendidas(concluidas)
        escolhidas = sorteio.sample(letras, desafio_service.PERGUNTAS_NO_DESAFIO)
        todas = trilha_repository.perguntas_das_letras(conexao, [f"alfabeto:{letra}" for letra in escolhidas])
        perguntas = []
        for letra in escolhidas:
            da_letra = [pergunta for pergunta in todas if pergunta["codigo"] == f"alfabeto:{letra}"]
            perguntas.append(sorteio.choice(da_letra))
        return perguntas

    return trilha_repository.perguntas_da_atividade(conexao, atividade["id_atividade"])


def pergunta_para_o_app(conexao, pergunta: dict) -> dict:
    # Só para o Desafia-me, que é sorteado aqui: o app recebe a pergunta pronta, sem o gabarito.
    alternativas = trilha_repository.alternativas_da_pergunta(conexao, pergunta["id_pergunta"])
    certa = next(alternativa for alternativa in alternativas if alternativa["correta"])
    if pergunta["tipo"] == "Video-palavra":
        return {"tipo": "video-palavra", "sinal": f"Letra {certa['descricao']}",
                "opcoes": [alternativa["descricao"] for alternativa in alternativas]}
    return {"tipo": "palavra-video", "sinal": certa["palavra"],
            "opcoes": [alternativa["palavra"] for alternativa in alternativas]}


def registrar_pratica(conexao, id_usuario: int, progresso: dict, xp: int, agora) -> None:
    # Atividade nova (ou prêmio do desafio): gasta energia, soma na ofensiva,
    # no dia (missões e meta) e na semana (liga).
    hoje = datas_service.dia_em_brasilia(agora)
    progresso["xp"] += xp
    progresso["energia"], progresso["proxima_energia"] = energia_service.gastar_energia(
        progresso["energia"], progresso["proxima_energia"], agora
    )
    progresso["sequencia_dias"], progresso["data_ultima_atividade"] = ofensiva_service.registrar_pratica(
        progresso["sequencia_dias"], progresso["data_ultima_atividade"], hoje
    )
    progresso_repository.somar_no_dia(conexao, id_usuario, hoje, 1, xp)
    progresso_repository.somar_na_semana(conexao, id_usuario, datas_service.segunda_da_semana(hoje), progresso["id_liga"], xp)


# ----- Rotas -----

@router.post("/{codigo}/comecar")
def comecar(codigo: str, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    hoje = datas_service.dia_em_brasilia(agora)

    with conectar() as conexao:
        atividade = buscar_ou_404(conexao, codigo)
        progresso = carregar_progresso(conexao, id_usuario, agora)
        concluidas = trilha_repository.concluidas(conexao, id_usuario)

        # 1. A atividade já abriu?
        if not esta_liberada(conexao, atividade, concluidas):
            raise HTTPException(status_code=409, detail="Essa atividade ainda está trancada.")

        # 2. Atividade nova precisa de energia (revisão é livre). O desafio só
        #    conta como novo enquanto o prêmio do dia ainda está disponível.
        if atividade["tipo"] == "Desafio":
            nova = progresso["data_premio_desafio"] != hoje
        else:
            nova = codigo not in concluidas
        if nova and progresso["energia"] == 0:
            raise HTTPException(status_code=409, detail="Sua energia acabou. Dá para revisar o que já fez enquanto ela volta.")

        # 3. Quem tem perguntas precisa de vidas (aprender não usa vidas).
        if atividade["tipo"] != "Aprender" and progresso["vidas"] == 0:
            raise HTTPException(status_code=409, detail="Suas vidas estão recarregando. Você ainda pode revisar no dicionário.")

        id_tentativa = trilha_repository.criar_tentativa(conexao, id_usuario, atividade["id_atividade"], datas_service.para_o_banco(agora))
        perguntas = []
        if atividade["tipo"] == "Desafio":
            sorteadas = perguntas_da_tentativa(conexao, atividade, id_tentativa, concluidas)
            perguntas = [pergunta_para_o_app(conexao, pergunta) for pergunta in sorteadas]

        salvar_progresso(conexao, id_usuario, progresso)
        estado = montar_estado(conexao, id_usuario, progresso, agora)
        conexao.commit()

    return {"id_tentativa": id_tentativa, "perguntas": perguntas, "estado": estado}


@router.post("/{codigo}/respostas")
def responder(codigo: str, dados: Resposta, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()

    with conectar() as conexao:
        atividade = buscar_ou_404(conexao, codigo)
        progresso = carregar_progresso(conexao, id_usuario, agora)
        id_tentativa = trilha_repository.tentativa_aberta(conexao, id_usuario, atividade["id_atividade"])
        if id_tentativa is None:
            raise HTTPException(status_code=404, detail="Comece a atividade antes de responder.")

        concluidas = trilha_repository.concluidas(conexao, id_usuario)
        perguntas = perguntas_da_tentativa(conexao, atividade, id_tentativa, concluidas)
        if dados.pergunta >= len(perguntas):
            raise HTTPException(status_code=400, detail="Essa pergunta não existe nesta atividade.")
        pergunta = perguntas[dados.pergunta]

        alternativas = trilha_repository.alternativas_da_pergunta(conexao, pergunta["id_pergunta"])
        if dados.resposta >= len(alternativas):
            raise HTTPException(status_code=400, detail="Essa opção não existe nesta pergunta.")
        posicao_certa = next(posicao for posicao, alternativa in enumerate(alternativas) if alternativa["correta"])

        # Essa resposta já chegou antes? Devolve o mesmo resultado, sem tirar vida de novo.
        repetida = trilha_repository.buscar_resposta(conexao, id_tentativa, pergunta["id_pergunta"], dados.rodada)
        if repetida is not None:
            correta = bool(repetida["acertou"])
        else:
            if progresso["vidas"] == 0:
                raise HTTPException(status_code=409, detail="Suas vidas acabaram. Espere uma voltar.")
            correta = dados.resposta == posicao_certa
            if not correta:
                progresso["vidas"], progresso["proxima_vida"] = vidas_service.perder_vida(
                    progresso["vidas"], progresso["proxima_vida"], agora
                )
            trilha_repository.salvar_resposta(
                conexao, id_tentativa, pergunta["id_pergunta"],
                alternativas[dados.resposta]["id_alternativa"], dados.rodada, correta,
            )

        salvar_progresso(conexao, id_usuario, progresso)
        estado = montar_estado(conexao, id_usuario, progresso, agora)
        conexao.commit()

    return {
        "correta": correta,
        "resposta_certa": posicao_certa,
        "explicacao": pergunta["explicacao"],
        "estado": estado,
    }


@router.post("/{codigo}/concluir")
def concluir(codigo: str, id_usuario: int = Depends(usuario_logado)):
    agora = datas_service.agora_utc()
    hoje = datas_service.dia_em_brasilia(agora)

    with conectar() as conexao:
        atividade = buscar_ou_404(conexao, codigo)
        progresso = carregar_progresso(conexao, id_usuario, agora)
        id_tentativa = trilha_repository.tentativa_aberta(conexao, id_usuario, atividade["id_atividade"])
        if id_tentativa is None:
            raise HTTPException(status_code=404, detail="Comece a atividade antes de concluir.")

        # 1. Respondeu todas as perguntas? (Assim ninguém pula direto para o prêmio.)
        concluidas = trilha_repository.concluidas(conexao, id_usuario)
        perguntas = perguntas_da_tentativa(conexao, atividade, id_tentativa, concluidas)
        respostas = trilha_repository.respostas_da_tentativa(conexao, id_tentativa)
        respondidas = [resposta["id_pergunta"] for resposta in respostas if resposta["rodada"] == 1]
        for pergunta in perguntas:
            if pergunta["id_pergunta"] not in respondidas:
                raise HTTPException(status_code=409, detail="Ainda faltam perguntas para responder.")
        erros = len([resposta for resposta in respostas if not resposta["acertou"]])
        acertos = len(respostas) - erros

        resultado = {"aprovado": True, "erros": erros, "primeira_vez": False,
                     "xp_ganho": 0, "moedas_ganhas": 0, "item_ganho": None}

        if atividade["tipo"] in ("Prova final", "Desafio") and erros > desafio_service.ERROS_MAXIMOS_NO_DESAFIO:
            # 2. Na prova e no desafio, errou mais de 1: não passou (e não ganha nada).
            resultado["aprovado"] = False

        elif atividade["tipo"] == "Desafio":
            # 3. Desafio vencido: prêmio só uma vez por dia (e se ainda tem energia).
            if progresso["data_premio_desafio"] != hoje and progresso["energia"] > 0:
                registrar_pratica(conexao, id_usuario, progresso, desafio_service.XP_DO_DESAFIO, agora)
                progresso["moedas"] += desafio_service.MOEDAS_DO_DESAFIO
                progresso["data_premio_desafio"] = hoje
                resultado.update(primeira_vez=True, xp_ganho=desafio_service.XP_DO_DESAFIO,
                                 moedas_ganhas=desafio_service.MOEDAS_DO_DESAFIO)

        elif codigo not in concluidas:
            # 4. Atividade nova: precisa de energia (ela pode ter acabado no meio do caminho).
            if progresso["energia"] == 0:
                raise HTTPException(status_code=409, detail="Sua energia acabou. Espere ela voltar para concluir.")
            registrar_pratica(conexao, id_usuario, progresso, vidas_service.XP_POR_ATIVIDADE, agora)
            trilha_repository.marcar_concluida(conexao, id_usuario, atividade["id_atividade"])
            resultado.update(primeira_vez=True, xp_ganho=vidas_service.XP_POR_ATIVIDADE)

            # A primeira atividade da vida dá 15 moedas e o broche (que já vai no peito do mascote).
            if not progresso["ganhou_bonus_primeira"]:
                progresso["ganhou_bonus_primeira"] = True
                moedas = vidas_service.MOEDAS_PRIMEIRA_ATIVIDADE
                broche = next(item for item in extras_repository.todos_os_cosmeticos(conexao)
                              if item["codigo"] == ITEM_DA_PRIMEIRA_ATIVIDADE)
                extras_repository.dar_item(conexao, id_usuario, broche["id_cosmetico"], 0)
                extras_repository.vestir(conexao, id_usuario, broche["id_cosmetico"], broche["tipo_cosmetico"])
                resultado["item_ganho"] = ITEM_DA_PRIMEIRA_ATIVIDADE
            else:
                moedas = vidas_service.MOEDAS_POR_ATIVIDADE
            progresso["moedas"] += moedas
            resultado["moedas_ganhas"] = moedas
        # 5. Senão, é revisão: não ganha nada e não gasta energia.

        trilha_repository.fechar_tentativa(
            conexao, id_tentativa, acertos, erros, resultado["xp_ganho"], resultado["moedas_ganhas"],
            datas_service.para_o_banco(agora),
        )
        salvar_progresso(conexao, id_usuario, progresso)
        resultado["estado"] = montar_estado(conexao, id_usuario, progresso, agora)
        conexao.commit()

    return resultado
