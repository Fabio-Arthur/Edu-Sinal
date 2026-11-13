# Regras das ligas e do mascote (as duas usam conquistas).
#
# Ligas em ordem: Bronze, Prata, Ouro, Safira e Diamante.
# Cada liga é dividida em grupos de até 20 alunos (como no Duolingo):
# o ranking é pelo XP da semana, só entre quem está no mesmo grupo.
# Na virada da semana (segunda-feira), os 3 primeiros do grupo sobem de
# liga e os 2 últimos descem. No ranking aparecem só o apelido e o XP.


LIGAS = ["Bronze", "Prata", "Ouro", "Safira", "Diamante"]
SOBEM = 3
DESCEM = 2
TAMANHO_DO_GRUPO = 20


def grupo_com_vaga(alunos_por_grupo: dict[int, int]) -> int:
    # Em qual grupo entra quem ganhou o primeiro XP da semana.
    # alunos_por_grupo = {1: 20, 2: 7} → o grupo 1 está cheio, entra no 2.
    # Todos cheios (ou nenhum ainda): abre um grupo novo.
    for grupo in sorted(alunos_por_grupo):
        if alunos_por_grupo[grupo] < TAMANHO_DO_GRUPO:
            return grupo
    return max(alunos_por_grupo, default=0) + 1


def montar_ranking(jogadores: list[dict]) -> list[dict]:
    # "jogadores" = [{"id_aluno": 1, "apelido": "Mari", "xp": 120}, ...]
    # Ordena do maior XP para o menor e numera as posições.
    ordenados = sorted(jogadores, key=lambda jogador: jogador["xp"], reverse=True)
    for posicao, jogador in enumerate(ordenados, start=1):
        jogador["posicao"] = posicao
    return ordenados


def zona(posicao: int, total: int) -> str:
    # Em que parte do ranking o aluno está: "sobe", "desce" ou "fica".
    # Com pouca gente na liga, ninguém desce (não teria graça cair sendo 3º de 3).
    if posicao <= SOBEM:
        return "sobe"
    if total > SOBEM + DESCEM and posicao > total - DESCEM:
        return "desce"
    return "fica"


def nova_liga(liga_atual: int, posicao: int, total: int) -> int:
    # A liga da semana seguinte. Nunca passa do Diamante nem desce do Bronze.
    if posicao == 0:
        return liga_atual  # não jogou na semana: continua onde está

    resultado = zona(posicao, total)
    if resultado == "sobe":
        return min(liga_atual + 1, len(LIGAS) - 1)
    if resultado == "desce":
        return max(liga_atual - 1, 0)
    return liga_atual


def conquista_liberada(conquista: str, etapas_concluidas: int, ofensiva: int, liga: int) -> bool:
    # Itens do mascote que vêm de conquistas (iguais às do Perfil no app):
    #   "etapa": passar em uma prova final;
    #   "ofensiva": chegar a 7 dias de ofensiva;
    #   "liga": chegar à liga Prata.
    if conquista == "etapa":
        return etapas_concluidas >= 1
    if conquista == "ofensiva":
        return ofensiva >= 7
    if conquista == "liga":
        return liga >= 1
    return False
