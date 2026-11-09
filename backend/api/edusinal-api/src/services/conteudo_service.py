# O conteúdo da trilha e os itens do mascote.
#
# Eles ficam em arquivos JSON na pasta src/conteudo (copiados do app):
#   - trilha.json: etapas, atividades, cartões e perguntas COM o gabarito;
#   - itens.json: os itens do mascote e como cada um é liberado.
# O gabarito fica só aqui no servidor: o app recebe as perguntas sem ele.

import json
from pathlib import Path


PASTA_CONTEUDO = Path(__file__).resolve().parents[1] / "conteudo"

# Lê os arquivos uma vez só, quando a API liga.
with open(PASTA_CONTEUDO / "trilha.json", encoding="utf-8") as arquivo:
    ETAPAS = json.load(arquivo)["etapas"]

with open(PASTA_CONTEUDO / "itens.json", encoding="utf-8") as arquivo:
    ITENS = json.load(arquivo)["itens"]

# A ordem das etapas na trilha: ["alfabeto-manual", "numeros", ...]
ORDEM_DAS_ETAPAS = [etapa["id"] for etapa in ETAPAS]

# A prova final usa as 2 primeiras perguntas de cada exercício da etapa.
PERGUNTAS_POR_EXERCICIO_NA_PROVA = 2


def buscar_etapa(id_etapa: str) -> dict | None:
    for etapa in ETAPAS:
        if etapa["id"] == id_etapa:
            return etapa
    return None


def ids_das_atividades(etapa: dict) -> list[str]:
    # Só os ids das 5 atividades da etapa, em ordem.
    return [atividade["id"] for atividade in etapa["atividades"]]


def separar_id(id_completo: str) -> tuple[str, str]:
    # "numeros:pratica-um-a-cinco" vira ("numeros", "pratica-um-a-cinco").
    # Sem ":" no texto, devolve a segunda parte vazia.
    etapa, _, atividade = id_completo.partition(":")
    return etapa, atividade


def buscar_atividade(id_completo: str) -> dict | None:
    # Acha a atividade pelo id "etapa:atividade". A prova final é "etapa:final".
    id_etapa, id_atividade = separar_id(id_completo)
    etapa = buscar_etapa(id_etapa)
    if etapa is None:
        return None

    if id_atividade == "final":
        return {"id": "final", "tipo": "prova", "titulo": "Prova final", "perguntas": perguntas_da_prova(etapa)}

    for atividade in etapa["atividades"]:
        if atividade["id"] == id_atividade:
            return atividade
    return None


def perguntas_da_prova(etapa: dict) -> list[dict]:
    perguntas = []
    for atividade in etapa["atividades"]:
        if atividade["tipo"] == "exercicio":
            perguntas.extend(atividade["perguntas"][:PERGUNTAS_POR_EXERCICIO_NA_PROVA])
    return perguntas


def perguntas_sem_gabarito(perguntas: list[dict]) -> list[dict]:
    # O que vai para o app: tudo menos a resposta certa e a explicação
    # (a explicação só aparece depois de responder).
    seguras = []
    for pergunta in perguntas:
        copia = dict(pergunta)
        copia.pop("resposta_certa", None)
        copia.pop("explicacao", None)
        seguras.append(copia)
    return seguras


def sinais_por_atividade() -> dict[str, list[str]]:
    # Quais sinais cada atividade de aprender ensina:
    # {"numeros:um-a-cinco": ["1", "2", ...], ...}
    resultado = {}
    for etapa in ETAPAS:
        for atividade in etapa["atividades"]:
            if atividade["tipo"] == "aprender":
                id_completo = f"{etapa['id']}:{atividade['id']}"
                resultado[id_completo] = [cartao["sinal"] for cartao in atividade["cartoes"]]
    return resultado


def cartoes_de_todos_os_sinais() -> dict[str, dict]:
    # Cada sinal da trilha com o seu cartão e onde ele é ensinado.
    resultado = {}
    for etapa in ETAPAS:
        for atividade in etapa["atividades"]:
            if atividade["tipo"] != "aprender":
                continue
            for cartao in atividade["cartoes"]:
                if cartao["sinal"] not in resultado:
                    resultado[cartao["sinal"]] = {
                        "sinal": cartao["sinal"],
                        "nome": cartao["nome"],
                        "dica": cartao["dica"],
                        "etapa": etapa["titulo"],
                        "id_atividade": f"{etapa['id']}:{atividade['id']}",
                    }
    return resultado


def buscar_item(id_item: str) -> dict | None:
    for item in ITENS:
        if item["id"] == id_item:
            return item
    return None
