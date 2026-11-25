# Cria (ou promove) uma conta de administrador DIRETO no banco.
# É o único jeito de ter um administrador: nenhuma tela ou rota do app faz isso.
#
# Como usar (dentro de backend/api/edusinal-api, com a .venv ativada e o
# src/.env apontando para o banco certo):
#
#   python ferramentas/criar_admin.py "Admin Edu" admin1@edusinal.app ~/admin-edusinal-1.txt
#
# A senha é sorteada aqui e gravada SÓ no arquivo que você escolher (ele precisa
# ficar FORA do repositório). Ela nunca aparece na tela nem vai para o Git.
# Se o e-mail já existir, a conta vira administrador e ganha a senha nova.

import os
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.database.conexao import conectar  # noqa: E402
from src.repositories import usuarios_repository  # noqa: E402
from src.services import senha_service  # noqa: E402


def senha_nova() -> str:
    # 4 palavras sorteadas + número: fácil de digitar e de passar para o grupo.
    palavras = ["sinal", "mao", "libras", "ponte", "flor", "luz", "mar", "sol", "lua", "rio", "vento", "pedra",
                "nuvem", "coral", "ilha", "trilha", "estrela", "folha", "onda", "bosque"]
    return "-".join(secrets.choice(palavras) for _ in range(4)) + f"-{secrets.randbelow(900) + 100}"


def main() -> None:
    if len(sys.argv) != 4:
        sys.exit('Uso: python ferramentas/criar_admin.py "Apelido" email@exemplo.com arquivo-da-senha.txt')
    apelido, email, arquivo = sys.argv[1], sys.argv[2].lower(), Path(sys.argv[3])

    problema = senha_service.problema_no_apelido(apelido)
    if problema:
        sys.exit(problema)
    repositorio = Path(__file__).resolve().parents[4]
    if arquivo.resolve().is_relative_to(repositorio):
        sys.exit("Salve o arquivo da senha FORA do repositório (ex.: ~/admin-edusinal-1.txt), para ele nunca ir para o Git.")

    senha = senha_nova()
    hash_da_senha = senha_service.gerar_hash(senha)

    # O arquivo é criado ANTES de mexer no banco: se der erro aqui (pasta que não
    # existe, arquivo que já existe), o banco nem é tocado e nenhuma senha se perde.
    # Só quem criou consegue ler o arquivo (permissão 600).
    try:
        descritor = os.open(arquivo, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        sys.exit(f"{arquivo} já existe. Escolha outro nome (não vou sobrescrever).")
    except OSError as erro:
        sys.exit(f"Não consegui criar {arquivo}: {erro.strerror}.")
    saida = os.fdopen(descritor, "w")

    try:
        acao = gravar_no_banco(apelido, email, hash_da_senha)
    except Exception:
        saida.close()
        arquivo.unlink()  # o banco falhou: o arquivo com uma senha que não vale some
        raise

    with saida:
        saida.write(f"E-mail: {email}\nSenha: {senha}\n")
    print(f"Conta de administrador {acao}: {apelido} ({email}). Dados de acesso em {arquivo}.")


def gravar_no_banco(apelido: str, email: str, hash_da_senha: str) -> str:
    with conectar() as conexao:
        existente = usuarios_repository.buscar_por_email(conexao, email)
        with conexao.cursor() as cursor:
            if existente:
                cursor.execute(
                    "UPDATE usuarios SET tipo_usuario = 'Administrador', senha_hash = %s, nome = %s, status_conta = 'Ativo' "
                    "WHERE id_usuario = %s",
                    (hash_da_senha, apelido, existente["id_usuario"]),
                )
                acao = "promovida"
            else:
                id_usuario = usuarios_repository.cadastrar(conexao, apelido, email, hash_da_senha, 3)
                cursor.execute("UPDATE usuarios SET tipo_usuario = 'Administrador' WHERE id_usuario = %s", (id_usuario,))
                acao = "criada"
        conexao.commit()
    return acao


if __name__ == "__main__":
    main()
