# Conexões com o banco, REAPROVEITADAS (um "pool" de conexões).
#
# Por quê: publicado, ABRIR uma conexão com o banco na nuvem custa ~0,7 s
# (conexão criptografada num servidor grátis bem fraco), e quase todo clique
# abria duas. Medido em 25/11/2026: cada clique levava ~1,7 s, quase tudo só
# abrindo conexão; cada consulta em si leva ~10 ms.
#
# Como funciona: quando uma rota termina, a conexão não é fechada; ela volta
# para uma "gaveta" e o próximo pedido usa a mesma. As rotas continuam iguais:
#     with conectar() as conexao:
#         ...
#         conexao.commit()
#
# Cuidados:
#   - ao devolver, sempre faz rollback: o que não teve commit é desfeito e as
#     travas (FOR UPDATE) são soltas, igual acontecia ao fechar a conexão;
#   - conexão parada há um tempo é testada (ping) antes de usar; se o banco
#     já fechou ela, abre outra;
#   - nunca falta conexão: se a gaveta estiver vazia (muita gente ao mesmo
#     tempo), abre uma nova; se ela estiver cheia, a que sobra é fechada.

import queue
import time
from contextlib import contextmanager

import certifi
from mysql.connector import connect

from src.settings.settings import settings


GUARDAR_NO_MAXIMO = 8      # conexões paradas na gaveta, esperando o próximo pedido
TESTAR_SE_PARADA_HA = 5    # segundos: conexão parada há mais tempo que isso leva um ping antes

# Gaveta de conexões livres: (hora em que voltou, conexão). LIFO = usa primeiro
# a que voltou por último (a mais "fresca"). A fila já é segura com vários
# pedidos ao mesmo tempo (cada conexão é usada por um pedido de cada vez).
_gaveta: queue.LifoQueue = queue.LifoQueue()


def abrir_conexao():
    """Abre uma conexão nova (a parte lenta, publicado)."""
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


def _fechar(conexao) -> None:
    try:
        conexao.close()
    except Exception:
        pass  # já estava quebrada: só deixa para lá


def _pegar():
    while True:
        try:
            voltou_em, conexao = _gaveta.get_nowait()
        except queue.Empty:
            return abrir_conexao()  # gaveta vazia: abre uma nova
        if time.monotonic() - voltou_em < TESTAR_SE_PARADA_HA:
            return conexao
        try:
            conexao.ping(reconnect=False)  # ainda está viva?
            return conexao
        except Exception:
            _fechar(conexao)  # o banco fechou: joga fora e tenta a próxima


def _devolver(conexao) -> None:
    try:
        conexao.rollback()  # desfaz o que não teve commit e solta as travas
    except Exception:
        _fechar(conexao)  # conexão quebrada não volta para a gaveta
        return
    if _gaveta.qsize() < GUARDAR_NO_MAXIMO:
        _gaveta.put((time.monotonic(), conexao))
    else:
        _fechar(conexao)


@contextmanager
def conectar():
    """Empresta uma conexão; no fim do "with", ela volta para a gaveta."""
    conexao = _pegar()
    try:
        yield conexao
    finally:
        _devolver(conexao)
