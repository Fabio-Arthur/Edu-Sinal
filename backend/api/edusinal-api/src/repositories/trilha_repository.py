# Consultas do conteúdo da trilha (etapas, atividades, perguntas e alternativas)
# e do que cada usuário fez (progresso_trilha, tentativas_atividade e respostas_usuario).

from datetime import datetime


# ----- Conteúdo -----

def buscar_atividade(conexao, codigo: str) -> dict | None:
    # Pelo código do app, como "numeros:pratica-um-a-cinco" ou "alfabeto:A".
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT atividades.id_atividade, atividades.codigo, atividades.tipo, atividades.ordem,
                      atividades.id_etapa, etapas.codigo AS codigo_etapa
               FROM atividades JOIN etapas ON etapas.id_etapa = atividades.id_etapa
               WHERE atividades.codigo = %s""",
            (codigo,),
        )
        return cursor.fetchone()


def etapas_da_trilha(conexao) -> list[str]:
    # Códigos das etapas em ordem. As de ordem vazia (o alfabeto do dicionário) ficam de fora.
    with conexao.cursor() as cursor:
        cursor.execute("SELECT codigo FROM etapas WHERE ordem IS NOT NULL AND status = 'Ativa' ORDER BY ordem")
        return [linha[0] for linha in cursor.fetchall()]


def atividades_da_etapa(conexao, id_etapa: int) -> list[dict]:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_atividade, codigo, tipo, ordem FROM atividades WHERE id_etapa = %s ORDER BY ordem",
            (id_etapa,),
        )
        return cursor.fetchall()


def perguntas_da_atividade(conexao, id_atividade: int) -> list[dict]:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_pergunta, tipo, explicacao FROM perguntas WHERE id_atividade = %s ORDER BY ordem",
            (id_atividade,),
        )
        return cursor.fetchall()


def perguntas_da_prova(conexao, id_etapa: int, por_exercicio: int) -> list[dict]:
    # A prova final usa as primeiras perguntas de cada exercício da etapa, em ordem.
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT perguntas.id_pergunta, perguntas.tipo, perguntas.explicacao
               FROM perguntas JOIN atividades ON atividades.id_atividade = perguntas.id_atividade
               WHERE atividades.id_etapa = %s AND atividades.tipo = 'Exercicio' AND perguntas.ordem <= %s
               ORDER BY atividades.ordem, perguntas.ordem""",
            (id_etapa, por_exercicio),
        )
        return cursor.fetchall()


def perguntas_das_letras(conexao, codigos_das_letras: list[str]) -> list[dict]:
    # Todas as perguntas das letras que o usuário já aprendeu (para o Desafia-me).
    if not codigos_das_letras:
        return []
    marcadores = ", ".join(["%s"] * len(codigos_das_letras))  # um %s para cada letra
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            f"""SELECT perguntas.id_pergunta, perguntas.tipo, perguntas.explicacao, atividades.codigo
                FROM perguntas JOIN atividades ON atividades.id_atividade = perguntas.id_atividade
                WHERE atividades.codigo IN ({marcadores})
                ORDER BY perguntas.id_pergunta""",
            tuple(codigos_das_letras),
        )
        return cursor.fetchall()


def alternativas_da_pergunta(conexao, id_pergunta: int) -> list[dict]:
    # Na MESMA ordem das opções do app (por isso o ORDER BY id_alternativa).
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT alternativas.id_alternativa, alternativas.correta, alternativas.descricao,
                      palavras_dicionario.palavra
               FROM alternativas
               LEFT JOIN palavras_dicionario ON palavras_dicionario.id_palavra = alternativas.id_palavra
               WHERE alternativas.id_pergunta = %s ORDER BY alternativas.id_alternativa""",
            (id_pergunta,),
        )
        return cursor.fetchall()


# ----- O que o usuário já concluiu -----

def concluidas(conexao, id_usuario: int) -> list[str]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT atividades.codigo FROM progresso_trilha
               JOIN atividades ON atividades.id_atividade = progresso_trilha.id_atividade
               WHERE progresso_trilha.id_usuario = %s""",
            (id_usuario,),
        )
        return [linha[0] for linha in cursor.fetchall()]


def marcar_concluida(conexao, id_usuario: int, id_atividade: int) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT IGNORE INTO progresso_trilha (id_usuario, id_atividade) VALUES (%s, %s)",
            (id_usuario, id_atividade),
        )


# ----- Tentativas: cada vez que o usuário começa uma atividade -----

def criar_tentativa(conexao, id_usuario: int, id_atividade: int, agora: datetime) -> int:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT INTO tentativas_atividade (id_usuario, id_atividade, data_inicio) VALUES (%s, %s, %s)",
            (id_usuario, id_atividade, agora),
        )
        return cursor.lastrowid


def tentativa_aberta(conexao, id_usuario: int, id_atividade: int) -> int | None:
    # A tentativa mais recente dessa atividade que ainda não terminou.
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT id_tentativa FROM tentativas_atividade
               WHERE id_usuario = %s AND id_atividade = %s AND data_conclusao IS NULL
               ORDER BY id_tentativa DESC LIMIT 1""",
            (id_usuario, id_atividade),
        )
        linha = cursor.fetchone()
    return linha[0] if linha else None


def fechar_tentativa(conexao, id_tentativa: int, acertos: int, erros: int, xp: int, moedas: int, agora: datetime) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """UPDATE tentativas_atividade
               SET acertos = %s, erros = %s, xp_ganho = %s, moedas_ganhas = %s, data_conclusao = %s
               WHERE id_tentativa = %s""",
            (acertos, erros, xp, moedas, agora, id_tentativa),
        )


# ----- Respostas -----

def buscar_resposta(conexao, id_tentativa: int, id_pergunta: int, rodada: int) -> dict | None:
    # Para saber se essa resposta já foi enviada (internet ruim, clique duplo).
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT acertou FROM respostas_usuario WHERE id_tentativa = %s AND id_pergunta = %s AND rodada = %s",
            (id_tentativa, id_pergunta, rodada),
        )
        return cursor.fetchone()


def salvar_resposta(conexao, id_tentativa: int, id_pergunta: int, id_alternativa: int, rodada: int, acertou: bool) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """INSERT INTO respostas_usuario (id_tentativa, id_pergunta, id_alternativa, rodada, acertou)
               VALUES (%s, %s, %s, %s, %s)""",
            (id_tentativa, id_pergunta, id_alternativa, rodada, acertou),
        )


def respostas_da_tentativa(conexao, id_tentativa: int) -> list[dict]:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_pergunta, rodada, acertou FROM respostas_usuario WHERE id_tentativa = %s",
            (id_tentativa,),
        )
        return cursor.fetchall()
