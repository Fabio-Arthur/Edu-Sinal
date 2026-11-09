import unittest

from src.services.trilha_service import (
    atividade_liberada,
    e_revisao,
    etapa_liberada,
    prova_aprovada,
    prova_liberada,
)


# Uma trilha pequena, só para os testes.
ORDEM = ["alfabeto-manual", "numeros"]
ATIVIDADES = ["um-a-cinco", "pratica-um-a-cinco", "seis-a-dez", "pratica-seis-a-dez", "revisao-numeros"]


class EtapaTests(unittest.TestCase):
    def test_primeira_etapa_ja_vem_aberta(self):
        self.assertTrue(etapa_liberada("alfabeto-manual", ORDEM, []))

    def test_segunda_etapa_fecha_sem_a_prova_da_primeira(self):
        self.assertFalse(etapa_liberada("numeros", ORDEM, []))

    def test_segunda_etapa_abre_depois_da_prova_da_primeira(self):
        self.assertTrue(etapa_liberada("numeros", ORDEM, ["alfabeto-manual:final"]))


class AtividadeTests(unittest.TestCase):
    def setUp(self):
        # Antes de cada teste: a etapa "numeros" já está liberada.
        self.concluidas = ["alfabeto-manual:final"]

    def test_primeira_atividade_ja_vem_aberta(self):
        self.assertTrue(atividade_liberada("numeros", "um-a-cinco", ATIVIDADES, ORDEM, self.concluidas))

    def test_segunda_fecha_sem_a_primeira(self):
        self.assertFalse(atividade_liberada("numeros", "pratica-um-a-cinco", ATIVIDADES, ORDEM, self.concluidas))

    def test_segunda_abre_depois_da_primeira(self):
        self.concluidas.append("numeros:um-a-cinco")

        self.assertTrue(atividade_liberada("numeros", "pratica-um-a-cinco", ATIVIDADES, ORDEM, self.concluidas))

    def test_nada_abre_em_etapa_trancada(self):
        self.assertFalse(atividade_liberada("numeros", "um-a-cinco", ATIVIDADES, ORDEM, []))


class ProvaTests(unittest.TestCase):
    def test_prova_fecha_com_atividade_faltando(self):
        concluidas = ["numeros:um-a-cinco", "numeros:pratica-um-a-cinco"]

        self.assertFalse(prova_liberada("numeros", ATIVIDADES, concluidas))

    def test_prova_abre_com_as_cinco_concluidas(self):
        concluidas = [f"numeros:{atividade}" for atividade in ATIVIDADES]

        self.assertTrue(prova_liberada("numeros", ATIVIDADES, concluidas))

    def test_passa_com_um_erro(self):
        self.assertTrue(prova_aprovada(1))

    def test_reprova_com_dois_erros(self):
        self.assertFalse(prova_aprovada(2))


class RevisaoTests(unittest.TestCase):
    def test_refazer_e_revisao(self):
        self.assertTrue(e_revisao("numeros", "um-a-cinco", ["numeros:um-a-cinco"]))

    def test_primeira_vez_nao_e_revisao(self):
        self.assertFalse(e_revisao("numeros", "um-a-cinco", []))


if __name__ == "__main__":
    unittest.main()
