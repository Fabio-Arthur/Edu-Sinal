# Regras do Desafia-me (o teste opcional de revisão).
#
# Não trava nada da trilha: o aluno faz se quiser.
# As 5 perguntas são sorteadas entre os sinais que o aluno já desbloqueou
# no dicionário (ver dicionario_service), então o desafio cresce junto com ele.
# Abre quando o aluno tiver pelo menos 5 sinais desbloqueados.
# Pode errar no máximo 1. Quem passar ganha +20 XP e +10 moedas,
# só uma vez por dia (gasta 1 de energia). No resto do dia é treino livre.

import random


ID_DO_DESAFIO = "desafio"
PERGUNTAS_NO_DESAFIO = 5
OPCOES_POR_PERGUNTA = 3
ERROS_MAXIMOS_NO_DESAFIO = 1
XP_DO_DESAFIO = 20
MOEDAS_DO_DESAFIO = 10


def desafio_liberado(desbloqueados: list[str]) -> bool:
    return len(desbloqueados) >= PERGUNTAS_NO_DESAFIO


def sortear_perguntas(desbloqueados: list[str], nomes: dict[str, str]) -> list[dict]:
    # Monta 5 perguntas "vídeo → palavra": o app mostra o vídeo do sinal
    # e o aluno escolhe o nome certo entre 3 opções.
    # "nomes" diz como cada sinal aparece escrito: {"Letra A": "A", "Oi": "Oi"}.
    sorteados = random.sample(desbloqueados, PERGUNTAS_NO_DESAFIO)

    perguntas = []
    for sinal in sorteados:
        # Pega 2 sinais errados para misturar com o certo.
        outros = [outro for outro in desbloqueados if outro != sinal]
        errados = random.sample(outros, OPCOES_POR_PERGUNTA - 1)

        opcoes = [nomes[sinal]] + [nomes[errado] for errado in errados]
        random.shuffle(opcoes)

        perguntas.append({
            "tipo": "video-palavra",
            "sinal": sinal,
            "opcoes": opcoes,
            "resposta_certa": opcoes.index(nomes[sinal]),
            "explicacao": f"Esse é o sinal de “{nomes[sinal]}”.",
        })
    return perguntas


def ganhou_premio(erros: int, ja_ganhou_hoje: bool) -> bool:
    # Prêmio só para quem errou no máximo 1 e ainda não ganhou hoje.
    return erros <= ERROS_MAXIMOS_NO_DESAFIO and not ja_ganhou_hoje
