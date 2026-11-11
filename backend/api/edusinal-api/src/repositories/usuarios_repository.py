# Consultas das tabelas "usuarios" e "sessoes".
#
# Regra de ouro: o que o usuário digitou NUNCA entra colado no SQL.
# Sempre usamos %s e passamos os valores separados, numa tupla.
# Assim ninguém consegue "injetar" comandos no banco (SQL injection).
#
# Todas as funções recebem a "conexao" já aberta. Quem abre, salva (commit)
# e fecha é a rota, para várias consultas virarem uma coisa só.

from datetime import datetime


def cadastrar(conexao, nome: str, email: str, senha_hash: str, meta_diaria: int) -> int:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha_hash, meta_diaria) VALUES (%s, %s, %s, %s)",
            (nome, email, senha_hash, meta_diaria),
        )
        id_usuario = cursor.lastrowid

        # Todo usuário novo já nasce com o progresso zerado (e 20 moedas de boas-vindas).
        cursor.execute("INSERT INTO progresso_usuario (id_usuario) VALUES (%s)", (id_usuario,))
    return id_usuario


def buscar_por_email(conexao, email: str) -> dict | None:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_usuario, nome, email, senha_hash, meta_diaria, status_conta FROM usuarios WHERE email = %s",
            (email,),
        )
        return cursor.fetchone()


def buscar_por_id(conexao, id_usuario: int) -> dict | None:
    with conexao.cursor(dictionary=True) as cursor:
        cursor.execute(
            "SELECT id_usuario, nome, email, meta_diaria, status_conta FROM usuarios WHERE id_usuario = %s",
            (id_usuario,),
        )
        return cursor.fetchone()


def mudar_perfil(conexao, id_usuario: int, nome: str, meta_diaria: int) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "UPDATE usuarios SET nome = %s, meta_diaria = %s WHERE id_usuario = %s",
            (nome, meta_diaria, id_usuario),
        )


def apagar(conexao, id_usuario: int) -> None:
    # Graças ao ON DELETE CASCADE do banco, isso apaga também tudo que é do usuário.
    with conexao.cursor() as cursor:
        cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))


# ----- Sessões (quem está logado) -----

def criar_sessao(conexao, token_hash: str, id_usuario: int, expira_em: datetime) -> None:
    with conexao.cursor() as cursor:
        cursor.execute(
            "INSERT INTO sessoes (id_usuario, token_hash, data_expiracao) VALUES (%s, %s, %s)",
            (id_usuario, token_hash, expira_em),
        )


def usuario_da_sessao(conexao, token_hash: str, agora: datetime) -> int | None:
    # Devolve o id do usuário dono da sessão, se ela existir e não tiver vencido.
    with conexao.cursor() as cursor:
        cursor.execute(
            """SELECT sessoes.id_usuario FROM sessoes
               JOIN usuarios ON usuarios.id_usuario = sessoes.id_usuario
               WHERE sessoes.token_hash = %s AND sessoes.data_expiracao > %s
                 AND usuarios.status_conta = 'Ativo'""",
            (token_hash, agora),
        )
        linha = cursor.fetchone()
    return linha[0] if linha else None


def apagar_sessao(conexao, token_hash: str) -> None:
    with conexao.cursor() as cursor:
        cursor.execute("DELETE FROM sessoes WHERE token_hash = %s", (token_hash,))
