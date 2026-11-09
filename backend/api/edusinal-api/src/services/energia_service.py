# Regras da energia.
# Igual ao app: máximo 5, concluir uma atividade nova gasta 1, e 1 volta a cada 3 horas.
# Refazer o que já fez é revisão e não gasta. Sem energia, só dá para revisar.

from datetime import datetime, timedelta


ENERGIA_MAXIMA = 5
TEMPO_POR_ENERGIA = timedelta(hours=3)


def recuperar_energia(
    energia: int,
    proxima_energia_em: datetime | None,
    agora: datetime,
) -> tuple[int, datetime | None]:
    # Mesma ideia das vidas: "passou tanto tempo, quanta energia o aluno tem agora?"
    if energia >= ENERGIA_MAXIMA:
        return ENERGIA_MAXIMA, None

    proxima_energia_em = proxima_energia_em or agora + TEMPO_POR_ENERGIA
    if agora < proxima_energia_em:
        return energia, proxima_energia_em

    energia_recuperada = int((agora - proxima_energia_em) / TEMPO_POR_ENERGIA) + 1
    energia = min(ENERGIA_MAXIMA, energia + energia_recuperada)
    if energia == ENERGIA_MAXIMA:
        return energia, None

    return energia, proxima_energia_em + energia_recuperada * TEMPO_POR_ENERGIA


def gastar_energia(
    energia: int,
    proxima_energia_em: datetime | None,
    agora: datetime,
) -> tuple[int, datetime | None]:
    # Concluiu uma atividade nova: tira 1 de energia (nunca fica negativo).
    energia = max(0, energia - 1)

    # Se o relógio da próxima energia ainda não estava correndo, começa agora.
    if proxima_energia_em is None:
        proxima_energia_em = agora + TEMPO_POR_ENERGIA

    return energia, proxima_energia_em
