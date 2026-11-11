# Rotas de conta: cadastro, login e sair.
#
# Como o login funciona:
#   1. a senha certa gera um código secreto aleatório (a sessão);
#   2. o código vai para o navegador num cookie "HttpOnly" (o JavaScript
#      não consegue ler, então nem um script malicioso rouba);
#   3. o banco guarda só o hash do código, com validade de 7 dias;
#   4. em cada pedido, o navegador manda o cookie sozinho, e a API
#      descobre quem é (ver usuario_logado, em comum.py).

import time
from datetime import timedelta

from fastapi import APIRouter, Cookie, HTTPException, Request, Response
from mysql.connector.errors import IntegrityError

from src.controllers.comum import NOME_DO_COOKIE, estado_atualizado
from src.database.conexao import conectar
from src.repositories import usuarios_repository
from src.schemas.entradas import Cadastro, Login
from src.services import datas_service, senha_service
from src.settings.settings import settings


router = APIRouter(prefix="/auth", tags=["Conta"])

DURACAO_DA_SESSAO = timedelta(days=7)
TENTATIVAS_POR_MINUTO = 5

# Tentativas de login por endereço (IP): {"1.2.3.4": [hora1, hora2, ...]}.
# Fica na memória da API: se ela reiniciar, zera (para o TCC, está ótimo).
tentativas_de_login: dict[str, list[float]] = {}


def muitas_tentativas(ip: str) -> bool:
    # Guarda só as tentativas do último minuto e vê se passou do limite.
    agora = time.time()
    recentes = [hora for hora in tentativas_de_login.get(ip, []) if agora - hora < 60]
    recentes.append(agora)
    tentativas_de_login[ip] = recentes
    return len(recentes) > TENTATIVAS_POR_MINUTO


def abrir_sessao(conexao, resposta: Response, id_usuario: int) -> None:
    # Cria a sessão no banco e coloca o cookie na resposta.
    codigo = senha_service.novo_codigo_de_sessao()
    expira_em = datas_service.agora_utc() + DURACAO_DA_SESSAO
    usuarios_repository.criar_sessao(
        conexao, senha_service.hash_do_codigo(codigo), id_usuario, datas_service.para_o_banco(expira_em)
    )
    resposta.set_cookie(
        key=NOME_DO_COOKIE,
        value=codigo,
        max_age=int(DURACAO_DA_SESSAO.total_seconds()),
        httponly=True,                 # o JavaScript não lê
        secure=settings.cookie_seguro, # só viaja por HTTPS (quando publicado)
        samesite="lax",                # outros sites não mandam o cookie por nós
    )


@router.post("/cadastro", status_code=201)
def cadastrar(dados: Cadastro, resposta: Response):
    # 1. Confere tudo com as mesmas regras do app.
    problema = (senha_service.problema_no_apelido(dados.apelido)
                or senha_service.problema_na_senha(dados.senha, dados.apelido, dados.email))
    if problema:
        raise HTTPException(status_code=400, detail=problema)
    if dados.meta_diaria not in senha_service.METAS_DIARIAS:
        raise HTTPException(status_code=400, detail="A meta diária precisa ser 1, 3 ou 5.")

    # 2. Cria a conta, guardando só o hash da senha. 3. Já sai logado.
    with conectar() as conexao:
        try:
            id_usuario = usuarios_repository.cadastrar(
                conexao, dados.apelido.strip(), dados.email.lower(),
                senha_service.gerar_hash(dados.senha), dados.meta_diaria,
            )
        except IntegrityError:
            # O e-mail é UNIQUE no banco: se já existe, o banco recusa.
            raise HTTPException(status_code=409, detail="Este e-mail já tem uma conta. Tente entrar.")
        abrir_sessao(conexao, resposta, id_usuario)
        conexao.commit()

    return estado_atualizado(id_usuario)


@router.post("/login")
def entrar(dados: Login, pedido: Request, resposta: Response):
    if muitas_tentativas(pedido.client.host):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Espere um minutinho e tente de novo.")

    with conectar() as conexao:
        usuario = usuarios_repository.buscar_por_email(conexao, dados.email.lower())

        # E-mail que não existe, senha errada e conta bloqueada recebem A MESMA
        # resposta: assim ninguém descobre quais e-mails têm conta.
        senha_certa = usuario is not None and senha_service.conferir_senha(dados.senha, usuario["senha_hash"])
        if not senha_certa or usuario["status_conta"] != "Ativo":
            raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

        abrir_sessao(conexao, resposta, usuario["id_usuario"])
        conexao.commit()

    return estado_atualizado(usuario["id_usuario"])


@router.post("/sair")
def sair(resposta: Response, sessao: str | None = Cookie(default=None)):
    # Apaga a sessão do banco e o cookie do navegador.
    if sessao:
        with conectar() as conexao:
            usuarios_repository.apagar_sessao(conexao, senha_service.hash_do_codigo(sessao))
            conexao.commit()
    resposta.delete_cookie(NOME_DO_COOKIE)
    return {"mensagem": "Até logo!"}
