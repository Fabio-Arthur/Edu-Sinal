# EduSinal backend

API em Python (FastAPI) com MySQL. Ela guarda as contas e o progresso dos alunos e decide as regras do jogo: se a resposta está certa, quanto XP e quantas moedas o aluno ganha, quando as vidas e a energia voltam.

O app conversa com a API só por **JSON**, e todas as chamadas ficam em `frontend/app/prototipo/js/api.js`. O servidor descobre quem está logado pelo cookie `sessao`, nunca por um número no endereço.

O planejamento da equipe (quem faz o quê, as fases e os cuidados com a LGPD) está no [PLANEJAMENTO.md](PLANEJAMENTO.md).

## Como o código está dividido

Tudo fica em `api/edusinal-api/`. Um pedido do app passa pelas camadas nesta ordem:

```
app (js/api.js) → controllers → services → repositories → MySQL
```

| Pasta ou arquivo | O que tem |
| --- | --- |
| `src/controllers/` | As rotas: recebem o JSON, chamam as regras e o banco e devolvem JSON |
| `src/schemas/entradas.py` | O formato do JSON que chega (o FastAPI confere sozinho) |
| `src/services/` | As regras do jogo, sem banco e fáceis de testar |
| `src/repositories/` | As consultas SQL, sempre com `%s` (nada colado no SQL) |
| `estrutura.sql` | As tabelas do banco `edu_sinal` |
| `conteudo.sql` | O conteúdo completo: 94 sinais, 8 etapas, 26 letras, 172 perguntas e os itens do mascote |
| `ferramentas/gerar_conteudo.mjs` | Gera o `conteudo.sql` a partir do conteúdo do app |
| `estrutura_inserts.sql` | Dados de teste pequenos, para conferir as tabelas (não use junto com o `conteudo.sql`) |

**Depois de qualquer ação, a API devolve o "estado" inteiro do aluno**: XP, moedas, vidas, energia, ofensiva, o que já concluiu, o mascote e os contadores do dia e da semana. O app só copia esse estado e redesenha a tela. Assim, o app nunca calcula prêmio por conta própria.

## Rotas

Todas, menos cadastro e login, exigem estar logado. Sem sessão, a resposta é 401.

| Método | Rota | Para que serve |
| --- | --- | --- |
| `POST` | `/auth/cadastro` | Criar a conta (apelido, e-mail, senha, meta diária). Já sai logado |
| `POST` | `/auth/login` | Entrar. E-mail ou senha errados recebem a mesma resposta. Limite de 5 tentativas por minuto |
| `POST` | `/auth/sair` | Sair |
| `GET` | `/eu` | O estado do aluno (o app chama ao abrir) |
| `PUT` | `/eu` | Mudar o apelido e a meta diária |
| `DELETE` | `/eu` | Apagar a conta e todos os dados dela |
| `POST` | `/atividades/{codigo}/comecar` | Começar uma atividade (confere se está trancada, a energia e as vidas) |
| `POST` | `/atividades/{codigo}/respostas` | Conferir uma resposta (errar tira uma vida) |
| `POST` | `/atividades/{codigo}/concluir` | Terminar: XP, moedas, ofensiva e energia |
| `POST` | `/missoes/{id}/resgatar` | Pegar as moedas de uma missão completa |
| `GET` | `/lojinha` | Ajudas e vitrine do dia |
| `POST` | `/lojinha/compras` | Comprar uma ajuda ou um item da vitrine |
| `PUT` | `/mascote` | Vestir um item numa parte do mascote |
| `GET` | `/ligas/semana` | Ranking da semana, com os alunos da mesma liga |
| `POST` | `/dicionario/{codigo}/visto` | Marcar um sinal como visto (missão do dicionário) |

O `{codigo}` da atividade é o mesmo id do app: `numeros:pratica-um-a-cinco`, a prova final `numeros:final`, as letras `alfabeto:A` e o desafio `alfabeto:desafio`. Os erros sempre vêm como `{ "detail": "Mensagem em português." }`.

### Exemplo: responder uma pergunta

```
POST /atividades/numeros:pratica-um-a-cinco/respostas
{ "pergunta": 0, "resposta": 1, "rodada": 1 }
→ { "correta": true, "resposta_certa": 1, "explicacao": "...", "estado": { ... } }
```

`pergunta` e `resposta` são posições, e a primeira é 0. O banco guarda as alternativas na mesma ordem das opções do app. `rodada: 2` é a "segunda chance" da mesma pergunta. Se a mesma resposta chegar duas vezes (internet ruim), ela só conta uma.

## Rodar no computador

Pré-requisitos: Python 3.12 ou mais novo e MySQL 8 (ou MariaDB 10.6+).

```bash
cd backend/api/edusinal-api
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp src/.env.example src/.env          # coloque o usuário e a senha do seu MySQL
mysql -u SEU_USUARIO -p < estrutura.sql
mysql -u SEU_USUARIO -p < conteudo.sql
python -m uvicorn src.app:app --reload
```

Em outro terminal, na raiz do projeto, abra o app:

```bash
cd frontend
python3 -m http.server 5500
```

Abra <http://127.0.0.1:5500/app/prototipo/> e crie uma conta. A documentação da API, onde dá pra testar cada rota, fica em <http://127.0.0.1:8000/docs>.

⚠️ Use o **mesmo nome** no app e na API: os dois em `127.0.0.1`, ou os dois em `localhost`. Misturando os dois, o navegador não manda o cookie e o login não funciona.

## Testes

Dentro de `backend/api/edusinal-api`, com a `.venv` ativada:

```bash
python -m unittest discover -s tests -v
```

Os testes cobrem as regras (pasta `src/services/`), sem precisar do banco.

## Cuidados

- A senha é guardada só como hash (`scrypt`, que já vem no Python) e nunca aparece em resposta nem em log.
- O cookie da sessão é `HttpOnly` e `SameSite=Lax`. Com a API publicada em HTTPS, ponha `COOKIE_SEGURO=true` no `.env`.
- Só os endereços em `ORIGENS_PERMITIDAS` podem chamar a API pelo navegador (CORS).
- Apagar a conta apaga tudo do aluno, graças ao `ON DELETE CASCADE` das tabelas.
- **Publicar:** o app publicado chama `/api/...` no próprio endereço. A hospedagem precisa repassar `/api` para a API (na Vercel, um "rewrite" no `vercel.json`). Enquanto a API não estiver publicada, o site publicado não consegue entrar nem cadastrar.
