import unittest
from datetime import date, datetime, timezone

from src.services.datas_service import dia_em_brasilia
from src.services.ofensiva_service import conferir_ofensiva, registrar_pratica


class ConferirOfensivaTests(unittest.TestCase):
    def test_praticou_ontem_nao_perde_nada(self):
        resultado = conferir_ofensiva(5, 0, date(2026, 11, 7), date(2026, 11, 8))

        self.assertEqual(resultado.ofensiva, 5)
        self.assertEqual(resultado.dias_salvos, [])

    def test_um_dia_sem_praticar_zera_a_ofensiva(self):
        resultado = conferir_ofensiva(5, 0, date(2026, 11, 6), date(2026, 11, 8))

        self.assertEqual(resultado.ofensiva, 0)

    def test_protetor_salva_um_dia_perdido(self):
        resultado = conferir_ofensiva(5, 1, date(2026, 11, 6), date(2026, 11, 8))

        self.assertEqual(resultado.ofensiva, 5)
        self.assertEqual(resultado.protetores, 0)
        self.assertEqual(resultado.dias_salvos, [date(2026, 11, 7)])
        self.assertEqual(resultado.ultimo_dia_praticado, date(2026, 11, 7))

    def test_protetor_nao_basta_para_dois_dias_perdidos(self):
        resultado = conferir_ofensiva(5, 1, date(2026, 11, 5), date(2026, 11, 8))

        self.assertEqual(resultado.ofensiva, 0)
        self.assertEqual(resultado.protetores, 1)  # não gasta à toa


class RegistrarPraticaTests(unittest.TestCase):
    def test_primeiro_exercicio_do_dia_soma_um(self):
        ofensiva, ultimo_dia = registrar_pratica(5, date(2026, 11, 7), date(2026, 11, 8))

        self.assertEqual(ofensiva, 6)
        self.assertEqual(ultimo_dia, date(2026, 11, 8))

    def test_segundo_exercicio_do_dia_nao_soma(self):
        ofensiva, _ = registrar_pratica(6, date(2026, 11, 8), date(2026, 11, 8))

        self.assertEqual(ofensiva, 6)


class DiaEmBrasiliaTests(unittest.TestCase):
    def test_duas_da_manha_em_utc_ainda_e_ontem_em_brasilia(self):
        # 02:00 em UTC = 23:00 do dia anterior em Brasília
        agora = datetime(2026, 11, 8, 2, 0, tzinfo=timezone.utc)

        self.assertEqual(dia_em_brasilia(agora), date(2026, 11, 7))


if __name__ == "__main__":
    unittest.main()
