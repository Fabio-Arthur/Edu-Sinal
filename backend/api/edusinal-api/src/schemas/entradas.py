# Os formatos do JSON que o app envia para a API.
#
# O Pydantic confere cada campo sozinho: se faltar algo ou vier no tipo
# errado, a API já responde 422 com o problema, antes de chegar na rota.
# As regras mais "humanas" (senha forte, apelido) ficam no senha_service.

from pydantic import BaseModel, EmailStr, Field


class Cadastro(BaseModel):
    apelido: str = Field(max_length=40)
    email: EmailStr
    senha: str = Field(max_length=128)
    meta_diaria: int = 3


class Login(BaseModel):
    email: EmailStr
    senha: str = Field(max_length=128)


class MudancaDePerfil(BaseModel):
    apelido: str = Field(max_length=40)
    meta_diaria: int


class Resposta(BaseModel):
    pergunta: int = Field(ge=0)          # a posição da pergunta na atividade (a primeira é 0)
    resposta: int = Field(ge=0)          # a posição da opção escolhida (a primeira é 0)
    rodada: int = Field(default=1, ge=1, le=2)  # 2 = a "segunda chance" da mesma pergunta


class Compra(BaseModel):
    # O id de uma ajuda ("recarga-vidas") ou de um item da vitrine ("fundo-mar").
    id: str = Field(max_length=50)


class Visual(BaseModel):
    # Uma parte do mascote ("roupa", "chapeu", "rosto", "peito", "fundo")
    # e o item para vestir nela ("" = tirar).
    parte: str = Field(max_length=20)
    id_item: str = Field(max_length=50)
