# EduSinal

Plataforma demonstrativa para aprendizagem de Libras. O protótipo é a experiência principal: tem trilha, árvore de lições com prova final, atividades, vidas, energia, progresso, perfil com mascote personalizável e uma lojinha com moedas fictícias. A interface segue a identidade visual do projeto: azul, turquesa e branco, com tema claro e escuro.

## O que existe hoje

- **Frontend:** HTML, CSS e JavaScript, com [Bootstrap 5.3](https://getbootstrap.com) (avisos e janelas de confirmação) e [Bootstrap Icons](https://icons.getbootstrap.com). Os dois ficam dentro do projeto, em `frontend/assets/vendor/`, então o protótipo funciona sem internet (só as fontes do Google precisam de conexão). A Home abre em `/`; o estado demonstrativo fica no `localStorage` do navegador.
- **Trilha e árvore de lições:** clicar em uma etapa da trilha abre o modo foco: o menu lateral recua e a etapa vira uma árvore com 5 atividades em ordem e a **prova final** no centro, que só abre depois das 5. O progresso fica salvo no navegador e refazer uma atividade é revisão (sem recompensa de novo).
- **Home:** destaque colorido com a etapa atual, o progresso dela e o mascote do aluno; trilha com as etapas em bolinhas (estilo Duolingo). No computador, ao lado: ofensiva, XP, energia e vidas, meta do dia em anel e as missões do dia. No celular, só o destaque e a trilha.
- **Backend:** Python, FastAPI e MySQL, organizado em controllers, schemas, repositories e services.
- **Vidas:** 3 vidas; cada resposta errada consome uma e uma vida se recupera a cada 30 minutos. Revisar o dicionário continua livre.
- **Energia:** limita quantas atividades novas o aluno faz seguidas, para estudar com calma. São 5 de energia; concluir uma atividade nova (aprender, exercício, prova, letra ou o prêmio do Desafia-me) gasta 1, e 1 volta a cada 3 horas. Refazer o que já foi concluído (revisão) não gasta e não é bloqueado. Na lojinha dá para encher a energia uma vez por dia. Os números ficam em `MAX_ENERGY` e `ENERGY_RECHARGE_MS`, em `js/estado.js`.
- **Recompensas demonstrativas:** uma atividade nova correta concede 20 XP. A primeira dá 15 moedas e libera um broche local no protótipo; cada atividade nova seguinte dá 5 moedas. O inventário ainda não está na API.
- **Dicionário (álbum de sinais):** o alfabeto manual fica todo aberto, para consultar as 26 letras. As palavras vêm das atividades de aprender da trilha: começam bloqueadas e abrem quando o aluno conclui a atividade que ensina o sinal. O **Desafia-me** (opcional) sorteia 5 perguntas dos exercícios já concluídos; quem errar no máximo 1 ganha +20 XP e +10 moedas, uma vez por dia (gasta 1 de energia). Código em `js/telas-dicionario.js`.
- **Abas do aluno:** dicionário com busca e categorias (revisar é livre); ligas semanais com colegas fictícios (os 3 primeiros sobem, os 2 últimos descem); missões do dia e da semana que dão moedas; lojinha com ajudas (recarga de energia, recarga de vidas, protetor de ofensiva) e uma vitrine do dia com 3 itens do mascote, sorteados pela data, que trocam à meia-noite (um item com preço só pode ser comprado no dia em que está na vitrine); perfil com estatísticas e conquistas (as que dão roupa ao mascote mostram o prêmio); guarda-roupa do mascote (tocar no mascote do Perfil abre); e Configurações (engrenagem) com tema, tamanho do texto, animações reduzidas, ajuda, privacidade e conta.
- **Ofensiva:** conta os dias seguidos com pelo menos um exercício novo. Se o aluno ficar dias sem praticar, ela zera, a não ser que tenha protetores de ofensiva. Tocar no foguinho (barra de cima do celular, quadradinho da ofensiva na Home do computador ou quadradinho da ofensiva no Perfil) abre o calendário do mês, com os dias praticados e os salvos pelo protetor.
- **Segurança para menores:** não há chat nem mensagens entre alunos, e as ligas mostram só apelidos.
- **Conta demonstrativa:** o cadastro é por etapas, uma pergunta por tela (apelido, e-mail, senha e meta diária de 1, 3 ou 5 atividades), e termina numa tela "Tudo pronto!". Ele cria um perfil novo, do zero (com 20 moedas de boas-vindas), salvo só neste navegador. Não pede idade: com servidor, crianças vão precisar do consentimento de um responsável (LGPD), a tratar no backend. O login também é por etapas (e-mail, senha, o mascote "pensando" e o "Me lembrei! Bem-vindo(a) de volta") e usa o mesmo e-mail do cadastro; sem servidor, a senha não é conferida. A conferência só acontece depois do e-mail e da senha, com a mesma mensagem de erro para os dois, para não revelar quais e-mails têm conta. Tema claro/escuro, tamanho do texto, animações e meta diária ficam em "Configurações → Preferências".
- **Árvore de exercícios:** os 5 exercícios de cada etapa seguem uma ordem (o 2 abre depois do 1, e assim por diante) e a prova final vem por último. No computador eles ficam em espiral, com a prova no centro; no celular, num caminho ondulado só com os ícones: tocar num ícone mostra o título e o botão para começar. A árvore inteira cabe na tela sem rolar (a altura acompanha a tela), e em cima fica uma faixa só, com a flechinha de voltar para a Home, o nome da etapa no meio e, à direita, o progresso, as vidas e a energia (uma bateria com 5 tracinhos). Ao abrir uma etapa, uma animação (View Transitions do navegador) transforma o destaque da Home na faixa da etapa, leva a bolinha da etapa até o centro (o troféu da prova final) e os exercícios saem dela até a espiral; ao voltar, faz o caminho inverso. Com "animações reduzidas" ligado, a troca é direta.
- **Etapas com conteúdo (provisório, para testar a organização):** 8 etapas em 2 unidades. **Unidade 01 · Primeiros passos:** 01 Alfabeto, 02 Números, 03 Apresentação e 04 Cumprimentos. **Unidade 02 · Sinais do dia a dia:** 05 Em casa, 06 Na escola, 07 No trabalho e 08 Na rua. Cada etapa tem 5 atividades: a 1ª e a 3ª são para **aprender** (cartões com sinais novos) e a 2ª, a 4ª e a 5ª são **exercícios** com 5 perguntas; depois vem a prova final, com 6 perguntas tiradas dos exercícios. Uma etapa só abre depois da prova da anterior. **Segunda chance:** nos exercícios (e nas letras do alfabeto), a pergunta errada volta uma vez no fim da atividade; na prova final e no Desafia-me não, porque lá o limite de erros é a regra.
- **Atividade:** tela cheia (o menu lateral some), com barra de progresso, vidas e uma faixa fixa embaixo, no estilo do Duolingo. **Aprender:** um cartão por sinal (vídeo, nome e dica de uso); não tem certo ou errado e não gasta vidas, então dá para aprender mesmo sem vidas. **Exercícios:** 4 tipos de pergunta: vídeo → palavra, palavra → vídeo, situação (texto) e verdadeiro ou falso. O aluno escolhe e toca em "Conferir" (ou usa as teclas 1 a 4 e Enter); a faixa fica turquesa se acertou e coral se errou, com a explicação. Errar gasta uma vida. Na prova final, pode errar no máximo 1. Refazer algo já concluído é revisão, sem XP.
- **Conta e progresso no servidor:** o app usa a API (`backend/`) para cadastro, login e todo o progresso; no navegador ficam só as preferências de tela. O cadastro não pede idade (ver LGPD no planejamento). A loja não usa dinheiro real.

## Estrutura de pastas

```text
frontend/
  app/prototipo/
    index.html              Página do protótipo (carrega os CSS e JS na ordem certa)
    css/base.css            Cores (tema claro e escuro), botões, menu e esqueleto das telas
    css/home.css            Home: destaque, trilha (PC e celular) e lateral
    css/atividade.css       Atividade: cartões, perguntas e vídeo do sinal
    css/abas.css            Ligas, missões, lojinha e dicionário
    css/mascote.css         Desenho do mascote e cores de fundo
    css/celular.css         Barras de cima e de baixo do celular
    css/bootstrap.css       Cores do Bootstrap, avisos (Toast) e janelas (Modal)
    css/arvore.css          Árvore de exercícios (modo foco)
    css/configuracoes.css   Configurações
    css/perfil.css          Perfil e guarda-roupa
    css/boas-vindas.css     Boas-vindas
    css/cadastro.css        Cadastro e login por etapas
    manifest.webmanifest    Permite instalar o protótipo na tela inicial do celular
    icones/                 Ícones do app (gerados a partir do mascote)
    js/estado.js            Dados do aluno, vidas, energia, recompensas e o que é salvo
    js/conteudo.js          Etapas, exercícios e perguntas (edite aqui o conteúdo)
    js/mascote-desenho.js   Desenho do mascote em SVG, com a animação da cutucada
    js/telas-trilha.js      Boas-vindas, Home e árvore de lições
    js/licao.js             Atividade: escolher, conferir, próxima pergunta, passar ou não
    js/telas-dicionario.js  Dicionário: busca, categorias, alfabeto e Desafia-me
    js/telas-ligas.js       Ligas: ranking semanal, sobe e desce de liga
    js/telas-missoes.js     Missões do dia (seguem a meta diária) e da semana
    js/telas-lojinha.js     Lojinha: ajudas e vitrine do dia (itens do mascote)
    js/telas-perfil.js      Perfil (estatísticas, conquistas, nome) e Configurações
    js/telas-mascote.js     Itens do mascote, regras de liberação e o guarda-roupa
    js/telas-conta.js       Cadastro e login por etapas
    js/calendario.js        Calendário da ofensiva (janela do foguinho)
    js/app.js               Troca de telas, cliques e teclado (carrega por último)
  assets/images/       Imagens compartilhadas
  assets/vendor/       Bootstrap e Bootstrap Icons (cópias locais, com as licenças)
  landing/             Página "Conheça o projeto" (usa o mesmo mascote do app)
backend/
  api/edusinal-api/
    src/controllers/   Rotas HTTP da API
    src/schemas/       Formatos de entrada e saída
    src/repositories/  Consultas e gravações MySQL
    src/services/      Regras de negócio, como vidas e recompensas
    estrutura.sql      Banco e tabelas
```

## Abrir o frontend

Na raiz do projeto, rode:

```bash
python3 -m http.server 5500
```

Abra <http://localhost:5500/>. Se a porta 5500 já estiver ocupada, encerre o servidor anterior com `Ctrl+C` ou escolha outra porta, por exemplo `python3 -m http.server 5501`.

A landing de apresentação fica em <http://localhost:5500/frontend/landing/index.html>.

Para abrir uma tela direto, use `?tela=` no endereço: `home`, `login`, `cadastro`, `dicionario`, `ligas`, `missoes`, `lojinha`, `perfil` ou `mais`. Exemplo: <http://localhost:5500/frontend/app/prototipo/index.html?tela=ligas>. Depois de mudar o código, recarregue com `Ctrl+Shift+R` para o navegador não usar a versão antiga em cache.

## Testar no celular

O protótipo tem um layout próprio para celular (até 760 px de largura), no estilo do Duolingo: barra de cima com o mascote do aluno (tocar abre o Perfil), ofensiva (tocar abre o calendário), moedas (tocar abre a lojinha), energia, vidas e a engrenagem das Configurações; barra de baixo com Home, Dicionário, Ligas, Missões e Lojinha; atividade e árvore de lições em tela cheia. A Home do celular mostra só o destaque e a trilha (as missões e o resumo de vidas/ofensiva ficam nas abas e na barra de cima).

1. Deixe o computador e o celular na mesma rede Wi-Fi.
2. Na raiz do projeto, rode `python3 -m http.server 5500`.
3. Descubra o IP do computador com `hostname -I` (ex.: `192.168.0.10`).
4. No navegador do celular, abra `http://192.168.0.10:5500/`.

No computador, dá para simular o celular com `F12` → ícone de celular (modo responsivo).

Para instalar como app ("Adicionar à tela inicial"), o celular usa o `manifest.webmanifest` e os ícones de `icones/`. Abrindo pelo IP local, o navegador cria um atalho; o modo app completo, sem a barra do navegador, precisa de HTTPS, que a Vercel já oferece (veja abaixo). No iPhone, abra no Safari → compartilhar → "Adicionar à Tela de Início".

## Publicar na Vercel

O site publicado é só o frontend (HTML, CSS e JS, sem build). Na Vercel: **Add New → Project** → importar o repositório → **Framework Preset:** `Other` → **Root Directory:** `frontend` → **Deploy**. O `frontend/index.html` redireciona para o protótipo. Cada `git push` na `main` atualiza o site sozinho. A API e o MySQL não vão para a Vercel.

## Como mexer no protótipo

- **Ícones:** use `icon("nome")` no JavaScript ou `<i class="bi bi-nome" aria-hidden="true"></i>` no HTML, com o nome de [icons.getbootstrap.com](https://icons.getbootstrap.com) (ex.: `icon("heart-fill")`). Nas listas de dados (galhos, missões, conquistas), o campo `icon` guarda só o nome.
- **CSS:** cada parte do app tem o seu arquivo em `css/`. A ordem em que o `index.html` carrega os arquivos importa (quando duas regras brigam, ganha a do arquivo que vem depois), então um arquivo novo entra no fim da lista ou no lugar certo dela. Ao mudar a versão (`?v=`), mude em todos.
- **Bootstrap:** o CSS dele carrega antes do nosso; `css/bootstrap.css` liga as cores do Bootstrap às do EduSinal. Componentes em uso: Toast (`showToast`) e Modal (`askConfirm`).
- **Cores:** variáveis `--primary`, `--accent` e outras no topo de `css/base.css` (e `landing.css`). Há um bloco separado para o tema escuro.
- **Visual estilo Duolingo/Coddy:** botão "fofo" com sombra embaixo é a classe `button-3d` (`button-3d-light` para fundo branco). O degradê do destaque da Home usa `--hero-from` e `--hero-to`.
- **Etapas, atividades e perguntas:** a lista `learningTopics` em `js/conteudo.js`. Cada atividade tem `kind: "learn"` (com `cards`: sinal e dica) ou `kind: "practice"` (com `questions`, cada uma com um `type`: `video-palavra`, `palavra-video`, `situacao` ou `vf`). Uma atividade pode misturar cartões (`type: "card"`) e perguntas, como as letras do alfabeto. O comentário no topo do arquivo explica cada campo. **Vídeos dos sinais:** quando forem gravados, coloque o caminho em `SIGN_VIDEOS` (no mesmo arquivo), por exemplo `"Oi": "../../assets/videos/oi.mp4"`; enquanto isso aparece um espaço reservado com o nome do sinal. Para mostrar uma etapa nova na Home, coloque o id dela numa unidade de `TRAIL_UNITS` (`js/telas-trilha.js`). **Cuidado ao trocar o `id` de uma atividade:** o progresso salvo usa esse nome (`etapa:atividade`), então quem já tinha feito a atividade perde o "feito". Ao abrir o app, `fixOldProgress()` apaga os nomes que não existem mais. Se a trilha mudar muito (por exemplo, a ordem das etapas), suba `TRAIL_VERSION` em `js/conteudo.js`: na próxima vez que cada aluno abrir o app, o progresso das etapas é zerado uma vez (XP, moedas, ofensiva e as letras do alfabeto continuam).
- **Regras do jogo:** vidas, energia, XP, moedas, ofensiva e a virada do dia e da semana ficam em `js/estado.js`.
- **Conteúdo das abas:** cada arquivo de aba começa com os seus dados em listas fáceis de editar: `DICTIONARY_WORDS` (palavras), `LEAGUE_RIVALS` (colegas fictícios da liga), `DAILY_MISSIONS` e `WEEKLY_MISSIONS`, `POWER_UPS` (lojinha), `MASCOT_ITEMS` (roupas e acessórios do mascote, em `js/telas-mascote.js`) e `ACHIEVEMENTS` (conquistas).
- **Nova tela:** crie a função `render...` em um dos arquivos de telas e registre-a em `screenRenderers` e `screenTitles`.
- Os arquivos de `js/` são scripts comuns carregados em ordem pelo `index.html`; `app.js` precisa ser o último.

## Preparar a API e o MySQL

Pré-requisitos: Python 3.12 ou compatível e um servidor MySQL local em execução.

1. Entre na pasta da API:

```bash
cd backend/api/edusinal-api
```

2. Crie e ative um ambiente virtual:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Instale as dependências e configure o arquivo de ambiente:

```bash
python -m pip install -r requirements.txt
cp src/.env.example src/.env
```

Edite `src/.env` com o host, usuário, senha e porta do seu MySQL. O arquivo `.env` é local e não deve ser enviado ao Git.

4. Crie o banco e as tabelas. Na raiz do projeto:

```bash
mysql -u SEU_USUARIO -p < backend/api/edusinal-api/estrutura.sql
```

Opcionalmente, insira os registros demonstrativos uma única vez:

```bash
mysql -u SEU_USUARIO -p < backend/api/edusinal-api/estrutura_inserts.sql
```

O esquema usa `CREATE DATABASE/TABLE IF NOT EXISTS` e não apaga o banco. O script de inserts tem e-mails e CPFs fictícios; não o execute repetidamente, pois os registros podem violar índices únicos.

5. Inicie a API, ainda dentro da pasta `backend/api/edusinal-api`:

```bash
python -m uvicorn src.app:app --reload
```

Abra <http://127.0.0.1:8000/docs> para explorar a documentação automática da API.

## Rotas da API

A lista completa das rotas, com exemplos e as regras do visitante, está no [backend/README.md](backend/README.md#rotas). Todas as rotas também aparecem, para testar, em <http://127.0.0.1:8000/docs>.

O servidor descobre quem está logado pelo cookie da sessão, nunca por um número no endereço. Ele mesmo confere as respostas no banco: o app não consegue dizer que acertou.

## Testes do backend

Com o ambiente virtual ativado e dentro da pasta da API:

```bash
python -m unittest discover -s tests -v
```

Os testes cobrem as regras do jogo (vidas, energia, ofensiva, trilha, senha, missões, lojinha, ligas, dicionário e Desafia-me), sem precisar do banco.

## Organização do código

- **Controller:** recebe a chamada HTTP, valida o recurso e devolve respostas/status HTTP.
- **Schema:** define os campos que entram e saem da API.
- **Repository:** executa SQL e controla transações.
- **Service:** concentra regras que podem ser testadas sem banco ou navegador.

## Limites e próximos passos

O frontend continua usando dados locais e ainda não faz `fetch` para a API. As rotas da API também não têm autenticação/autorização; o ID do aluno na URL não protege dados entre contas. Use apenas em desenvolvimento e não publique a API até implementar sessão, autorização por perfil e proteção dos dados de menores.

Os campos do cadastro não verificam identidade nem idade. A leitura de mãos é apenas uma ideia futura: deve ser um módulo isolado, com consentimento e avaliação de privacidade, sem armazenar imagens por padrão. Nenhum modelo de visão computacional foi instalado ou conectado.
