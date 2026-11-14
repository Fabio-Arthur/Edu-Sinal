# O ponto de partida da API do EduSinal.
#
# Para rodar (dentro de backend/api/edusinal-api, com a .venv ativada):
#   python -m uvicorn src.app:app --reload
# e abra http://127.0.0.1:8000/docs para ver e testar todas as rotas.
#
# Como o código está dividido (pense num restaurante):
#   controllers/  o garçom: as rotas, recebem e devolvem JSON
#   schemas/      o cardápio: o formato do JSON que pode chegar
#   services/     a receita: as regras do jogo, sem banco
#   repositories/ o estoque: as consultas SQL

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.controllers import atividades_controller, auth_controller, eu_controller, extras_controller
from src.settings.settings import settings


app = FastAPI(
    title="EduSinal API",
    description="API do EduSinal: conta, trilha, atividades e as regras do jogo.",
    version="2.0.0",
)

# CORS: só os endereços do app podem chamar a API pelo navegador.
# allow_credentials=True deixa o navegador mandar o cookie da sessão.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origens_permitidas,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(auth_controller.router)
app.include_router(eu_controller.router)
app.include_router(atividades_controller.router)
app.include_router(extras_controller.router)
