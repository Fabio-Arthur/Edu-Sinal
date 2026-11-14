import certifi
from mysql.connector import connect
from mysql.connector.abstracts import MySQLConnectionAbstract

from src.settings.settings import settings


def conectar() -> MySQLConnectionAbstract:
    """Abre uma conexão nova"""
    opcoes = {}
    if settings.db_ssl:
        # Conexão criptografada, conferindo o certificado do banco
        # (assim ninguém no meio do caminho finge ser o banco).
        opcoes = {
            "ssl_ca": certifi.where(),
            "ssl_verify_cert": True,
            "ssl_verify_identity": True,
        }
    return connect(
        host=settings.db_host,
        port=settings.db_port,
        user=settings.db_user,
        password=settings.db_password,
        database=settings.db_name,
        **opcoes,
    )
