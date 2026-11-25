# Regras do administrador: tudo liberado para ele poder mostrar o app inteiro.
# Vida, energia e moedas "infinitas" = o servidor devolve sempre tudo cheio,
# não importa quanto ele gaste.

from src.services.energia_service import ENERGIA_MAXIMA
from src.services.vidas_service import VIDAS_MAXIMAS


MOEDAS_DO_ADMIN = 99999


def liberar_tudo(progresso: dict) -> None:
    # Muda o próprio dicionário (como carregar_progresso e salvar_progresso esperam).
    progresso["vidas"] = VIDAS_MAXIMAS
    progresso["proxima_vida"] = None
    progresso["energia"] = ENERGIA_MAXIMA
    progresso["proxima_energia"] = None
    progresso["moedas"] = MOEDAS_DO_ADMIN
