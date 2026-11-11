CREATE DATABASE IF NOT EXISTS edu_sinal 
CHARACTER SET utf8mb4 -- Letras com acentos, EX: á, é, ã, ç
COLLATE utf8mb4_unicode_ci; -- EXEMPLO: SELECT * FROM palavras_dicionario WHERE palavra = 'familia'; - Com essa collation, encontra 'Família', 'FAMILIA' e 'familia'

USE edu_sinal;

-- O WAMP cria as tabelas como MyISAM, que IGNORA as chaves estrangeiras.
-- Com InnoDB, as chaves estrangeiras funcionam de verdade.
SET default_storage_engine = InnoDB;

-- 1. CADASTRO E LOGIN
-- Professor e Estudante viraram um tipo só: Usuario.
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(20) NOT NULL, -- apelido, de 2 a 20 letras
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL, -- a senha embaralhada (hash), nunca a senha de verdade

    meta_diaria INT NOT NULL DEFAULT 3, -- atividades por dia: 1, 3 ou 5

    tipo_usuario ENUM(
        'Administrador',
        'Usuario'
    ) NOT NULL DEFAULT 'Usuario',

    status_conta ENUM(
        'Ativo',
        'Inativo',
        'Bloqueado'
    ) NOT NULL DEFAULT 'Ativo',

    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CHECK (meta_diaria IN (1, 3, 5))
);

-- 2. PREFERÊNCIAS DOS USUÁRIOS
-- EX: tema escuro, texto grande, menos animações
CREATE TABLE preferencias_usuario (
    id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,

    preferencias JSON,

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- 3. SESSÕES (QUEM ESTÁ LOGADO)
-- O navegador guarda um código num cookie; aqui fica só o hash desse código.
-- A sessão vale por 7 dias. Sair apaga a linha.
CREATE TABLE sessoes (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,

    token_hash CHAR(64) NOT NULL UNIQUE,

    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATETIME NOT NULL,

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);

-- 4. CATEGORIAS DO DICIONÁRIO
-- As abas do dicionário: Alfabeto, Saudações, Números...
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    ordem INT NOT NULL UNIQUE -- ordem das abas
);

INSERT INTO categorias
    (nome, ordem)
VALUES
    ('Alfabeto', 1),
    ('Saudações', 2),
    ('Números', 3),
    ('Família', 4),
    ('Cores', 5);

-- 5. DICIONÁRIO DE PALAVRAS E LETRAS
-- Cada sinal existe UMA vez só aqui. A trilha e os quizzes usam esta tabela,
-- então o vídeo de um sinal aparece igual no dicionário, nas aulas e nos quizzes.
CREATE TABLE palavras_dicionario (
    id_palavra INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE, -- o mesmo id do app, EX: 'bom-dia', 'letra-a'

    palavra VARCHAR(100) NOT NULL UNIQUE, -- EX: 'Bom dia', 'Letra A'
    exemplo VARCHAR(200), -- frase de exemplo, EX: 'Bom dia, turma!'
    video VARCHAR(255), -- caminho do vídeo do sinal (ainda vão ser gravados)

    id_categoria INT NOT NULL,

    FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
);

-- 6. ETAPAS DA TRILHA
-- Caminho de aprendizagem estilo Duolingo: Alfabeto, Números, Saudações...
CREATE TABLE etapas (
    id_etapa INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE, -- o mesmo id do app, EX: 'numeros'

    titulo VARCHAR(100) NOT NULL,
    descricao VARCHAR(150),

    ordem INT UNIQUE, -- posição na trilha. Vazio (NULL) = fora da trilha, como o alfabeto do dicionário

    status ENUM(
        'Ativa',
        'Inativa'
    ) NOT NULL DEFAULT 'Ativa'
);

-- 7. ATIVIDADES DE CADA ETAPA
-- Cada etapa tem 5 atividades em ordem e uma prova final.
-- Aprender = cartões com sinais novos. Exercicio = quiz com perguntas.
CREATE TABLE atividades (
    id_atividade INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(100) NOT NULL UNIQUE, -- o mesmo id do app, EX: 'numeros:pratica-um-a-cinco'

    id_etapa INT NOT NULL,
    ordem INT NOT NULL,

    tipo ENUM(
        'Aprender',
        'Exercicio',
        'Prova final',
        'Letra',
        'Desafio'
    ) NOT NULL,

    titulo VARCHAR(100) NOT NULL,

    UNIQUE (id_etapa, ordem),

    FOREIGN KEY (id_etapa)
        REFERENCES etapas(id_etapa)
        ON DELETE CASCADE
);

-- 8. CARTÕES DAS ATIVIDADES DE APRENDER
-- O sinal vem do dicionário; aqui fica só a dica daquele momento.
CREATE TABLE cartoes (
    id_cartao INT AUTO_INCREMENT PRIMARY KEY,
    id_atividade INT NOT NULL,
    ordem INT NOT NULL,

    id_palavra INT NOT NULL,
    dica VARCHAR(300) NOT NULL,

    UNIQUE (id_atividade, ordem),

    FOREIGN KEY (id_atividade)
        REFERENCES atividades(id_atividade)
        ON DELETE CASCADE,

    FOREIGN KEY (id_palavra)
        REFERENCES palavras_dicionario(id_palavra)
);

-- 9. PERGUNTAS DOS EXERCÍCIOS
-- Video-palavra: mostra o vídeo e o usuário escolhe a palavra.
-- Palavra-video: mostra a palavra e o usuário escolhe o vídeo.
-- Nesses dois, o sinal mostrado é o da alternativa correta.
-- A prova final não tem perguntas próprias: usa as 2 primeiras de cada exercício.
CREATE TABLE perguntas (
    id_pergunta INT AUTO_INCREMENT PRIMARY KEY,
    id_atividade INT NOT NULL,
    ordem INT NOT NULL,

    tipo ENUM(
        'Video-palavra',
        'Palavra-video',
        'Situacao',
        'Verdadeiro ou falso'
    ) NOT NULL,

    enunciado VARCHAR(300), -- o texto da pergunta (só em Situacao e Verdadeiro ou falso)
    explicacao VARCHAR(300) NOT NULL, -- aparece depois de responder

    UNIQUE (id_atividade, ordem),

    FOREIGN KEY (id_atividade)
        REFERENCES atividades(id_atividade)
        ON DELETE CASCADE
);

-- 10. ALTERNATIVAS DAS PERGUNTAS
-- A alternativa é um sinal do dicionário OU um texto.
-- Verdadeiro ou falso também usa esta tabela: duas alternativas, 'Verdadeiro' e 'Falso'.
CREATE TABLE alternativas (
    id_alternativa INT AUTO_INCREMENT PRIMARY KEY,
    id_pergunta INT NOT NULL,

    id_palavra INT, -- um sinal do dicionário...
    descricao VARCHAR(150), -- ...ou um texto

    correta BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (id_pergunta)
        REFERENCES perguntas(id_pergunta)
        ON DELETE CASCADE,

    FOREIGN KEY (id_palavra)
        REFERENCES palavras_dicionario(id_palavra),

    CHECK (id_palavra IS NOT NULL OR descricao IS NOT NULL) -- não pode ficar sem os dois
);

-- 11. LIGAS
-- O ranking é pelo XP da semana: os 3 primeiros sobem e os 2 últimos descem.
CREATE TABLE ligas (
    id_liga INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    ordem INT NOT NULL UNIQUE
);

INSERT INTO ligas
    (id_liga, nome, ordem)
VALUES
    (1, 'Bronze', 1),
    (2, 'Prata', 2),
    (3, 'Ouro', 3),
    (4, 'Safira', 4),
    (5, 'Diamante', 5);

-- 12. CONQUISTAS
-- GAMIFICAÇÃO
CREATE TABLE conquistas (
    id_conquista INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),
    icone VARCHAR(50), -- nome do ícone do Bootstrap Icons
    alvo INT NOT NULL -- quanto precisa para ganhar, EX: 7 dias de ofensiva
);

INSERT INTO conquistas
    (nome, descricao, icone, alvo)
VALUES
    ('Primeiro sinal', 'Conclua seu primeiro exercício.', 'hand-thumbs-up-fill', 1),
    ('Mão na massa', 'Conclua 5 exercícios.', 'pencil-fill', 5),
    ('Etapa vencida', 'Passe em uma prova final.', 'award-fill', 1),
    ('Em chamas', 'Chegue a 7 dias de ofensiva.', 'fire', 7),
    ('Explorador', 'Veja 10 sinais diferentes no dicionário.', 'book-fill', 10),
    ('Colecionador', 'Tenha 3 itens para o mascote.', 'bag-heart-fill', 3),
    ('Subindo', 'Chegue à liga Prata.', 'trophy-fill', 1);

-- 13. LOJINHA DE COSMÉTICOS DO MASCOTE
-- Alguns itens são grátis, outros custam moedas e outros vêm de uma conquista.
CREATE TABLE cosmeticos (
    id_cosmetico INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE, -- o mesmo id do app, EX: 'camiseta-branca'

    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),

    tipo_cosmetico ENUM(
        'Roupa',
        'Chapeu',
        'Rosto',
        'Peito',
        'Fundo'
    ) NOT NULL,

    forma_liberar ENUM(
        'Gratis',
        'Moedas',
        'Conquista',
        'Premio'
    ) NOT NULL,

    custo_moedas INT NOT NULL DEFAULT 0,
    id_conquista INT, -- só quando forma_liberar = 'Conquista'

    status ENUM(
        'Disponivel',
        'Indisponivel'
    ) NOT NULL DEFAULT 'Disponivel',

    FOREIGN KEY (id_conquista)
        REFERENCES conquistas(id_conquista),

    CHECK (custo_moedas >= 0)
);

-- 14. MISSÕES
-- Metas pequenas que dão moedas. As do dia recomeçam à meia-noite
-- e as da semana na segunda-feira.
CREATE TABLE missoes (
    id_missao INT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,

    periodo ENUM(
        'Dia',
        'Semana'
    ) NOT NULL,

    moedas_recompensa INT NOT NULL,

    CHECK (moedas_recompensa >= 0)
);

INSERT INTO missoes
    (id_missao, nome, periodo, moedas_recompensa)
VALUES
    (1, 'Concluir a meta do dia', 'Dia', 10),
    (2, 'Ganhar meta x 20 XP', 'Dia', 10),
    (3, 'Ver 3 sinais no dicionário', 'Dia', 5),
    (4, 'Ganhar 200 XP na semana', 'Semana', 30),
    (5, 'Chegar a 5 dias de ofensiva', 'Semana', 20);

-- 15. PROGRESSO E GAMIFICAÇÃO
-- XP, moedas, vidas, energia, foguinho e liga de cada usuário.
CREATE TABLE progresso_usuario (
    id_progresso INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,

    xp INT NOT NULL DEFAULT 0, -- 20 por atividade nova
    moedas INT NOT NULL DEFAULT 20, -- 20 de boas-vindas

    -- VIDAS: errar gasta 1, e 1 volta a cada 30 minutos
    vidas INT NOT NULL DEFAULT 3,
    proxima_vida DATETIME, -- quando a próxima vida volta (vazio = vidas cheias)

    -- ENERGIA: atividade nova gasta 1, e 1 volta a cada 3 horas
    energia INT NOT NULL DEFAULT 5,
    proxima_energia DATETIME, -- quando a próxima energia volta (vazio = cheia)
    data_recarga_energia DATE, -- recarga comprada na lojinha (só 1 por dia)

    -- FOGUINHO / OFENSIVA
    sequencia_dias INT NOT NULL DEFAULT 0,
    data_ultima_atividade DATE,
    protetores INT NOT NULL DEFAULT 0, -- protetor de ofensiva: salva 1 dia perdido

    id_liga INT NOT NULL DEFAULT 1, -- começa no Bronze

    ganhou_bonus_primeira BOOLEAN NOT NULL DEFAULT FALSE, -- primeira atividade: +15 moedas e broche
    data_premio_desafio DATE, -- Desafia-me do alfabeto: prêmio só 1 vez por dia

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_liga)
        REFERENCES ligas(id_liga),

    CHECK (xp >= 0),
    CHECK (moedas >= 0),
    CHECK (vidas >= 0 AND vidas <= 3),
    CHECK (energia >= 0 AND energia <= 5),
    CHECK (sequencia_dias >= 0),
    CHECK (protetores >= 0 AND protetores <= 2)
);

-- 16. ATIVIDADE DIÁRIA
-- FOGUINHO / STREAK
-- Um registro por dia em que o usuário praticou (é o calendário do foguinho).
-- Também guarda o que ele fez no dia, para a meta diária e as missões.
CREATE TABLE atividade_diaria (
    id_atividade_diaria INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,

    data_atividade DATE NOT NULL,

    tipo_dia ENUM(
        'Praticou',
        'Protetor' -- o protetor salvou esse dia (aparece com escudo no calendário)
    ) NOT NULL DEFAULT 'Praticou',

    atividades_feitas INT NOT NULL DEFAULT 0,
    xp_ganho INT NOT NULL DEFAULT 0,

    UNIQUE (id_usuario, data_atividade),

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CHECK (atividades_feitas >= 0),
    CHECK (xp_ganho >= 0)
);

-- 17. PROGRESSO NAS TRILHAS
-- RF-01 / Caminho de aprendizagem
-- Cada atividade que o usuário concluiu (inclusive provas finais e letras do alfabeto).
-- O que está bloqueado ou liberado é calculado a partir daqui.
CREATE TABLE progresso_trilha (
    id_progresso_trilha INT AUTO_INCREMENT PRIMARY KEY,

    id_usuario INT NOT NULL,
    id_atividade INT NOT NULL,

    data_conclusao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (id_usuario, id_atividade), -- concluir de novo não conta (nem dá XP) duas vezes

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_atividade)
        REFERENCES atividades(id_atividade)
        ON DELETE CASCADE
);

-- 18. TENTATIVAS DAS ATIVIDADES
-- Cada vez que o usuário começa um exercício, uma prova ou o Desafia-me.
CREATE TABLE tentativas_atividade (
    id_tentativa INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_atividade INT NOT NULL,

    acertos INT NOT NULL DEFAULT 0,
    erros INT NOT NULL DEFAULT 0,

    xp_ganho INT NOT NULL DEFAULT 0,
    moedas_ganhas INT NOT NULL DEFAULT 0,

    data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao DATETIME, -- vazio = ainda não terminou

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_atividade)
        REFERENCES atividades(id_atividade)
        ON DELETE CASCADE,

    CHECK (acertos >= 0),
    CHECK (erros >= 0),
    CHECK (xp_ganho >= 0),
    CHECK (moedas_ganhas >= 0)
);

-- 19. RESPOSTAS DOS USUÁRIOS
-- Cada resposta dada numa tentativa.
-- Rodada 2 = segunda chance: a pergunta errada volta uma vez no fim.
CREATE TABLE respostas_usuario (
    id_resposta INT AUTO_INCREMENT PRIMARY KEY,

    id_tentativa INT NOT NULL,
    id_pergunta INT NOT NULL,
    id_alternativa INT NOT NULL,

    rodada INT NOT NULL DEFAULT 1,
    acertou BOOLEAN NOT NULL DEFAULT FALSE,

    UNIQUE (id_tentativa, id_pergunta, rodada), -- a mesma resposta enviada 2 vezes conta 1 vez só

    FOREIGN KEY (id_tentativa)
        REFERENCES tentativas_atividade(id_tentativa)
        ON DELETE CASCADE,

    FOREIGN KEY (id_pergunta)
        REFERENCES perguntas(id_pergunta)
        ON DELETE CASCADE,

    FOREIGN KEY (id_alternativa)
        REFERENCES alternativas(id_alternativa)
        ON DELETE CASCADE,

    CHECK (rodada IN (1, 2))
);

-- 20. SINAIS VISTOS NO DICIONÁRIO
-- Missão do dia "Ver 3 sinais" e conquista "Explorador" (10 sinais diferentes).
CREATE TABLE palavras_vistas (
    id_usuario INT NOT NULL,
    id_palavra INT NOT NULL,
    data_vista DATE NOT NULL,

    PRIMARY KEY (id_usuario, id_palavra, data_vista), -- conta 1 vez por dia

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_palavra)
        REFERENCES palavras_dicionario(id_palavra)
        ON DELETE CASCADE
);

-- 21. MISSÕES RESGATADAS
-- data_periodo = o dia (missão do dia) ou a segunda-feira (missão da semana).
CREATE TABLE missoes_resgatadas (
    id_usuario INT NOT NULL,
    id_missao INT NOT NULL,
    data_periodo DATE NOT NULL,

    data_resgate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario, id_missao, data_periodo), -- não resgata duas vezes

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_missao)
        REFERENCES missoes(id_missao)
);

-- 22. XP DA SEMANA (RANKING DAS LIGAS)
-- Uma linha por usuário por semana. Quando a semana fecha, guarda se ele subiu ou desceu.
CREATE TABLE xp_semanal (
    id_usuario INT NOT NULL,
    data_semana DATE NOT NULL, -- a segunda-feira da semana
    id_liga INT NOT NULL, -- a liga em que ele jogou nessa semana

    xp INT NOT NULL DEFAULT 0,

    resultado ENUM(
        'Subiu',
        'Ficou',
        'Desceu'
    ), -- vazio enquanto a semana não fecha

    PRIMARY KEY (id_usuario, data_semana),

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_liga)
        REFERENCES ligas(id_liga),

    CHECK (xp >= 0)
);

-- 23. CONQUISTAS DOS USUÁRIOS
-- GAMIFICAÇÃO
CREATE TABLE conquistas_usuario (
    id_usuario INT NOT NULL,
    id_conquista INT NOT NULL,

    data_conquista DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario, id_conquista),

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_conquista)
        REFERENCES conquistas(id_conquista)
        ON DELETE CASCADE
);

-- 24. COSMÉTICOS DOS USUÁRIOS
-- Inventário: itens que cada usuário comprou ou ganhou.
CREATE TABLE cosmeticos_usuario (
    id_usuario INT NOT NULL,
    id_cosmetico INT NOT NULL,

    custo_pago INT NOT NULL DEFAULT 0, -- 0 quando o item foi ganho
    data_compra DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_usuario, id_cosmetico),

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    FOREIGN KEY (id_cosmetico)
        REFERENCES cosmeticos(id_cosmetico),

    CHECK (custo_pago >= 0)
);

-- 25. COSMÉTICOS EQUIPADOS NO MASCOTE
-- O usuário só pode equipar itens que possui.
-- Cada tipo de cosmético ocupa um único espaço (uma roupa, um chapéu...).
CREATE TABLE mascote_equipado (
    id_usuario INT NOT NULL,
    id_cosmetico INT NOT NULL,

    tipo_cosmetico ENUM(
        'Roupa',
        'Chapeu',
        'Rosto',
        'Peito',
        'Fundo'
    ) NOT NULL,

    PRIMARY KEY (id_usuario, tipo_cosmetico),

    FOREIGN KEY (id_usuario, id_cosmetico)
        REFERENCES cosmeticos_usuario(id_usuario, id_cosmetico)
        ON DELETE CASCADE
);

-- 26. ÍNDICES PARA A BARRA DE PESQUISA DO DICIONÁRIO
-- palavra já tem índice por ser UNIQUE. Ele deixa rápida a busca que COMEÇA com o texto:
--   SELECT * FROM palavras_dicionario WHERE palavra LIKE 'bo%';
-- Pela collation, 'bo%' também encontra 'Bô...' e 'BO...'.
-- A busca que CONTÉM o texto (LIKE '%dia%') não usa índice, mas com
-- poucas centenas de palavras ela continua instantânea.

-- Abrir uma aba do dicionário: as palavras de uma categoria, em ordem alfabética.
CREATE INDEX idx_palavras_categoria
ON palavras_dicionario(id_categoria, palavra);

-- Ranking da semana: os usuários de uma liga, do maior XP para o menor.
CREATE INDEX idx_ranking_semana
ON xp_semanal(data_semana, id_liga, xp);