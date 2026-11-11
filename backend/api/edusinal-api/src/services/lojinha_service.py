# Regras da lojinha.
#
# Ajudas: recarga de energia (40 moedas, 1 por dia), recarga de vidas (30)
#         e protetor de ofensiva (50, guardando no máximo 2).
# Vitrine do dia: 3 itens do mascote de partes diferentes, sorteados pela data
#         (iguais pra todo mundo no mesmo dia), de 20 a 60 moedas.
#         Item com preço só é vendido no dia em que está na vitrine.
# Sem moedas suficientes, não compra.

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


TAMANHO_32_BITS = 0xFFFFFFFF


def sorteador_do_dia(texto: str):
    # Cópia do "seededRandom" do app (js/telas-lojinha.js), conta por conta.
    # Com o mesmo texto (a data), sorteia sempre os mesmos números, então a
    # vitrine do servidor é igual à que o app mostra. As contas imitam os
    # números de 32 bits do JavaScript (por isso o "& TAMANHO_32_BITS").
    semente = 0
    for letra in texto:
        semente = (semente * 31 + ord(letra)) & TAMANHO_32_BITS

    def proximo() -> float:
        nonlocal semente
        semente = (semente + 0x6D2B79F5) & TAMANHO_32_BITS
        misturado = ((semente ^ (semente >> 15)) * (semente | 1)) & TAMANHO_32_BITS
        misturado ^= (misturado + ((misturado ^ (misturado >> 7)) * (misturado | 61))) & TAMANHO_32_BITS
        return ((misturado ^ (misturado >> 14)) & TAMANHO_32_BITS) / 4294967296  # entre 0 e 1

    return proximo


def vitrine_do_dia(dia: date, itens: list[dict]) -> list[dict]:
    # O sorteio usa a data como "semente": com a mesma semente, sorteia sempre
    # igual. Então todo mundo vê a mesma vitrine no mesmo dia, e no dia
    # seguinte ela muda sozinha. "itens" precisa estar na mesma ordem do app.
    sorteio = sorteador_do_dia(dia.isoformat())

    # Embaralha igual ao app (de trás para a frente, trocando de lugar).
    a_venda = [item for item in itens if item["jeito"] == "moedas"]
    for posicao in range(len(a_venda) - 1, 0, -1):
        outra = int(sorteio() * (posicao + 1))
        a_venda[posicao], a_venda[outra] = a_venda[outra], a_venda[posicao]

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
