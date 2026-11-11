-- DADOS DE TESTE DO EDUSINAL
-- Rodar logo DEPOIS do estrutura.sql, com o banco ainda vazio.
-- Os ids estão escritos à mão para ficar fácil de ver quem aponta para quem.
-- Todos os usuários são fictícios (e-mails @exemplo.com).
-- O conteúdo (sinais, cartões e perguntas) é o mesmo do app (js/conteudo.js).

USE edu_sinal;

-- Modo estrito: se algum valor estiver errado, dá erro em vez de gravar errado.
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- As categorias, ligas, conquistas e missões já foram inseridas pelo estrutura.sql:
--   categorias: 1 Alfabeto, 2 Saudações, 3 Números, 4 Família, 5 Cores
--   conquistas: 1 Primeiro sinal, 2 Mão na massa, 3 Etapa vencida, 4 Em chamas,
--               5 Explorador, 6 Colecionador, 7 Subindo


-- =====================================================================
-- CONTEÚDO DO SITE
-- =====================================================================

-- 1. PALAVRAS DO DICIONÁRIO
INSERT INTO palavras_dicionario
    (id_palavra, codigo, palavra, exemplo, id_categoria)
VALUES
    -- Alfabeto
    (1, 'letra-a', 'Letra A', NULL, 1),
    (2, 'letra-e', 'Letra E', NULL, 1),
    (3, 'letra-i', 'Letra I', NULL, 1),
    (4, 'letra-o', 'Letra O', NULL, 1),
    (5, 'letra-u', 'Letra U', NULL, 1),

    -- Saudações
    (6, 'oi', 'Oi', 'Oi, tudo bem?', 2),
    (7, 'tchau', 'Tchau', 'Tchau, até amanhã!', 2),
    (8, 'bom-dia', 'Bom dia', 'Bom dia, turma!', 2),
    (9, 'boa-tarde', 'Boa tarde', 'Boa tarde, professora.', 2),
    (10, 'obrigado', 'Obrigado(a)', 'Obrigada pela ajuda!', 2),

    -- Números
    (11, 'um', 'Um', 'Tenho um irmão.', 3),
    (12, 'dois', 'Dois', 'São dois sinais novos.', 3),
    (13, 'tres', 'Três', 'Faltam três dias.', 3),
    (14, 'quatro', 'Quatro', 'Moro com quatro pessoas.', 3),
    (15, 'cinco', 'Cinco', 'Cinco minutos de prática.', 3),

    -- Família
    (16, 'mae', 'Mãe', 'Minha mãe também aprende Libras.', 4),
    (17, 'pai', 'Pai', 'Meu pai mora perto.', 4),

    -- Cores
    (18, 'azul', 'Azul', 'O mascote é azul.', 5),
    (19, 'verde', 'Verde', 'A folha é verde.', 5);

-- 2. ETAPAS DA TRILHA
INSERT INTO etapas
    (id_etapa, codigo, titulo, descricao, ordem)
VALUES
    (1, 'alfabeto-manual', 'Alfabeto', 'Soletrar com as mãos', 1),
    (2, 'numeros', 'Números', 'Contar de 1 a 10', 2),
    (3, 'alfabeto', 'Alfabeto do dicionário', 'Uma letra por vez', NULL); -- fora da trilha

-- 3. ATIVIDADES
-- (só as 2 primeiras de cada etapa, para o teste não ficar enorme)
INSERT INTO atividades
    (id_atividade, codigo, id_etapa, ordem, tipo, titulo)
VALUES
    (1, 'alfabeto-manual:vogais', 1, 1, 'Aprender', 'As vogais'),
    (2, 'alfabeto-manual:pratica-vogais', 1, 2, 'Exercicio', 'Pratique: vogais'),
    (3, 'alfabeto-manual:final', 1, 6, 'Prova final', 'Prova final'),
    (4, 'numeros:um-a-cinco', 2, 1, 'Aprender', 'De 1 a 5'),
    (5, 'numeros:pratica-um-a-cinco', 2, 2, 'Exercicio', 'Pratique: 1 a 5'),
    (6, 'alfabeto:A', 3, 1, 'Letra', 'Letra A'),
    (7, 'alfabeto:desafio', 3, 27, 'Desafio', 'Desafia-me'); -- depois das 26 letras

-- 4. CARTÕES DAS ATIVIDADES DE APRENDER
INSERT INTO cartoes
    (id_atividade, ordem, id_palavra, dica)
VALUES
    -- As vogais (atividade 1)
    (1, 1, 1, 'O alfabeto manual (datilologia) serve para soletrar nomes e palavras que ainda não têm sinal.'),
    (1, 2, 2, 'Com as vogais, você já soletra pedaços de muitas palavras.'),
    (1, 3, 3, 'Soletre com calma: a outra pessoa precisa ver cada letra.'),
    (1, 4, 4, 'Já dá para soletrar “OI”!'),
    (1, 5, 5, 'Pronto, as 5 vogais! Tente soletrar “UAU”.'),

    -- De 1 a 5 (atividade 4)
    (4, 1, 11, 'Para contar e dizer quantidades.'),
    (4, 2, 12, 'Os números aparecem na idade, nos horários e nos preços.'),
    (4, 3, 13, 'Para dizer quantas coisas ou pessoas existem.'),
    (4, 4, 14, 'Alguns números têm um sinal para quantidade e outro para códigos, como telefone.'),
    (4, 5, 15, 'Metade do caminho até o 10!');

-- 5. PERGUNTAS DOS EXERCÍCIOS
INSERT INTO perguntas
    (id_pergunta, id_atividade, ordem, tipo, enunciado, explicacao)
VALUES
    -- Pratique: vogais (atividade 2)
    (1, 2, 1, 'Video-palavra', NULL, 'Essa é a letra A do alfabeto manual.'),
    (2, 2, 2, 'Palavra-video', NULL, 'Esse é o sinal da letra I.'),
    (3, 2, 3, 'Situacao', 'Para que serve o alfabeto manual?', 'A datilologia ajuda com nomes, siglas e palavras sem sinal. Ela não substitui os sinais.'),
    (4, 2, 4, 'Verdadeiro ou falso', 'Em Libras, toda palavra precisa ser soletrada letra por letra.', 'A Libras tem sinais próprios. A datilologia é para nomes e palavras sem sinal.'),
    (5, 2, 5, 'Video-palavra', NULL, 'Essa é a letra U do alfabeto manual.'),

    -- Pratique: 1 a 5 (atividade 5)
    (6, 5, 1, 'Video-palavra', NULL, 'Esse é o sinal do número 3.'),
    (7, 5, 2, 'Palavra-video', NULL, 'Esse é o sinal do número 5.'),
    (8, 5, 3, 'Situacao', 'Alguém pergunta quantos irmãos você tem, e você tem 2. O que responder?', 'Para quantidades, usamos o sinal do número.'),
    (9, 5, 4, 'Verdadeiro ou falso', 'Em Libras, alguns números mudam de sinal quando indicam quantidade ou um código, como o telefone.', 'Por isso vale prestar atenção ao contexto: quantidade e código podem ter sinais diferentes.'),
    (10, 5, 5, 'Video-palavra', NULL, 'Esse é o sinal do número 1.');

-- 6. ALTERNATIVAS
-- Nas perguntas de vídeo, a alternativa é um sinal (id_palavra).
-- Nas outras, é um texto (descricao).
INSERT INTO alternativas
    (id_alternativa, id_pergunta, id_palavra, descricao, correta)
VALUES
    -- Pergunta 1: vídeo da letra A
    (1, 1, 2, NULL, FALSE),   -- E
    (2, 1, 1, NULL, TRUE),    -- A
    (3, 1, 4, NULL, FALSE),   -- O

    -- Pergunta 2: palavra "Letra I"
    (4, 2, 5, NULL, FALSE),   -- vídeo da U
    (5, 2, 3, NULL, TRUE),    -- vídeo da I
    (6, 2, 2, NULL, FALSE),   -- vídeo da E

    -- Pergunta 3: para que serve o alfabeto manual
    (7, 3, NULL, 'Para soletrar nomes e palavras que não têm sinal', TRUE),
    (8, 3, NULL, 'Para trocar todos os sinais por letras', FALSE),
    (9, 3, NULL, 'Só para escrever no papel', FALSE),

    -- Pergunta 4: verdadeiro ou falso (a resposta é FALSO)
    (10, 4, NULL, 'Verdadeiro', FALSE),
    (11, 4, NULL, 'Falso', TRUE),

    -- Pergunta 5: vídeo da letra U
    (12, 5, 4, NULL, FALSE),  -- O
    (13, 5, 3, NULL, FALSE),  -- I
    (14, 5, 5, NULL, TRUE),   -- U

    -- Pergunta 6: vídeo do número 3
    (15, 6, 12, NULL, FALSE), -- 2
    (16, 6, 13, NULL, TRUE),  -- 3
    (17, 6, 15, NULL, FALSE), -- 5

    -- Pergunta 7: palavra "Cinco"
    (18, 7, 15, NULL, TRUE),  -- vídeo do 5
    (19, 7, 14, NULL, FALSE), -- vídeo do 4
    (20, 7, 11, NULL, FALSE), -- vídeo do 1

    -- Pergunta 8: quantos irmãos
    (21, 8, NULL, 'O sinal do número 2', TRUE),
    (22, 8, NULL, 'O sinal do número 5', FALSE),
    (23, 8, NULL, 'Soletrar D-O-I-S', FALSE),

    -- Pergunta 9: verdadeiro ou falso (a resposta é VERDADEIRO)
    (24, 9, NULL, 'Verdadeiro', TRUE),
    (25, 9, NULL, 'Falso', FALSE),

    -- Pergunta 10: vídeo do número 1
    (26, 10, 14, NULL, FALSE), -- 4
    (27, 10, 12, NULL, FALSE), -- 2
    (28, 10, 11, NULL, TRUE);  -- 1

-- 7. COSMÉTICOS DO MASCOTE
INSERT INTO cosmeticos
    (id_cosmetico, codigo, nome, descricao, tipo_cosmetico, forma_liberar, custo_moedas, id_conquista)
VALUES
    (1, 'camiseta-branca', 'Clássica da logo', NULL, 'Roupa', 'Gratis', 0, NULL),
    (2, 'camiseta-azul', 'Camiseta azul', NULL, 'Roupa', 'Gratis', 0, NULL),
    (3, 'camiseta-coral', 'Camiseta coral', 'Quentinha igual fim de tarde', 'Roupa', 'Moedas', 20, NULL),
    (4, 'moletom-edusinal', 'Moletom EduSinal', NULL, 'Roupa', 'Conquista', 0, 3),  -- Etapa vencida
    (5, 'camisa-campeao', 'Camisa de campeão', NULL, 'Roupa', 'Conquista', 0, 7),   -- Subindo
    (6, 'bone', 'Boné', NULL, 'Chapeu', 'Gratis', 0, NULL),
    (7, 'chapeu-festa', 'Chapéu de festa', 'Pra comemorar cada conquista', 'Chapeu', 'Moedas', 30, NULL),
    (8, 'coroa', 'Coroa', NULL, 'Chapeu', 'Conquista', 0, 4),                        -- Em chamas
    (9, 'oculos-sol', 'Óculos de sol', 'Estilo até debaixo do sol', 'Rosto', 'Moedas', 30, NULL),
    (10, 'broche-sinal', 'Broche de sinais', NULL, 'Peito', 'Premio', 0, NULL),      -- prêmio da 1ª atividade
    (11, 'estrela-coral', 'Estrela coral', 'Pra quem brilha nos estudos', 'Peito', 'Moedas', 25, NULL),
    (12, 'fundo-ceu', 'Céu azul', 'Um céu limpinho atrás de você', 'Fundo', 'Moedas', 20, NULL);


-- =====================================================================
-- USUÁRIOS DE TESTE
-- Mari: usa o site desde 06/11 e tem 5 dias de foguinho.
-- Leo: acabou de criar a conta e está no meio do primeiro exercício.
-- Admin: cuida do conteúdo (não joga, por isso não tem progresso).
-- =====================================================================

-- 8. USUÁRIOS
-- A senha_hash aqui é só um texto de exemplo: com ele, o login NÃO funciona.
-- No site de verdade, quem gera o hash é a API (Argon2) no cadastro.
INSERT INTO usuarios
    (id_usuario, nome, email, senha_hash, meta_diaria, tipo_usuario, data_cadastro)
VALUES
    (1, 'Mari', 'mari@exemplo.com', 'hash-de-exemplo', 3, 'Usuario', '2026-11-06 12:50:00'),
    (2, 'Leo', 'leo@exemplo.com', 'hash-de-exemplo', 1, 'Usuario', '2026-11-11 13:55:00'),
    (3, 'Admin', 'admin@exemplo.com', 'hash-de-exemplo', 3, 'Administrador', '2026-11-01 09:00:00');

-- 9. PREFERÊNCIAS
INSERT INTO preferencias_usuario
    (id_usuario, preferencias)
VALUES
    (1, '{"tema": "escuro", "tamanho_texto": "normal", "animacoes": "normal"}'),
    (2, '{"tema": "claro", "tamanho_texto": "grande", "animacoes": "reduzidas"}');

-- 10. SESSÃO (a Mari está logada)
-- SHA2(..., 256) gera o hash do código do cookie, do mesmo jeito que a API vai fazer.
INSERT INTO sessoes
    (id_usuario, token_hash, data_criacao, data_expiracao)
VALUES
    (1, SHA2('codigo-de-teste-da-mari', 256), '2026-11-11 12:00:00', '2026-11-18 12:00:00');

-- 11. PROGRESSO
-- Mari: 5 atividades novas = 100 XP.
--   Moedas: 20 (boas-vindas) + 15 (1ª atividade) + 4 x 5 (as outras)
--         + 5 (missão dos sinais) + 20 (missão da ofensiva) - 30 (chapéu de festa) = 50
-- Leo: errou 1 pergunta agora há pouco, então tem 2 vidas e uma voltando.
INSERT INTO progresso_usuario
    (id_usuario, xp, moedas, vidas, proxima_vida, energia, proxima_energia,
     sequencia_dias, data_ultima_atividade, protetores, id_liga, ganhou_bonus_primeira)
VALUES
    (1, 100, 50, 3, NULL, 4, '2026-11-11 17:00:00', 5, '2026-11-11', 1, 1, TRUE),
    (2, 0, 20, 2, '2026-11-11 14:35:00', 5, NULL, 0, NULL, 0, 1, FALSE);

-- 12. FOGUINHO DA MARI (calendário)
-- No domingo (08/11) ela não praticou, e o protetor salvou a ofensiva.
-- O dia salvo pelo protetor não aumenta a sequência: 5 dias praticados = 5 de ofensiva.
INSERT INTO atividade_diaria
    (id_usuario, data_atividade, tipo_dia, atividades_feitas, xp_ganho)
VALUES
    (1, '2026-11-06', 'Praticou', 1, 20),
    (1, '2026-11-07', 'Praticou', 1, 20),
    (1, '2026-11-08', 'Protetor', 0, 0),
    (1, '2026-11-09', 'Praticou', 1, 20),
    (1, '2026-11-10', 'Praticou', 1, 20),
    (1, '2026-11-11', 'Praticou', 1, 20);

-- 13. ATIVIDADES QUE A MARI CONCLUIU
INSERT INTO progresso_trilha
    (id_usuario, id_atividade, data_conclusao)
VALUES
    (1, 1, '2026-11-06 13:00:00'), -- As vogais
    (1, 2, '2026-11-07 10:20:00'), -- Pratique: vogais
    (1, 6, '2026-11-09 18:40:00'), -- Letra A (no dicionário)
    (1, 4, '2026-11-10 19:05:00'), -- De 1 a 5
    (1, 5, '2026-11-11 12:10:00'); -- Pratique: 1 a 5

-- 14. TENTATIVAS
INSERT INTO tentativas_atividade
    (id_tentativa, id_usuario, id_atividade, acertos, erros, xp_ganho, moedas_ganhas, data_inicio, data_conclusao)
VALUES
    (1, 1, 2, 5, 1, 20, 5, '2026-11-07 10:15:00', '2026-11-07 10:20:00'), -- Mari, vogais: errou 1 e acertou na 2ª chance
    (2, 1, 5, 5, 0, 20, 5, '2026-11-11 12:05:00', '2026-11-11 12:10:00'), -- Mari, 1 a 5: acertou tudo
    (3, 2, 2, 1, 1, 0, 0, '2026-11-11 14:00:00', NULL);                   -- Leo, vogais: ainda fazendo

-- 15. RESPOSTAS
INSERT INTO respostas_usuario
    (id_tentativa, id_pergunta, id_alternativa, rodada, acertou)
VALUES
    -- Mari, tentativa 1
    (1, 1, 2, 1, TRUE),
    (1, 2, 4, 1, FALSE),  -- escolheu o vídeo da U
    (1, 3, 7, 1, TRUE),
    (1, 4, 11, 1, TRUE),
    (1, 5, 14, 1, TRUE),
    (1, 2, 5, 2, TRUE),   -- segunda chance: agora acertou

    -- Mari, tentativa 2
    (2, 6, 16, 1, TRUE),
    (2, 7, 18, 1, TRUE),
    (2, 8, 21, 1, TRUE),
    (2, 9, 24, 1, TRUE),
    (2, 10, 28, 1, TRUE),

    -- Leo, tentativa 3 (ainda não terminou)
    (3, 1, 1, 1, FALSE),  -- escolheu E em vez de A
    (3, 2, 5, 1, TRUE);

-- 16. SINAIS QUE A MARI VIU NO DICIONÁRIO
INSERT INTO palavras_vistas
    (id_usuario, id_palavra, data_vista)
VALUES
    (1, 6, '2026-11-10'),  -- Oi
    (1, 6, '2026-11-11'),  -- Oi de novo, em outro dia
    (1, 8, '2026-11-11'),  -- Bom dia
    (1, 18, '2026-11-11'); -- Azul

-- 17. MISSÕES RESGATADAS
INSERT INTO missoes_resgatadas
    (id_usuario, id_missao, data_periodo, data_resgate)
VALUES
    (1, 3, '2026-11-11', '2026-11-11 12:30:00'), -- Ver 3 sinais (missão do dia)
    (1, 5, '2026-11-09', '2026-11-11 12:31:00'); -- 5 dias de ofensiva (missão da semana que começou em 09/11)

-- 18. XP DA SEMANA (LIGAS)
INSERT INTO xp_semanal
    (id_usuario, data_semana, id_liga, xp, resultado)
VALUES
    (1, '2026-11-02', 1, 40, 'Ficou'), -- semana passada (06 e 07/11), já fechada
    (1, '2026-11-09', 1, 60, NULL),    -- semana atual
    (2, '2026-11-09', 1, 0, NULL);

-- 19. CONQUISTAS DA MARI
INSERT INTO conquistas_usuario
    (id_usuario, id_conquista, data_conquista)
VALUES
    (1, 1, '2026-11-06 13:00:00'), -- Primeiro sinal
    (1, 2, '2026-11-11 12:10:00'); -- Mão na massa (5 atividades)

-- 20. INVENTÁRIO (COSMÉTICOS DOS USUÁRIOS)
INSERT INTO cosmeticos_usuario
    (id_usuario, id_cosmetico, custo_pago, data_compra)
VALUES
    (1, 1, 0, '2026-11-06 12:50:00'),  -- Mari: camiseta da logo (ganha no cadastro)
    (1, 10, 0, '2026-11-06 13:00:00'), -- Mari: broche (prêmio da 1ª atividade)
    (1, 7, 30, '2026-11-10 19:10:00'), -- Mari: chapéu de festa (comprado)
    (2, 1, 0, '2026-11-11 13:55:00');  -- Leo: camiseta da logo

-- 21. O QUE O MASCOTE ESTÁ USANDO
INSERT INTO mascote_equipado
    (id_usuario, id_cosmetico, tipo_cosmetico)
VALUES
    (1, 1, 'Roupa'),
    (1, 7, 'Chapeu'),
    (1, 10, 'Peito'),
    (2, 1, 'Roupa');


-- =====================================================================
-- CONSULTAS PARA CONFERIR (podem rodar quantas vezes quiser)
-- =====================================================================

-- Barra de pesquisa do dicionário: palavras que começam com "bo"
SELECT palavra, exemplo
FROM palavras_dicionario
WHERE palavra LIKE 'bo%';

-- Calendário do foguinho da Mari
SELECT data_atividade, tipo_dia, atividades_feitas, xp_ganho
FROM atividade_diaria
WHERE id_usuario = 1
ORDER BY data_atividade;

-- Ranking da liga Bronze nesta semana
SELECT u.nome, x.xp
FROM xp_semanal x
JOIN usuarios u ON u.id_usuario = x.id_usuario
WHERE x.data_semana = '2026-11-09' AND x.id_liga = 1
ORDER BY x.xp DESC;

-- Perguntas de "Pratique: vogais" com a resposta certa
-- (nas perguntas de vídeo não tem enunciado, então aparece o sinal da resposta)
SELECT p.ordem, p.tipo, p.enunciado,
       COALESCE(a.descricao, d.palavra) AS resposta_certa
FROM perguntas p
JOIN alternativas a ON a.id_pergunta = p.id_pergunta AND a.correta = TRUE
LEFT JOIN palavras_dicionario d ON d.id_palavra = a.id_palavra
WHERE p.id_atividade = 2
ORDER BY p.ordem;