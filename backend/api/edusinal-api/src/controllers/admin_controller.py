# Rotas do administrador: ver todos os usuários e apagar contas.
#
# Segurança (a regra de ouro): TODA rota daqui usa Depends(usuario_admin), que
# confere no banco se quem pede é administrador. O e-mail e a senha de ninguém
# saem daqui: o administrador vê só apelido, mascote e números de jogo.
# Cada apagada fica registrada no log da API (quem apagou e quem foi apagado).

import logging

from fastapi import APIRouter, Depends, HTTPException

from src.controllers.comum import PARTES_DO_MASCOTE, VISUAL_PADRAO, usuario_admin
from src.database.conexao import conectar
from src.repositories import extras_repository, usuarios_repository


router = APIRouter(prefix="/admin", tags=["Administrador"])
registro = logging.getLogger("edusinal.admin")


def mascote_para_o_app(visual: dict[str, str]) -> dict:
    mascote = dict(VISUAL_PADRAO)
    for tipo, codigo in visual.items():
        mascote[PARTES_DO_MASCOTE[tipo]] = codigo
    return mascote


@router.get("/usuarios")
def listar_usuarios(id_admin: int = Depends(usuario_admin)):
    with conectar() as conexao:
        usuarios = usuarios_repository.listar_para_admin(conexao)
        visuais = extras_repository.visual_de_todos(conexao)
        conexao.rollback()  # só leitura

    lista = [
        {
            "id": usuario["id_usuario"],
            "apelido": usuario["nome"],
            "mascote": mascote_para_o_app(visuais.get(usuario["id_usuario"], {})),
            "xp": usuario["xp"],
            "ofensiva": usuario["sequencia_dias"],
            "liga": usuario["id_liga"] - 1,  # 0 = Bronze ... 4 = Diamante
            "atividades": usuario["atividades"],
            "desde": usuario["data_cadastro"].date(),
            "visitante": bool(usuario["visitante"]),
            "admin": usuario["tipo_usuario"] == "Administrador",
        }
        for usuario in usuarios
    ]
    contas = [usuario for usuario in lista if not usuario["visitante"] and not usuario["admin"]]
    return {
        "resumo": {
            "alunos": len(contas),
            "visitantes": len([usuario for usuario in lista if usuario["visitante"]]),
            "administradores": len([usuario for usuario in lista if usuario["admin"]]),
            "xp_total": sum(usuario["xp"] for usuario in contas),
            "atividades_feitas": sum(usuario["atividades"] for usuario in contas),
        },
        "usuarios": lista,
    }


@router.delete("/usuarios/{id_alvo}")
def apagar_usuario(id_alvo: int, id_admin: int = Depends(usuario_admin)):
    # LGPD: apaga a conta e tudo dela (o banco faz isso com o CASCADE).
    with conectar() as conexao:
        if not usuarios_repository.apagar_se_comum(conexao, id_alvo):
            raise HTTPException(
                status_code=409,
                detail="Essa conta não existe mais ou é de administrador (administrador não se apaga por aqui).",
            )
        conexao.commit()
    registro.warning("O administrador %s apagou a conta %s.", id_admin, id_alvo)
    return {"mensagem": "Conta apagada."}
