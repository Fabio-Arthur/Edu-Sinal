# Configurações da API, lidas do arquivo src/.env (que nunca vai para o Git).
# Copie o src/.env.example para src/.env e troque os valores.

import os
from pathlib import Path

from dotenv import load_dotenv


RAIZ_PROJETO = Path(__file__).resolve().parents[1]
load_dotenv(RAIZ_PROJETO / ".env")


class Settings:
    def __init__(self):
        # Banco de dados (o banco do Eduardo se chama edu_sinal)
        self.db_host = os.getenv("DB_HOST", "127.0.0.1")
        self.db_port = int(os.getenv("DB_PORT", "3306"))
        self.db_user = os.getenv("DB_USER")
        self.db_password = os.getenv("DB_PASS")
        self.db_name = os.getenv("DB_NAME", "edu_sinal")
        # Banco na nuvem (TiDB Cloud) só aceita conexão criptografada (TLS).
        # No computador fica false; publicado, true.
        self.db_ssl = os.getenv("DB_SSL", "false").lower() == "true"

        # Endereços do app que podem chamar a API (separados por vírgula).
        origens = os.getenv("ORIGENS_PERMITIDAS", "http://127.0.0.1:5500,http://localhost:5500")
        self.origens_permitidas = [origem.strip() for origem in origens.split(",")]

        # Cookie "Secure" só funciona com HTTPS. No computador (http) fica false;
        # com a API publicada, é obrigatório ser true.
        self.cookie_seguro = os.getenv("COOKIE_SEGURO", "false").lower() == "true"


settings = Settings()
