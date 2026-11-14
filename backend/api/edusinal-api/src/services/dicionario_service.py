# Regras do dicionário (o "álbum de sinais"), decididas pela equipe em 11/11/2026.
#
# O alfabeto fica todo aberto, para consulta.
# As outras palavras começam bloqueadas e abrem quando o aluno conclui a
# atividade de aprender que ensina aquele sinal.


def sinal_aberto(codigo: str, desbloqueados: list[str]) -> bool:
    # Pode ver o sinal? Letras ("letra-a"...) sempre; o resto só se já desbloqueou.
    codigo = codigo.lower()
    return codigo.startswith("letra-") or codigo in desbloqueados
