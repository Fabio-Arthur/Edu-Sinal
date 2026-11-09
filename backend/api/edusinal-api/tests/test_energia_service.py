import unittest
from datetime import datetime

from src.services.energia_service import recuperar_energia


class RecuperacaoDeEnergiaTests(unittest.TestCase):
    def test_energia_cheia_nao_espera_nada(self):
        agora = datetime(2026, 11, 8, 16, 0)
        energia, proxima = recuperar_energia(5, None, agora)

        self.assertEqual(energia, 5)
        self.assertIsNone(proxima)

    def test_antes_da_hora_continua_igual(self):
        agora = datetime(2026, 11, 8, 16, 10)
        proxima = datetime(2026, 11, 8, 17, 0)
        energia, recuperacao = recuperar_energia(2, proxima, agora)

        self.assertEqual(energia, 2)
        self.assertEqual(recuperacao, proxima)

    def test_volta_uma_energia_na_hora_certa(self):
        agora = datetime(2026, 11, 8, 10, 0)
        energia, proxima = recuperar_energia(2, agora, agora)

        self.assertEqual(energia, 3)
        self.assertEqual(proxima, datetime(2026, 11, 8, 13, 0))  # a seguinte, 3 h depois

    def test_volta_varias_energias_de_uma_vez(self):
        # Tinha 1; das 10h às 16h10 voltam 3 (10h, 13h e 16h).
        agora = datetime(2026, 11, 8, 16, 10)
        energia, proxima = recuperar_energia(1, datetime(2026, 11, 8, 10, 0), agora)

        self.assertEqual(energia, 4)
        self.assertEqual(proxima, datetime(2026, 11, 8, 19, 0))

    def test_nunca_passa_do_maximo(self):
        # Tinha 2 e ficou um dia fora: voltariam 8, mas o máximo é 5.
        agora = datetime(2026, 11, 9, 10, 0)
        energia, proxima = recuperar_energia(2, datetime(2026, 11, 8, 10, 0), agora)

        self.assertEqual(energia, 5)
        self.assertIsNone(proxima)


if __name__ == "__main__":
    unittest.main()
