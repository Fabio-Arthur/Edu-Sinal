# Regras da lojinha.
#
# Ajudas: recarga de energia (40 moedas, 1 por dia), recarga de vidas (30)
#         e protetor de ofensiva (50, guardando no máximo 2).
# Vitrine do dia: 3 itens do mascote de partes diferentes, sorteados pela data
#         (iguais pra todo mundo no mesmo dia), de 20 a 60 moedas.
#         Item com preço só é vendido no dia em que está na vitrine.
# Sem moedas suficientes, não compra.

import random
from datetime import date

from src.services.energia_service import ENERGIA_MAXIMA
from src.services.ofensiva_service import PROTETORES_MAXIMOS
from src.services.vidas_service import VIDAS_MAXIMAS


ITENS_NA_VITRINE = 3

AJUDAS = [
    {"id": "recarga-energia", "nome": "Recarga de energia", "preco": 40},
    {"id": "recarga-vidas", "nome": "Recarga de vidas", "preco": 30},
    {"id": "protetor-ofensiva", "nome": "Protetor de ofensiva", "preco": 50},
]


def buscar_ajuda(id_ajuda: str) -> dict | None:
    for ajuda in AJUDAS:
        if ajuda["id"] == id_ajuda:
            return ajuda
    return None


def vitrine_do_dia(dia: date, itens: list[dict]) -> list[dict]:
    # O sorteio usa a data como "semente": com a mesma semente, o random
    # sorteia sempre igual. Então todo mundo vê a mesma vitrine no mesmo dia,
    # e no dia seguinte ela muda sozinha.
    sorteio = random.Random(dia.isoformat())

    a_venda = [item for item in itens if item["jeito"] == "moedas"]
    sorteio.shuffle(a_venda)

    # Pega os primeiros, sem repetir a parte (uma roupa, um fundo, um rosto...).
    escolhidos = []
    partes_usadas = []
    for item in a_venda:
        if len(escolhidos) < ITENS_NA_VITRINE and item["parte"] not in partes_usadas:
            escolhidos.append(item)
            partes_usadas.append(item["parte"])
    return escolhidos


def motivo_para_nao_comprar_ajuda(
    id_ajuda: str,
    moedas: int,
    vidas: int,
    energia: int,
    protetores: int,
    ja_recarregou_energia_hoje: bool,
) -> str | None:
    # Devolve o motivo (para mostrar ao aluno), ou None se pode comprar.
    ajuda = buscar_ajuda(id_ajuda)

    if id_ajuda == "recarga-energia":
        if ja_recarregou_energia_hoje:
            return "A recarga de energia é uma por dia. Volte amanhã!"
        if energia >= ENERGIA_MAXIMA:
            return "Sua energia já está cheia."
    if id_ajuda == "recarga-vidas" and vidas >= VIDAS_MAXIMAS:
        return "Suas vidas já estão completas."
    if id_ajuda == "protetor-ofensiva" and protetores >= PROTETORES_MAXIMOS:
        return f"Você já tem {PROTETORES_MAXIMOS} protetores."
    if moedas < ajuda["preco"]:
        return "Moedas insuficientes."
    return None
