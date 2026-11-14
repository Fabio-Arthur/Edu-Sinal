# Regras do Desafia-me (o teste opcional de revisão, no Dicionário).
#
# Não trava nada da trilha: o aluno faz se quiser.
# As 5 perguntas são sorteadas entre os exercícios que o aluno já concluiu,
# ou seja, sobre os sinais que ele já desbloqueou. Abre depois do primeiro
# exercício concluído (cada exercício tem 5 perguntas).
# Pode errar no máximo 1. Quem passar ganha +20 XP e +10 moedas,
# só uma vez por dia (gasta 1 de energia). No resto do dia é treino livre.

import random


PERGUNTAS_NO_DESAFIO = 5
ERROS_MAXIMOS_NO_DESAFIO = 1
XP_DO_DESAFIO = 20
MOEDAS_DO_DESAFIO = 10


def desafio_liberado(perguntas_disponiveis: int) -> bool:
    return perguntas_disponiveis >= PERGUNTAS_NO_DESAFIO


def sortear_perguntas(perguntas: list[dict], semente: int) -> list[dict]:
    # Sorteia 5 perguntas. Com a mesma semente (o número da tentativa), sorteia
    # sempre as mesmas: assim a API acha de novo as perguntas na hora de conferir.
    return random.Random(semente).sample(perguntas, PERGUNTAS_NO_DESAFIO)


def ganhou_premio(erros: int, ja_ganhou_hoje: bool) -> bool:
    # Prêmio só para quem errou no máximo 1 e ainda não ganhou hoje.
    return erros <= ERROS_MAXIMOS_NO_DESAFIO and not ja_ganhou_hoje
