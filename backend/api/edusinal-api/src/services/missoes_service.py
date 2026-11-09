# Regras das missões (viram à meia-noite e na segunda-feira, horário de Brasília).
#
# Do dia:    concluir a meta do dia (+10 moedas), ganhar meta × 20 XP (+10),
#            ver 3 sinais no dicionário (+5).
# Da semana: ganhar 200 XP na semana (+30), chegar a 5 dias de ofensiva (+20).
# Cada missão só pode ser resgatada uma vez por dia (ou por semana).

from src.services.vidas_service import XP_POR_ATIVIDADE


def missoes_do_dia(meta_diaria: int, atividades_hoje: int, xp_hoje: int, sinais_vistos_hoje: int) -> list[dict]:
    # "progresso" é quanto já fez; "alvo" é quanto precisa.
    palavra = "atividade" if meta_diaria == 1 else "atividades"
    return [
        {"id": "exercicios", "titulo": f"Conclua {meta_diaria} {palavra}",
         "alvo": meta_diaria, "progresso": atividades_hoje, "moedas": 10},
        {"id": "xp", "titulo": f"Ganhe {meta_diaria * XP_POR_ATIVIDADE} XP",
         "alvo": meta_diaria * XP_POR_ATIVIDADE, "progresso": xp_hoje, "moedas": 10},
        {"id": "dicionario", "titulo": "Veja 3 sinais no dicionário",
         "alvo": 3, "progresso": sinais_vistos_hoje, "moedas": 5},
    ]


def missoes_da_semana(xp_semana: int, ofensiva: int) -> list[dict]:
    return [
        {"id": "xp-semana", "titulo": "Ganhe 200 XP na semana",
         "alvo": 200, "progresso": xp_semana, "moedas": 30},
        {"id": "ofensiva", "titulo": "Chegue a 5 dias de ofensiva",
         "alvo": 5, "progresso": ofensiva, "moedas": 20},
    ]


def missao_completa(missao: dict) -> bool:
    return missao["progresso"] >= missao["alvo"]


def pode_resgatar(missao: dict, ja_resgatadas: list[str]) -> bool:
    # Só resgata se terminou e ainda não pegou o prêmio neste período.
    return missao_completa(missao) and missao["id"] not in ja_resgatadas
