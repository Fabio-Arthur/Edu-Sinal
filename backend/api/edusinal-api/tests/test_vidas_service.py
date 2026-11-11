import unittest
from datetime import datetime, timedelta

from src.services.vidas_service import (
    SemVidasDisponiveis,
    calcular_resposta,
    perder_vida,
    recuperar_vidas,
)


class RecuperacaoDeVidasTests(unittest.TestCase):
    def test_recupera_uma_vida_apos_trinta_minutos(self):
        agora = datetime(2026, 10, 5, 12, 30)
        vidas, proxima = recuperar_vidas(2, agora - timedelta(minutes=30), agora)

        self.assertEqual(vidas, 3)
        self.assertIsNone(proxima)

    def test_mantem_contagem_ate_o_tempo_de_recuperacao(self):
        agora = datetime(2026, 10, 5, 12, 29)
        proxima = datetime(2026, 10, 5, 12, 30)
        vidas, recuperacao = recuperar_vidas(2, proxima, agora)

        self.assertEqual(vidas, 2)
        self.assertEqual(recuperacao, proxima)

    def test_resposta_errada_consume_uma_vida_sem_recompensa(self):
        agora = datetime(2026, 10, 5, 12, 0)
        resultado = calcular_resposta(
            xp=100,
            moedas=20,
            vidas=3,
            proxima_vida_em=None,
            correta=False,
            atividade_ja_concluida=False,
            primeira_atividade=True,
            agora=agora,
        )

        self.assertEqual(resultado.vidas, 2)
        self.assertEqual(resultado.xp, 100)
        self.assertEqual(resultado.moedas, 20)
        self.assertEqual(resultado.proxima_vida_em, agora + timedelta(minutes=30))

    def test_resposta_correta_recompensa_uma_vez(self):
        agora = datetime(2026, 10, 5, 12, 0)
        resultado = calcular_resposta(
            xp=100,
            moedas=20,
            vidas=2,
            proxima_vida_em=agora + timedelta(minutes=10),
            correta=True,
            atividade_ja_concluida=False,
            primeira_atividade=True,
            agora=agora,
        )

        self.assertEqual(resultado.xp, 120)
        self.assertEqual(resultado.moedas, 35)
        self.assertEqual(resultado.vidas, 2)
        self.assertEqual(resultado.moedas_ganhas, 15)
        self.assertTrue(resultado.atividade_concluida)

    def test_atividade_nova_depois_da_primeira_da_cinco_moedas(self):
        agora = datetime(2026, 10, 5, 12, 0)
        resultado = calcular_resposta(
            xp=100,
            moedas=20,
            vidas=3,
            proxima_vida_em=None,
            correta=True,
            atividade_ja_concluida=False,
            primeira_atividade=False,
            agora=agora,
        )

        self.assertEqual(resultado.moedas_ganhas, 5)
        self.assertEqual(resultado.moedas, 25)

    def test_vida_zero_bloqueia_nova_tentativa_pontuada(self):
        agora = datetime(2026, 10, 5, 12, 0)
        with self.assertRaises(SemVidasDisponiveis):
            calcular_resposta(
                xp=100,
                moedas=20,
                vidas=0,
                proxima_vida_em=agora + timedelta(minutes=10),
                correta=True,
                atividade_ja_concluida=False,
                primeira_atividade=True,
                agora=agora,
            )


class PerderVidaTests(unittest.TestCase):
    def test_errar_tira_uma_vida_e_liga_o_relogio(self):
        agora = datetime(2026, 10, 5, 12, 0)
        vidas, proxima = perder_vida(3, None, agora)

        self.assertEqual(vidas, 2)
        self.assertEqual(proxima, agora + timedelta(minutes=30))

    def test_nunca_fica_negativo(self):
        vidas, _ = perder_vida(0, None, datetime(2026, 10, 5, 12, 0))

        self.assertEqual(vidas, 0)


if __name__ == "__main__":
    unittest.main()