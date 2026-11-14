# Consultas do mascote (cosmeticos, cosmeticos_usuario e mascote_equipado),
# das missões (missoes_resgatadas) e do dicionário (palavras_vistas).

from datetime import date


# ----- Mascote -----

def todos_os_cosmeticos(conexao) -> list[dict]:
    # Na mesma ordem do app (a vitrine do dia depende dessa ordem).
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            """SELECT cosmeticos.id_cosmetico, cosmeticos.codigo, cosmeticos.tipo_cosmetico,
                      cosmeticos.forma_liberar, cosmeticos.custo_moedas, conquistas.nome AS conquista
               FROM cosmeticos LEFT JOIN conquistas ON conquistas.id_conquista = cosmeticos.id_conquista
               WHERE cosmeticos.status = 'Disponivel'
               ORDER BY cosmeticos.id_cosmetico"""
        )
        return cursor.fetchall()


def itens_do_usuario(conexao, id_usuario: int) -> list[str]:
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT cosmeticos.codigo FROM cosmeticos_usuario
               JOIN cosmeticos ON cosmeticos.id_cosmetico = cosmeticos_usuario.id_cosmetico
               WHERE cosmeticos_usuario.id_usuario = %s""",
            (id_usuario,),
        )
        return [linha[0] for linha in cursor.fetchall()]


def dar_item(conexao, id_usuario: int, id_cosmetico: int, custo_pago: int) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT IGNORE INTO cosmeticos_usuario (id_usuario, id_cosmetico, custo_pago) VALUES (%s, %s, %s)",
            (id_usuario, id_cosmetico, custo_pago),
        )


def visual(conexao, id_usuario: int) -> dict[str, str]:
    # O que o mascote está usando: {"Roupa": "camiseta-azul", "Chapeu": "bone", ...}
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT mascote_equipado.tipo_cosmetico, cosmeticos.codigo FROM mascote_equipado
               JOIN cosmeticos ON cosmeticos.id_cosmetico = mascote_equipado.id_cosmetico
               WHERE mascote_equipado.id_usuario = %s""",
            (id_usuario,),
        )
        return {tipo: codigo for tipo, codigo in cursor.fetchall()}


def vestir(conexao, id_usuario: int, id_cosmetico: int, tipo: str) -> None:
    # Uma peça por parte: se já tinha algo nessa parte, troca.
    with conexao.cursor() as cursor:
        cursor.execute(
            """INSERT INTO mascote_equipado (id_usuario, id_cosmetico, tipo_cosmetico) VALUES (%s, %s, %s)
               ON DUPLICATE KEY UPDATE id_cosmetico = VALUES(id_cosmetico)""",
            (id_usuario, id_cosmetico, tipo),
        )


def tirar(conexao, id_usuario: int, tipo: str) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "DELETE FROM mascote_equipado WHERE id_usuario = %s AND tipo_cosmetico = %s",
            (id_usuario, tipo),
        )


# ----- Missões -----

def missoes_resgatadas(conexao, id_usuario: int, periodo: date) -> list[int]:
    with conexao.cursor() as cursor:
        cursor.execute(
            "SELECT id_missao FROM missoes_resgatadas WHERE id_usuario = %s AND data_periodo = %s",
            (id_usuario, periodo),
        )
        return [linha[0] for linha in cursor.fetchall()]


def resgatar_missao(conexao, id_usuario: int, id_missao: int, periodo: date) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT INTO missoes_resgatadas (id_usuario, id_missao, data_periodo) VALUES (%s, %s, %s)",
            (id_usuario, id_missao, periodo),
        )


# ----- Dicionário -----

def buscar_palavra(conexao, codigo: str) -> int | None:
    # O código é igual ao do app ("bom-dia", "letra-a"). Maiúscula ou minúscula tanto faz.
    with conexao.cursor() as cursor:
        cursor.execute("SELECT id_palavra FROM palavras_dicionario WHERE codigo = %s", (codigo.lower(),))
        linha = cursor.fetchone()
    return linha[0] if linha else None


def palavras_desbloqueadas(conexao, id_usuario: int) -> list[str]:
    # Códigos dos sinais ensinados nas atividades de aprender que o usuário já concluiu.
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT DISTINCT palavras_dicionario.codigo
               FROM progresso_trilha
               JOIN atividades ON atividades.id_atividade = progresso_trilha.id_atividade
               JOIN cartoes ON cartoes.id_atividade = atividades.id_atividade
               JOIN palavras_dicionario ON palavras_dicionario.id_palavra = cartoes.id_palavra
               WHERE progresso_trilha.id_usuario = %s AND atividades.tipo = 'Aprender'""",
            (id_usuario,),
        )
        return [linha[0] for linha in cursor.fetchall()]


def marcar_vista(conexao, id_usuario: int, id_palavra: int, dia: date) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT IGNORE INTO palavras_vistas (id_usuario, id_palavra, data_vista) VALUES (%s, %s, %s)",
            (id_usuario, id_palavra, dia),
        )


def vistas(conexao, id_usuario: int, dia: date | None = None) -> list[str]:
    # Sinais vistos (sem repetir). Com "dia", só os daquele dia.
    sql = """SELECT DISTINCT palavras_dicionario.codigo FROM palavras_vistas
             JOIN palavras_dicionario ON palavras_dicionario.id_palavra = palavras_vistas.id_palavra
             WHERE palavras_vistas.id_usuario = %s"""
    valores = [id_usuario]
    if dia is not None:
        sql += " AND palavras_vistas.data_vista = %s"
        valores.append(dia)
    with conexao.cursor() as cursor:
        cursor.execute(sql, tuple(valores))
        return [linha[0] for linha in cursor.fetchall()]
