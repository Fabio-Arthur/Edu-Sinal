# Regras da senha, do apelido e da sessão (o login seguro).
#
# A senha NUNCA é guardada. Guardamos só um "hash": o resultado de embaralhar
# a senha de um jeito que não dá para desembaralhar. No login, embaralhamos
# de novo o que a pessoa digitou e comparamos os dois resultados.
#
# Usamos o scrypt, que já vem no Python (não precisa instalar nada) e é feito
# para ser lento de propósito: assim quem roubar o banco demora muito para
# testar senhas. O "sal" é um pedaço aleatório misturado em cada senha, para
# duas pessoas com a mesma senha não terem o mesmo hash.

import hashlib
import hmac
import secrets


APELIDO_MINIMO = 2
APELIDO_MAXIMO = 20
SENHA_MINIMA = 8
METAS_DIARIAS = [1, 3, 5]


def problema_no_apelido(apelido: str) -> str | None:
    # Devolve a mensagem de erro, ou None se estiver tudo certo.
    apelido = apelido.strip()
    if len(apelido) < APELIDO_MINIMO or len(apelido) > APELIDO_MAXIMO:
        return f"O apelido precisa ter de {APELIDO_MINIMO} a {APELIDO_MAXIMO} caracteres."
    return None


# Senhas óbvias demais: as primeiras que alguém tentaria.
SENHAS_OBVIAS = [
    "12345678", "123456789", "1234567890", "87654321", "11111111", "00000000",
    "senha123", "senha1234", "password", "qwertyui", "abcdefgh", "abc12345", "edusinal", "libras123",
]


def problema_na_senha(senha: str, apelido: str = "", email: str = "") -> str | None:
    # No estilo do Duolingo: não obriga maiúscula, número e símbolo (isso só
    # deixa a senha difícil de lembrar). Vale o tamanho e não ser óbvia.
    minuscula = senha.lower()
    if len(senha) < SENHA_MINIMA:
        return f"A senha precisa ter pelo menos {SENHA_MINIMA} caracteres."
    if minuscula in SENHAS_OBVIAS or len(set(minuscula)) == 1:  # ex.: "aaaaaaaa"
        return "Essa senha é fácil demais de adivinhar. Tente outra."
    if minuscula == apelido.strip().lower() or (email and minuscula == email.split("@")[0].lower()):
        return "A senha não pode ser igual ao seu apelido ou e-mail."
    return None


def gerar_hash(senha: str) -> str:
    # Resultado: "scrypt$<sal>$<hash>", tudo num texto só para guardar no banco.
    sal = secrets.token_hex(16)
    embaralhada = hashlib.scrypt(senha.encode(), salt=bytes.fromhex(sal), n=2**14, r=8, p=1)
    return f"scrypt${sal}${embaralhada.hex()}"


def conferir_senha(senha: str, hash_guardado: str) -> bool:
    # Embaralha a senha digitada com o mesmo sal e compara com o que está guardado.
    partes = hash_guardado.split("$")
    if len(partes) != 3 or partes[0] != "scrypt":
        return False  # hash num formato que não é o nosso (ex.: dados de teste)
    _, sal, embaralhada_guardada = partes
    embaralhada = hashlib.scrypt(senha.encode(), salt=bytes.fromhex(sal), n=2**14, r=8, p=1)

    # compare_digest compara sem "vazar" pelo tempo quantas letras acertou.
    return hmac.compare_digest(embaralhada.hex(), embaralhada_guardada)


def novo_codigo_de_sessao() -> str:
    # Um código aleatório e enorme: impossível de adivinhar. Vai para o cookie.
    return secrets.token_urlsafe(32)


def hash_do_codigo(codigo: str) -> str:
    # No banco guardamos só o hash do código. Se o banco vazar, ninguém entra
    # na conta de ninguém com o que está lá.
    return hashlib.sha256(codigo.encode()).hexdigest()
