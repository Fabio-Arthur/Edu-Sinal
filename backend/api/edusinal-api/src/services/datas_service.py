# Ajudantes de data e hora, usados por várias regras.
#
# O combinado: o banco guarda tudo em UTC (o horário "universal"), e o dia
# do jogo vira à meia-noite de Brasília. O Brasil não tem mais horário de verão
# (acabou em 2019), então Brasília é sempre 3 horas a menos que o UTC.

from datetime import date, datetime, timedelta, timezone


FUSO_BRASILIA = timezone(timedelta(hours=-3))


def agora_utc() -> datetime:
    # A hora de agora, com o fuso UTC grudado nela.
    return datetime.now(timezone.utc).replace(microsecond=0)  # sem frações de segundo


def colocar_fuso_utc(momento: datetime | None) -> datetime | None:
    # O banco devolve as horas sem fuso. Aqui dizemos: "essa hora é UTC".
    if momento is None:
        return None
    if momento.tzinfo is None:
        return momento.replace(tzinfo=timezone.utc)
    return momento


def para_o_banco(momento: datetime | None) -> datetime | None:
    # O contrário: tira o fuso (o banco não guarda fuso), deixando a hora em UTC.
    if momento is None:
        return None
    return colocar_fuso_utc(momento).astimezone(timezone.utc).replace(tzinfo=None)


def para_brasilia(momento: datetime | None) -> datetime | None:
    # Para mostrar no app: "2026-10-27T10:00:00-03:00".
    if momento is None:
        return None
    return colocar_fuso_utc(momento).astimezone(FUSO_BRASILIA)


def dia_em_brasilia(momento: datetime) -> date:
    # Que dia é em Brasília? (23h em Brasília já é o dia seguinte em UTC.)
    return colocar_fuso_utc(momento).astimezone(FUSO_BRASILIA).date()


def segunda_da_semana(dia: date) -> date:
    # A semana começa na segunda-feira. weekday(): segunda = 0, domingo = 6.
    return dia - timedelta(days=dia.weekday())


def inicio_do_dia_em_utc(dia: date) -> datetime:
    # A meia-noite de Brasília daquele dia, convertida para UTC (para buscar no banco).
    meia_noite = datetime(dia.year, dia.month, dia.day, tzinfo=FUSO_BRASILIA)
    return meia_noite.astimezone(timezone.utc)
