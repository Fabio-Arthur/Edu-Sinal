# Testes das regras que não dependem do banco:
# energia (gastar), senha, missões, lojinha, ligas, dicionário e desafio.

import unittest
from datetime import date, datetime, timedelta

import pytest

from src.services import (
    desafio_service,
    dicionario_service,
    energia_service,
    ligas_service,
    lojinha_service,
    missoes_service,
    senha_service,
)


class GastarEnergiaTests(unittest.TestCase):
    def test_gasta_uma_e_liga_o_relogio(self):
        agora = datetime(2026, 11, 8, 10, 0)
        energia, proxima = energia_service.gastar_energia(5, None, agora)

        self.assertEqual(energia, 4)
        self.assertEqual(proxima, agora + timedelta(hours=3))


class SenhaTests(unittest.TestCase):
    def test_senha_forte_passa(self):
        self.assertIsNone(senha_service.problema_na_senha("Exemplo#2026"))

    def test_senha_simples_e_comprida_passa(self):
        # Como no Duolingo: não precisa de maiúscula, número nem símbolo.
        self.assertIsNone(senha_service.problema_na_senha("gato de botas"))

    def test_senha_obvia_nao_passa(self):
        self.assertIsNotNone(senha_service.problema_na_senha("12345678"))
        self.assertIsNotNone(senha_service.problema_na_senha("aaaaaaaa"))

    def test_senha_igual_ao_apelido_nao_passa(self):
        self.assertIsNotNone(senha_service.problema_na_senha("marinaaa", apelido="Marinaaa"))

    def test_senha_curta_nao_passa(self):
        self.assertIsNotNone(senha_service.problema_na_senha("Ex#1"))

    def test_apelido_de_uma_letra_nao_passa(self):
        self.assertIsNotNone(senha_service.problema_no_apelido("M"))

    def test_hash_confere_a_senha_certa_e_recusa_a_errada(self):
        guardado = senha_service.gerar_hash("Exemplo#2026")

        self.assertNotIn("Exemplo#2026", guardado)  # a senha não aparece no hash
        self.assertTrue(senha_service.conferir_senha("Exemplo#2026", guardado))
        self.assertFalse(senha_service.conferir_senha("Exemplo#2027", guardado))

    def test_mesma_senha_gera_hashes_diferentes(self):
        # Por causa do "sal" aleatório.
        self.assertNotEqual(senha_service.gerar_hash("Exemplo#2026"), senha_service.gerar_hash("Exemplo#2026"))


class MissoesTests(unittest.TestCase):
    def test_missoes_seguem_a_meta_diaria(self):
        missoes = missoes_service.missoes_do_dia(meta_diaria=5, atividades_hoje=2, xp_hoje=40, sinais_vistos_hoje=0)

        self.assertEqual(missoes[0]["alvo"], 5)
        self.assertEqual(missoes[1]["alvo"], 100)  # 5 × 20 XP

    def test_so_resgata_missao_completa_e_nao_resgatada(self):
        missao = {"id": "dicionario", "alvo": 3, "progresso": 3}

        self.assertTrue(missoes_service.pode_resgatar(missao, []))
        self.assertFalse(missoes_service.pode_resgatar(missao, ["dicionario"]))


# Os itens vendidos por moedas, na mesma ordem do app e do banco.
ITENS_A_VENDA = [
    {"id": codigo, "parte": parte, "jeito": "moedas", "preco": preco}
    for codigo, parte, preco in [
        ("camiseta-coral", "Roupa", 20), ("camiseta-amarela", "Roupa", 20), ("camiseta-listrada", "Roupa", 35),
        ("chapeu-festa", "Chapeu", 30), ("tiara-flores", "Chapeu", 40), ("oculos-sol", "Rosto", 30),
        ("estrela-coral", "Peito", 25), ("flor-amarela", "Peito", 40), ("folha-azul", "Peito", 60),
        ("fundo-ceu", "Fundo", 20), ("fundo-mar", "Fundo", 30), ("fundo-por-do-sol", "Fundo", 30), ("fundo-sol", "Fundo", 30),
    ]
]


class LojinhaTests(unittest.TestCase):
    def test_vitrine_igual_a_do_app(self):
        # O app (js/telas-lojinha.js) mostra estes 3 itens em 01/11/2026.
        vitrine = lojinha_service.vitrine_do_dia(date(2026, 11, 1), ITENS_A_VENDA)

        self.assertEqual([item["id"] for item in vitrine], ["fundo-mar", "oculos-sol", "estrela-coral"])

    def test_vitrine_tem_tres_itens_de_partes_diferentes(self):
        vitrine = lojinha_service.vitrine_do_dia(date(2026, 11, 8), ITENS_A_VENDA)
        partes = [item["parte"] for item in vitrine]

        self.assertEqual(len(vitrine), 3)
        self.assertEqual(len(set(partes)), 3)

    def test_vitrine_e_igual_no_mesmo_dia(self):
        primeira = lojinha_service.vitrine_do_dia(date(2026, 11, 8), ITENS_A_VENDA)
        segunda = lojinha_service.vitrine_do_dia(date(2026, 11, 8), ITENS_A_VENDA)

        self.assertEqual(primeira, segunda)

    def test_sem_moedas_nao_compra(self):
        motivo = lojinha_service.motivo_para_nao_comprar_ajuda("recarga-vidas", 10, 1, 5, 0, False)

        self.assertEqual(motivo, "Moedas insuficientes.")

    def test_recarga_de_energia_so_uma_por_dia(self):
        motivo = lojinha_service.motivo_para_nao_comprar_ajuda("recarga-energia", 100, 3, 2, 0, True)

        self.assertIsNotNone(motivo)

    def test_no_maximo_dois_protetores(self):
        motivo = lojinha_service.motivo_para_nao_comprar_ajuda("protetor-ofensiva", 100, 3, 5, 2, False)

        self.assertIsNotNone(motivo)


class LigasTests(unittest.TestCase):
    def test_broches_vem_das_conquistas(self):
        # primeiro exercício, 5 exercícios, 10 sinais vistos e 3 itens
        self.assertTrue(ligas_service.conquista_liberada("primeiro", 0, 0, 0, exercicios=1))
        self.assertFalse(ligas_service.conquista_liberada("cinco", 0, 0, 0, exercicios=4))
        self.assertTrue(ligas_service.conquista_liberada("cinco", 0, 0, 0, exercicios=5))
        self.assertFalse(ligas_service.conquista_liberada("explorador", 0, 0, 0, sinais_vistos=9))
        self.assertTrue(ligas_service.conquista_liberada("colecionador", 0, 0, 0, itens=3))

    def test_na_bronze_ninguem_desce(self):
        self.assertEqual(ligas_service.zona(10, 10, liga=0), "fica")
        self.assertEqual(ligas_service.zona(10, 10, liga=1), "desce")
        self.assertEqual(ligas_service.nova_liga(0, 10, 10), 0)

    def test_no_diamante_ninguem_sobe(self):
        self.assertEqual(ligas_service.zona(1, 10, liga=4), "fica")
        self.assertEqual(ligas_service.zona(1, 10, liga=3), "sobe")

    def test_primeiro_aluno_abre_o_grupo_1(self):
        self.assertEqual(ligas_service.grupo_com_vaga({}), 1)

    def test_entra_no_grupo_que_tem_vaga(self):
        self.assertEqual(ligas_service.grupo_com_vaga({1: 10, 2: 7}), 2)

    def test_grupos_cheios_abrem_um_novo(self):
        self.assertEqual(ligas_service.grupo_com_vaga({1: 10, 2: 10}), 3)

    def test_vaga_que_abriu_num_grupo_antigo_e_usada_primeiro(self):
        self.assertEqual(ligas_service.grupo_com_vaga({1: 9, 2: 10}), 1)

    def test_ranking_ordena_pelo_xp(self):
        ranking = ligas_service.montar_ranking([
            {"id_aluno": 1, "apelido": "Ana", "xp": 40},
            {"id_aluno": 2, "apelido": "Bia", "xp": 100},
        ])

        self.assertEqual(ranking[0]["apelido"], "Bia")
        self.assertEqual(ranking[0]["posicao"], 1)

    def test_tres_primeiros_sobem(self):
        self.assertEqual(ligas_service.nova_liga(0, posicao=3, total=10), 1)

    def test_dois_ultimos_descem(self):
        self.assertEqual(ligas_service.nova_liga(2, posicao=10, total=10), 1)

    def test_nao_desce_do_bronze_nem_sobe_do_diamante(self):
        self.assertEqual(ligas_service.nova_liga(0, posicao=10, total=10), 0)
        self.assertEqual(ligas_service.nova_liga(4, posicao=1, total=10), 4)

    def test_quem_nao_jogou_fica_na_mesma_liga(self):
        self.assertEqual(ligas_service.nova_liga(2, posicao=0, total=10), 2)


class DicionarioTests(unittest.TestCase):
    def test_alfabeto_sempre_aberto(self):
        self.assertTrue(dicionario_service.sinal_aberto("letra-z", []))
        self.assertTrue(dicionario_service.sinal_aberto("Letra-A", []))

    def test_palavra_so_abre_depois_de_desbloqueada(self):
        self.assertFalse(dicionario_service.sinal_aberto("bom-dia", []))
        self.assertTrue(dicionario_service.sinal_aberto("bom-dia", ["bom-dia"]))


class DesafioTests(unittest.TestCase):
    def test_abre_com_um_exercicio_concluido(self):
        self.assertFalse(desafio_service.desafio_liberado(4))
        self.assertTrue(desafio_service.desafio_liberado(5))

    def test_sorteio_igual_com_a_mesma_semente(self):
        perguntas = [{"id_pergunta": numero} for numero in range(20)]

        primeiro = desafio_service.sortear_perguntas(perguntas, semente=7)
        segundo = desafio_service.sortear_perguntas(perguntas, semente=7)

        self.assertEqual(primeiro, segundo)
        self.assertEqual(len(primeiro), 5)

    def test_premio_so_uma_vez_por_dia(self):
        self.assertTrue(desafio_service.ganhou_premio(erros=1, ja_ganhou_hoje=False))
        self.assertFalse(desafio_service.ganhou_premio(erros=1, ja_ganhou_hoje=True))
        self.assertFalse(desafio_service.ganhou_premio(erros=2, ja_ganhou_hoje=False))


if __name__ == "__main__":
    unittest.main()


# ----- Cadastro: a caixinha "Li e aceito os termos de uso" -----

def test_cadastro_exige_aceitar_os_termos():
    from fastapi import HTTPException
    from src.controllers.auth_controller import conferir_cadastro
    from src.schemas.entradas import Cadastro

    dados = {"apelido": "Teste", "email": "teste@exemplo.com", "senha": "uma frase longa aqui"}
    with pytest.raises(HTTPException):
        conferir_cadastro(Cadastro(**dados))  # sem marcar a caixinha
    conferir_cadastro(Cadastro(**dados, aceitou_termos=True))  # marcada: passa


# ----- Cartão do aluno na liga -----

def test_conquistas_ganhas_conta_as_sete_regras():
    # Nada feito: nenhuma conquista.
    assert ligas_service.conquistas_ganhas(0, 0, 0, 0, 0, 0) == 0
    # 1 exercício e 3 itens: "primeiro" e "colecionador".
    assert ligas_service.conquistas_ganhas(0, 0, 0, 1, 0, 3) == 2
    # Tudo cumprido: as 7.
    assert ligas_service.conquistas_ganhas(1, 7, 1, 5, 10, 3) == 7


def test_etapa_atual_e_a_primeira_sem_prova_final():
    etapas = ["alfabeto-manual", "numeros", "apresentacoes"]
    assert ligas_service.etapa_atual(etapas, []) == "alfabeto-manual"
    assert ligas_service.etapa_atual(etapas, ["alfabeto-manual:vogais", "alfabeto-manual:final"]) == "numeros"
    assert ligas_service.etapa_atual(etapas, [f"{e}:final" for e in etapas]) is None
