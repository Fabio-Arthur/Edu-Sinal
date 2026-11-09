# Regras da trilha: o que o aluno já pode fazer.
# Igual ao app (frontend/app/prototipo/js/conteudo.js e telas-trilha.js):
#   - cada etapa tem 5 atividades em ordem: a 2ª abre depois da 1ª, e assim por diante;
#   - a prova final abre depois das 5 e pode errar no máximo 1;
#   - a próxima etapa abre quando a prova final da anterior é aprovada;
#   - refazer o que já concluiu é revisão: não dá XP e não gasta energia.
#
# O id de cada atividade é "etapa:atividade", por exemplo "numeros:pratica-um-a-cinco".
# A prova final de cada etapa tem o id "etapa:final", por exemplo "numeros:final".
# "concluidas" é a lista de ids que o aluno já terminou (vem do banco).


ERROS_MAXIMOS_NA_PROVA = 1
ID_DA_PROVA = "final"


def montar_id(etapa: str, atividade: str) -> str:
    # Junta os dois nomes no formato "etapa:atividade".
    return f"{etapa}:{atividade}"


def etapa_liberada(
    etapa: str,
    ordem_das_etapas: list[str],
    concluidas: list[str],
) -> bool:
    # A primeira etapa já vem aberta.
    posicao = ordem_das_etapas.index(etapa)
    if posicao == 0:
        return True

    # As outras abrem quando a prova final da etapa anterior foi concluída.
    etapa_anterior = ordem_das_etapas[posicao - 1]
    return montar_id(etapa_anterior, ID_DA_PROVA) in concluidas


def prova_liberada(
    etapa: str,
    atividades_da_etapa: list[str],
    concluidas: list[str],
) -> bool:
    # A prova só abre quando TODAS as atividades da etapa estão concluídas.
    for atividade in atividades_da_etapa:
        if montar_id(etapa, atividade) not in concluidas:
            return False
    return True


def atividade_liberada(
    etapa: str,
    atividade: str,
    atividades_da_etapa: list[str],
    ordem_das_etapas: list[str],
    concluidas: list[str],
) -> bool:
    # Etapa trancada: nada dentro dela abre.
    if not etapa_liberada(etapa, ordem_das_etapas, concluidas):
        return False

    # A prova final tem regra própria.
    if atividade == ID_DA_PROVA:
        return prova_liberada(etapa, atividades_da_etapa, concluidas)

    # A primeira atividade da etapa já vem aberta.
    posicao = atividades_da_etapa.index(atividade)
    if posicao == 0:
        return True

    # As outras abrem quando a anterior foi concluída.
    atividade_anterior = atividades_da_etapa[posicao - 1]
    return montar_id(etapa, atividade_anterior) in concluidas


def prova_aprovada(erros: int) -> bool:
    # Passa quem errou no máximo 1.
    return erros <= ERROS_MAXIMOS_NA_PROVA


def e_revisao(etapa: str, atividade: str, concluidas: list[str]) -> bool:
    # Já concluiu antes? Então é revisão (sem XP e sem gastar energia).
    return montar_id(etapa, atividade) in concluidas
