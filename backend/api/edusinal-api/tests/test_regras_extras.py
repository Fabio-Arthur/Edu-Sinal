# Testes das regras que não dependem do banco:
# energia (gastar), senha, missões, lojinha, ligas, dicionário, desafio e conteúdo.

import unittest
from datetime import date, datetime, timedelta

from src.services import (
    conteudo_service,
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

    def test_senha_sem_simbolo_nao_passa(self):
        self.assertIsNotNone(senha_service.problema_na_senha("Exemplo2026"))

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


class LojinhaTests(unittest.TestCase):
    def test_vitrine_tem_tres_itens_de_partes_diferentes(self):
        vitrine = lojinha_service.vitrine_do_dia(date(2026, 11, 8), conteudo_service.ITENS)
        partes = [item["parte"] for item in vitrine]

        self.assertEqual(len(vitrine), 3)
        self.assertEqual(len(set(partes)), 3)

    def test_vitrine_e_igual_no_mesmo_dia(self):
        primeira = lojinha_service.vitrine_do_dia(date(2026, 11, 8), conteudo_service.ITENS)
        segunda = lojinha_service.vitrine_do_dia(date(2026, 11, 8), conteudo_service.ITENS)

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
        self.assertTrue(dicionario_service.sinal_aberto("Letra Z", []))

    def test_palavra_abre_depois_da_atividade_de_aprender(self):
        sinais = {"numeros:um-a-cinco": ["1", "2"]}

        self.assertEqual(dicionario_service.sinais_desbloqueados([], sinais), [])
        self.assertEqual(dicionario_service.sinais_desbloqueados(["numeros:um-a-cinco"], sinais), ["1", "2"])


class DesafioTests(unittest.TestCase):
    def test_precisa_de_cinco_sinais(self):
        self.assertFalse(desafio_service.desafio_liberado(["A", "B", "C", "D"]))
        self.assertTrue(desafio_service.desafio_liberado(["A", "B", "C", "D", "E"]))

    def test_perguntas_sorteadas_tem_a_resposta_certa_nas_opcoes(self):
        sinais = ["Letra A", "Letra E", "Letra I", "Letra O", "Letra U"]
        nomes = {sinal: sinal.replace("Letra ", "") for sinal in sinais}
        perguntas = desafio_service.sortear_perguntas(sinais, nomes)

        self.assertEqual(len(perguntas), 5)
        for pergunta in perguntas:
            certa = pergunta["opcoes"][pergunta["resposta_certa"]]
            self.assertEqual(certa, nomes[pergunta["sinal"]])

    def test_premio_so_uma_vez_por_dia(self):
        self.assertTrue(desafio_service.ganhou_premio(erros=1, ja_ganhou_hoje=False))
        self.assertFalse(desafio_service.ganhou_premio(erros=1, ja_ganhou_hoje=True))
        self.assertFalse(desafio_service.ganhou_premio(erros=2, ja_ganhou_hoje=False))


class ConteudoTests(unittest.TestCase):
    def test_trilha_tem_oito_etapas_com_cinco_atividades(self):
        self.assertEqual(len(conteudo_service.ETAPAS), 8)
        for etapa in conteudo_service.ETAPAS:
            self.assertEqual(len(etapa["atividades"]), 5)

    def test_prova_tem_seis_perguntas(self):
        prova = conteudo_service.buscar_atividade("numeros:final")

        self.assertEqual(len(prova["perguntas"]), 6)

    def test_app_nao_recebe_o_gabarito(self):
        atividade = conteudo_service.buscar_atividade("numeros:pratica-um-a-cinco")
        seguras = conteudo_service.perguntas_sem_gabarito(atividade["perguntas"])

        for pergunta in seguras:
            self.assertNotIn("resposta_certa", pergunta)
        self.assertIn("resposta_certa", atividade["perguntas"][0])  # o original não muda


if __name__ == "__main__":
    unittest.main()
