# Regras do dicionário (o "álbum de figurinhas" dos sinais).
#
# O alfabeto fica todo aberto, para consulta.
# As outras palavras aparecem bloqueadas (com o nome, mas sem o vídeo)
# até o aluno concluir a atividade de aprender que ensina aquele sinal.
# Não precisa de tabela nova: desbloqueado = o sinal aparece em alguma
# atividade de aprender que o aluno já concluiu.

import string


# "Letra A", "Letra B", ... "Letra Z": sempre abertas.
ALFABETO = [f"Letra {letra}" for letra in string.ascii_uppercase]


def sinais_desbloqueados(
    concluidas: list[str],
    sinais_por_atividade: dict[str, list[str]],
) -> list[str]:
    # Junta os sinais de todas as atividades de aprender já concluídas (sem repetir).
    desbloqueados = []
    for id_atividade, sinais in sinais_por_atividade.items():
        if id_atividade in concluidas:
            for sinal in sinais:
                if sinal not in desbloqueados:
                    desbloqueados.append(sinal)
    return desbloqueados


def sinal_aberto(sinal: str, desbloqueados: list[str]) -> bool:
    # Pode ver o vídeo? Letras sempre; o resto só se já desbloqueou.
    return sinal in ALFABETO or sinal in desbloqueados
