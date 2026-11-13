# Rotas do próprio usuário: ver o estado, mudar o perfil e apagar a conta.
# Repare que nenhuma rota recebe o número do usuário no endereço: quem é
# vem sempre da sessão (Depends(usuario_logado)). Assim ninguém vê dados de outro.

from fastapi import APIRouter, Depends, HTTPException, Response

from src.controllers.comum import NOME_DO_COOKIE, estado_atualizado, usuario_logado
from src.database.conexao import conectar
from src.repositories import usuarios_repository
from src.schemas.entradas import MudancaDePerfil
from src.services import senha_service


router = APIRouter(prefix="/eu", tags=["Eu"])


@router.get("")
def ver_estado(id_usuario: int = Depends(usuario_logado)):
    # O app chama ao abrir: se a sessão vale, recebe tudo; se não, 401 e vai pro login.
    return estado_atualizado(id_usuario)


@router.put("")
def mudar_perfil(dados: MudancaDePerfil, id_usuario: int = Depends(usuario_logado)):
    problema = senha_service.problema_no_apelido(dados.apelido)
    if problema:
        raise HTTPException(status_code=400, detail=problema)
    if dados.meta_diaria not in senha_service.METAS_DIARIAS:
        raise HTTPException(status_code=400, detail="A meta diária precisa ser 1, 3 ou 5.")

    with conectar() as conexao:
        usuarios_repository.mudar_perfil(conexao, id_usuario, dados.apelido.strip(), dados.meta_diaria)
        conexao.commit()
    return estado_atualizado(id_usuario)


@router.delete("")
def apagar_conta(resposta: Response, id_usuario: int = Depends(usuario_logado)):
    # LGPD: apagar a conta apaga TUDO do usuário (o banco faz isso com o CASCADE).
    with conectar() as conexao:
        usuarios_repository.apagar(conexao, id_usuario)
        conexao.commit()
    resposta.delete_cookie(NOME_DO_COOKIE)
    return {"mensagem": "Sua conta e todos os seus dados foram apagados."}
