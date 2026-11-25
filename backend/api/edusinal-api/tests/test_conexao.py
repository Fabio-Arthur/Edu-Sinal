# Testes do pool de conexões (src/database/conexao.py), com conexões de mentira:
# não precisa de banco.

import queue

import pytest

from src.database import conexao as modulo


class ConexaoDeMentira:
    def __init__(self, viva=True):
        self.viva = viva
        self.rollbacks = 0
        self.fechada = False

    def ping(self, reconnect=False):
        if not self.viva:
            raise ConnectionError("o banco fechou")

    def rollback(self):
        if not self.viva:
            raise ConnectionError("o banco fechou")
        self.rollbacks += 1

    def close(self):
        self.fechada = True


@pytest.fixture
def abertas(monkeypatch):
    # Gaveta vazia em cada teste e um "abrir" que anota cada conexão nova.
    lista = []

    def abrir():
        lista.append(ConexaoDeMentira())
        return lista[-1]

    monkeypatch.setattr(modulo, "_gaveta", queue.LifoQueue())
    monkeypatch.setattr(modulo, "abrir_conexao", abrir)
    return lista


def test_reaproveita_a_conexao(abertas):
    with modulo.conectar() as primeira:
        pass
    with modulo.conectar() as segunda:
        pass
    assert primeira is segunda
    assert len(abertas) == 1  # abriu só uma vez


def test_devolve_com_rollback_para_soltar_as_travas(abertas):
    with modulo.conectar() as conexao:
        pass
    assert conexao.rollbacks == 1
    assert not conexao.fechada


def test_devolve_mesmo_se_a_rota_der_erro(abertas):
    with pytest.raises(ValueError):
        with modulo.conectar():
            raise ValueError("erro na rota")
    with modulo.conectar():
        pass
    assert len(abertas) == 1


def test_pedidos_ao_mesmo_tempo_ganham_conexoes_diferentes(abertas):
    with modulo.conectar() as primeira, modulo.conectar() as segunda:
        assert primeira is not segunda
    assert len(abertas) == 2


def test_conexao_quebrada_nao_volta_para_a_gaveta(abertas):
    with modulo.conectar() as conexao:
        conexao.viva = False  # o banco caiu no meio
    assert conexao.fechada
    with modulo.conectar() as nova:
        pass
    assert nova is not conexao


def test_conexao_parada_e_morta_e_trocada(abertas, monkeypatch):
    with modulo.conectar() as velha:
        pass
    velha.viva = False  # o banco fechou enquanto ela estava parada
    monkeypatch.setattr(modulo, "TESTAR_SE_PARADA_HA", 0)  # força o ping
    with modulo.conectar() as nova:
        pass
    assert nova is not velha
    assert velha.fechada


def test_gaveta_nao_guarda_mais_que_o_limite(abertas, monkeypatch):
    monkeypatch.setattr(modulo, "GUARDAR_NO_MAXIMO", 2)
    with modulo.conectar(), modulo.conectar(), modulo.conectar():
        pass
    assert modulo._gaveta.qsize() == 2
    assert sum(conexao.fechada for conexao in abertas) == 1
