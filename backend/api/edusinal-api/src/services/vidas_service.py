from dataclasses import dataclass
from datetime import datetime, timedelta


VIDAS_MAXIMAS = 3
TEMPO_POR_VIDA = timedelta(minutes=30)
XP_POR_ATIVIDADE = 20
MOEDAS_POR_ATIVIDADE = 5
MOEDAS_PRIMEIRA_ATIVIDADE = 15


class SemVidasDisponiveis(ValueError):
    def __init__(self, proxima_vida_em: datetime):
        super().__init__("Não há vidas disponíveis para iniciar outra atividade.")
        self.proxima_vida_em = proxima_vida_em


@dataclass(frozen=True)
class ResultadoJogo:
    xp: int
    moedas: int
    vidas: int
    proxima_vida_em: datetime | None
    xp_ganho: int
    moedas_ganhas: int
    atividade_concluida: bool


def recuperar_vidas(
    vidas: int,
    proxima_vida_em: datetime | None,
    agora: datetime,
) -> tuple[int, datetime | None]:
    if vidas >= VIDAS_MAXIMAS:
        return VIDAS_MAXIMAS, None

    proxima_vida_em = proxima_vida_em or agora + TEMPO_POR_VIDA
    if agora < proxima_vida_em:
        return vidas, proxima_vida_em

    vidas_recuperadas = int((agora - proxima_vida_em) / TEMPO_POR_VIDA) + 1
    vidas = min(VIDAS_MAXIMAS, vidas + vidas_recuperadas)
    if vidas == VIDAS_MAXIMAS:
        return vidas, None

    return vidas, proxima_vida_em + vidas_recuperadas * TEMPO_POR_VIDA


def calcular_resposta(
    *,
    xp: int,
    moedas: int,
    vidas: int,
    proxima_vida_em: datetime | None,
    correta: bool,
    atividade_ja_concluida: bool,
    primeira_atividade: bool,
    agora: datetime,
) -> ResultadoJogo:
    vidas, proxima_vida_em = recuperar_vidas(vidas, proxima_vida_em, agora)
    if vidas == 0:
        raise SemVidasDisponiveis(proxima_vida_em or agora + TEMPO_POR_VIDA)

    if not correta:
        vidas -= 1
        if vidas < VIDAS_MAXIMAS and proxima_vida_em is None:
            proxima_vida_em = agora + TEMPO_POR_VIDA
        return ResultadoJogo(xp, moedas, vidas, proxima_vida_em, 0, 0, False)

    if atividade_ja_concluida:
        return ResultadoJogo(xp, moedas, vidas, proxima_vida_em, 0, 0, False)

    return ResultadoJogo(
        xp=xp + XP_POR_ATIVIDADE,
        moedas=moedas + (MOEDAS_PRIMEIRA_ATIVIDADE if primeira_atividade else MOEDAS_POR_ATIVIDADE),
        vidas=vidas,
        proxima_vida_em=proxima_vida_em,
        xp_ganho=XP_POR_ATIVIDADE,
        moedas_ganhas=MOEDAS_PRIMEIRA_ATIVIDADE if primeira_atividade else MOEDAS_POR_ATIVIDADE,
        atividade_concluida=True,
    )

def perder_vida(
    vidas: int,
    proxima_vida_em: datetime | None,
    agora: datetime,
) -> tuple[int, datetime | None]:
    # Errou uma pergunta: tira 1 vida (nunca fica negativo).
    vidas = max(0, vidas - 1)

    # Se o relógio da próxima vida ainda não estava correndo, começa agora.
    if proxima_vida_em is None:
        proxima_vida_em = agora + TEMPO_POR_VIDA

    return vidas, proxima_vida_em
