# Regras da ofensiva: quantos dias seguidos o aluno praticou.
# Igual ao app (frontend/app/prototipo/js/estado.js, checkStreak e registerExercise):
#   - o primeiro exercício novo do dia soma 1 na ofensiva;
#   - ficar um dia sem praticar zera a ofensiva...
#   - ...a não ser que o aluno tenha protetores: 1 protetor salva 1 dia perdido.
#
# Para saber "que dia é hoje" em Brasília, use dia_em_brasilia (datas_service).

from dataclasses import dataclass
from datetime import date, timedelta


PROTETORES_MAXIMOS = 2


@dataclass(frozen=True)
class SituacaoOfensiva:
    ofensiva: int                     # quantos dias seguidos
    protetores: int                   # protetores que sobraram
    ultimo_dia_praticado: date | None
    dias_salvos: list[date]           # dias salvos pelo protetor (o escudo no calendário)


def conferir_ofensiva(
    ofensiva: int,
    protetores: int,
    ultimo_dia_praticado: date | None,
    hoje: date,
) -> SituacaoOfensiva:
    # Chamada sempre que o aluno abre o app: confere se ele perdeu algum dia.

    # Nunca praticou, ou a ofensiva já está zerada: não tem o que perder.
    if ultimo_dia_praticado is None or ofensiva == 0:
        return SituacaoOfensiva(ofensiva, protetores, ultimo_dia_praticado, [])

    # Praticou ontem: 0 dias perdidos. Praticou anteontem: 1 dia perdido.
    dias_perdidos = (hoje - ultimo_dia_praticado).days - 1
    if dias_perdidos <= 0:
        return SituacaoOfensiva(ofensiva, protetores, ultimo_dia_praticado, [])

    # Tem protetor para todos os dias perdidos: a ofensiva continua.
    if protetores >= dias_perdidos:
        dias_salvos = []
        for numero in range(1, dias_perdidos + 1):
            dias_salvos.append(ultimo_dia_praticado + timedelta(days=numero))

        # Conta como se tivesse praticado ontem, para hoje somar normalmente.
        ontem = hoje - timedelta(days=1)
        return SituacaoOfensiva(ofensiva, protetores - dias_perdidos, ontem, dias_salvos)

    # Não tem protetor suficiente: a ofensiva zera e os protetores ficam guardados.
    return SituacaoOfensiva(0, protetores, ultimo_dia_praticado, [])


def registrar_pratica(
    ofensiva: int,
    ultimo_dia_praticado: date | None,
    hoje: date,
) -> tuple[int, date]:
    # Chamada quando o aluno conclui um exercício novo (depois de conferir_ofensiva).
    # Só o primeiro do dia soma; os outros do mesmo dia não mudam nada.
    if ultimo_dia_praticado == hoje:
        return ofensiva, hoje
    return ofensiva + 1, hoje
