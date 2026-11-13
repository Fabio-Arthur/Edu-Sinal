# Consultas das tabelas "progresso_usuario", "atividade_diaria" e "xp_semanal".

from datetime import date


def ler(conexao, id_usuario: int) -> dict:
    # "FOR UPDATE" trava a linha até o commit: se chegarem dois pedidos ao
    # mesmo tempo, o segundo espera o primeiro terminar (nada de moeda em dobro).
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT xp, moedas, vidas, proxima_vida, energia, proxima_energia,
                      data_recarga_energia, sequencia_dias, data_ultima_atividade,
                      protetores, id_liga, ganhou_bonus_primeira, data_premio_desafio
               FROM progresso_usuario WHERE id_usuario = %s FOR UPDATE""",
            (id_usuario,),
        )
        return cursor.fetchone()


def salvar(conexao, id_usuario: int, progresso: dict) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            """UPDATE progresso_usuario
               SET xp = %s, moedas = %s, vidas = %s, proxima_vida = %s,
                   energia = %s, proxima_energia = %s, data_recarga_energia = %s,
                   sequencia_dias = %s, data_ultima_atividade = %s, protetores = %s,
                   id_liga = %s, ganhou_bonus_primeira = %s, data_premio_desafio = %s
               WHERE id_usuario = %s""",
            (
                progresso["xp"], progresso["moedas"], progresso["vidas"], progresso["proxima_vida"],
                progresso["energia"], progresso["proxima_energia"], progresso["data_recarga_energia"],
                progresso["sequencia_dias"], progresso["data_ultima_atividade"], progresso["protetores"],
                progresso["id_liga"], progresso["ganhou_bonus_primeira"], progresso["data_premio_desafio"],
                id_usuario,
            ),
        )


# ----- Dias (meta do dia, missões e calendário da ofensiva) -----

def somar_no_dia(conexao, id_usuario: int, dia: date, atividades: int, xp: int) -> None:
    # Se o dia ainda não existe, cria; se existe, soma (ON DUPLICATE KEY UPDATE).
    with conexao.cursor() as cursor:
        cursor.execute(
            """INSERT INTO atividade_diaria (id_usuario, data_atividade, tipo_dia, atividades_feitas, xp_ganho)
               VALUES (%s, %s, 'Praticou', %s, %s)
               ON DUPLICATE KEY UPDATE tipo_dia = 'Praticou',
                   atividades_feitas = atividades_feitas + VALUES(atividades_feitas),
                   xp_ganho = xp_ganho + VALUES(xp_ganho)""",
            (id_usuario, dia, atividades, xp),
        )


def marcar_dia_salvo(conexao, id_usuario: int, dia: date) -> None:
    # Um dia salvo pelo protetor (aparece com escudo no calendário).
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT IGNORE INTO atividade_diaria (id_usuario, data_atividade, tipo_dia) VALUES (%s, %s, 'Protetor')",
            (id_usuario, dia),
        )


def ler_dia(conexao, id_usuario: int, dia: date) -> dict:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT atividades_feitas, xp_ganho FROM atividade_diaria WHERE id_usuario = %s AND data_atividade = %s",
            (id_usuario, dia),
        )
        return cursor.fetchone() or {"atividades_feitas": 0, "xp_ganho": 0}


def todos_os_dias(conexao, id_usuario: int) -> list[dict]:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT data_atividade, tipo_dia FROM atividade_diaria WHERE id_usuario = %s ORDER BY data_atividade",
            (id_usuario,),
        )
        return cursor.fetchall()


# ----- Semana (liga) -----

def ler_semana(conexao, id_usuario: int, segunda: date) -> dict | None:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_liga, grupo, xp, resultado FROM xp_semanal WHERE id_usuario = %s AND data_semana = %s",
            (id_usuario, segunda),
        )
        return cursor.fetchone()


def alunos_por_grupo(conexao, segunda: date, id_liga: int) -> dict[int, int]:
    # Quantos alunos cada grupo da liga já tem nesta semana: {1: 20, 2: 7}.
    # Visitantes não ocupam vaga (eles não aparecem no ranking).
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT xp_semanal.grupo, COUNT(*) FROM xp_semanal
               JOIN usuarios ON usuarios.id_usuario = xp_semanal.id_usuario
               WHERE xp_semanal.data_semana = %s AND xp_semanal.id_liga = %s AND usuarios.email IS NOT NULL
               GROUP BY xp_semanal.grupo""",
            (segunda, id_liga),
        )
        return {grupo: total for grupo, total in cursor.fetchall()}


def somar_na_semana(conexao, id_usuario: int, segunda: date, id_liga: int, grupo: int, xp: int) -> None:
    # Só entra no ranking da semana quem ganhou XP nela. O grupo só vale
    # no primeiro XP da semana: depois, o aluno fica no mesmo grupo.
    with conexao.cursor() as cursor:
        cursor.execute(
            """INSERT INTO xp_semanal (id_usuario, data_semana, id_liga, grupo, xp) VALUES (%s, %s, %s, %s, %s)
               ON DUPLICATE KEY UPDATE xp = xp + VALUES(xp)""",
            (id_usuario, segunda, id_liga, grupo, xp),
        )


def fechar_semana(conexao, id_usuario: int, segunda: date, resultado: str) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "UPDATE xp_semanal SET resultado = %s WHERE id_usuario = %s AND data_semana = %s",
            (resultado, id_usuario, segunda),
        )


def ranking(conexao, segunda: date, id_liga: int, grupo: int, id_usuario: int) -> list[dict]:
    # Todo mundo que jogou nesse grupo da liga nessa semana. Só o apelido sai daqui:
    # nada de e-mail ou outro dado pessoal.
    # Visitantes (email NULL) não entram no ranking dos outros: cada visitante
    # vê só a si mesmo junto com os alunos de verdade.
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT usuarios.id_usuario, usuarios.nome, xp_semanal.xp
               FROM xp_semanal JOIN usuarios ON usuarios.id_usuario = xp_semanal.id_usuario
               WHERE xp_semanal.data_semana = %s AND xp_semanal.id_liga = %s AND xp_semanal.grupo = %s
                 AND (usuarios.email IS NOT NULL OR usuarios.id_usuario = %s)""",
            (segunda, id_liga, grupo, id_usuario),
        )
        return cursor.fetchall()
