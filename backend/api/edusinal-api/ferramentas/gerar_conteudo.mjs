// GERADOR DO CONTEÚDO DO BANCO
//
// Lê o conteúdo que já existe no app (frontend/app/prototipo/js) e escreve o
// arquivo conteudo.sql com tudo nas tabelas do banco: palavras, etapas,
// atividades, cartões, perguntas, alternativas e os itens do mascote.
//
// Quando alguém mudar o conteúdo no app, é só rodar de novo (precisa do Node):
//   node backend/api/edusinal-api/ferramentas/gerar_conteudo.mjs
//
// Regra importante: as alternativas são gravadas NA MESMA ORDEM das opções
// do app. A API usa essa ordem para saber qual opção o aluno escolheu.

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const pastaDaApi = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pastaDoApp = path.resolve(pastaDaApi, "../../../frontend/app/prototipo/js");

// Roda os arquivos do app numa "caixinha" e pega as listas de dentro deles.
function lerDoApp(arquivo, nomes) {
  const codigo = fs.readFileSync(path.join(pastaDoApp, arquivo), "utf8").replace(/^const (\w+)/gm, "var $1");
  const caixa = { state: {}, window: {}, document: {} };
  vm.createContext(caixa);
  vm.runInContext(codigo, caixa);
  return Object.fromEntries(nomes.map((nome) => [nome, caixa[nome]]));
}

const { learningTopics } = lerDoApp("conteudo.js", ["learningTopics"]);
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const { MASCOT_ITEMS } = lerDoApp("telas-mascote.js", ["MASCOT_ITEMS"]);

// Texto seguro para o SQL: 'Bom dia' → 'Bom dia'; aspas simples viram duas.
const texto = (valor) => (valor === null || valor === undefined ? "NULL" : `'${String(valor).replace(/'/g, "''")}'`);
const codigoDe = (nome) => nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sinal";

// ----- Categorias -----
// As 5 primeiras (Alfabeto, Saudações, Números, Família, Cores) já são criadas
// pelo estrutura.sql. As etapas da trilha que não têm categoria parecida
// ganham uma nova, para os sinais delas.
const CATEGORIAS_DO_ESTRUTURA_SQL = 5;
const categoriaDaEtapa = { "alfabeto-manual": 1, numeros: 3 };
const novasCategorias = [];
for (const [id, etapa] of Object.entries(learningTopics)) {
  if (categoriaDaEtapa[id]) continue;
  const numero = CATEGORIAS_DO_ESTRUTURA_SQL + novasCategorias.length + 1;
  novasCategorias.push(`(${numero}, ${texto(etapa.title)}, ${numero})`);
  categoriaDaEtapa[id] = numero;
}

// ----- Palavras (sinais) -----
// O código de cada sinal é o mesmo que o app calcula (signCode, em js/telas-dicionario.js).
const palavras = new Map(); // nome do sinal → { id, ... }
function palavra(nome, categoria, exemplo = null) {
  if (!palavras.has(nome)) {
    let codigo = codigoDe(nome);
    while ([...palavras.values()].some((outra) => outra.codigo === codigo)) codigo += "-2";
    palavras.set(nome, { id: palavras.size + 1, codigo, nome, categoria, exemplo });
  }
  return palavras.get(nome).id;
}
ALPHABET.forEach((letra) => palavra(`Letra ${letra}`, 1)); // o alfabeto fica todo aberto no dicionário

// ----- Etapas, atividades, cartões, perguntas e alternativas -----
const etapas = [];
const atividades = [];
const cartoes = [];
const perguntas = [];
const alternativas = [];
const tipoDaPergunta = { "video-palavra": "Video-palavra", "palavra-video": "Palavra-video", situacao: "Situacao", vf: "Verdadeiro ou falso" };

function gravarPerguntas(idAtividade, lista, categoria) {
  lista.forEach((pergunta, posicao) => {
    const idPergunta = perguntas.length + 1;
    const enunciado = pergunta.q ?? null;
    perguntas.push(`(${idPergunta}, ${idAtividade}, ${posicao + 1}, ${texto(tipoDaPergunta[pergunta.type])}, ${texto(enunciado)}, ${texto(pergunta.explain)})`);

    if (pergunta.type === "vf") {
      alternativas.push(`(${idPergunta}, NULL, 'Verdadeiro', ${pergunta.answer ? "TRUE" : "FALSE"})`);
      alternativas.push(`(${idPergunta}, NULL, 'Falso', ${pergunta.answer ? "FALSE" : "TRUE"})`);
      return;
    }
    pergunta.options.forEach((opcao, posicaoDaOpcao) => {
      const correta = posicaoDaOpcao === pergunta.answer ? "TRUE" : "FALSE";
      if (pergunta.type === "palavra-video") {
        // a opção é um vídeo: aponta para o sinal
        alternativas.push(`(${idPergunta}, ${palavra(opcao, categoria)}, NULL, ${correta})`);
      } else {
        alternativas.push(`(${idPergunta}, NULL, ${texto(opcao)}, ${correta})`);
      }
    });
  });
}

Object.entries(learningTopics).forEach(([idEtapa, etapa], posicaoDaEtapa) => {
  const numeroDaEtapa = etapas.length + 1;
  etapas.push(`(${numeroDaEtapa}, ${texto(idEtapa)}, ${texto(etapa.title)}, ${texto(etapa.subtitle)}, ${posicaoDaEtapa + 1})`);
  const categoria = categoriaDaEtapa[idEtapa];

  etapa.branches.forEach((atividade, posicao) => {
    const idAtividade = atividades.length + 1;
    const tipo = atividade.kind === "learn" ? "Aprender" : "Exercicio";
    atividades.push(`(${idAtividade}, ${texto(`${idEtapa}:${atividade.id}`)}, ${numeroDaEtapa}, ${posicao + 1}, ${texto(tipo)}, ${texto(atividade.label)})`);
    (atividade.cards || []).forEach((cartao, ordem) => {
      cartoes.push(`(${idAtividade}, ${ordem + 1}, ${palavra(cartao.sign, categoria)}, ${texto(cartao.tip)})`);
    });
    gravarPerguntas(idAtividade, atividade.questions || [], categoria);
  });

  // A prova final não tem perguntas próprias: a API usa as 2 primeiras de cada exercício.
  atividades.push(`(${atividades.length + 1}, ${texto(`${idEtapa}:final`)}, ${numeroDaEtapa}, ${etapa.branches.length + 1}, 'Prova final', 'Prova final')`);
});

// Dicionário: uma etapa fora da trilha (ordem vazia), só com o Desafia-me.
// As perguntas dele são sorteadas pela API entre os exercícios já concluídos.
const numeroDoDicionario = etapas.length + 1;
etapas.push(`(${numeroDoDicionario}, 'dicionario', 'Dicionário', 'Desafia-me com os sinais desbloqueados', NULL)`);
atividades.push(`(${atividades.length + 1}, 'dicionario:desafio', ${numeroDoDicionario}, 1, 'Desafio', 'Desafia-me')`);

// ----- Itens do mascote -----
const parte = { shirt: "Roupa", head: "Chapeu", face: "Rosto", chest: "Peito", background: "Fundo" };
const conquista = { primeiro: 1, cinco: 2, etapa: 3, ofensiva: 4, explorador: 5, colecionador: 6, liga: 7 }; // ids da tabela conquistas
const cosmeticos = MASCOT_ITEMS.filter((item) => item.id).map((item, posicao) => {
  const forma = { free: "Gratis", coins: "Moedas", reward: "Premio", achievement: "Conquista" }[item.unlock.type];
  const custo = item.unlock.type === "coins" ? item.unlock.cost : 0;
  const idConquista = item.unlock.type === "achievement" ? conquista[item.unlock.id] : "NULL";
  return `(${posicao + 1}, ${texto(item.id)}, ${texto(item.name)}, ${texto(item.description ?? null)}, ${texto(parte[item.slot])}, ${texto(forma)}, ${custo}, ${idConquista})`;
});

// ----- Escreve o arquivo -----
const lista = (linhas) => linhas.join(",\n  ") + ";";
const sql = `-- CONTEÚDO COMPLETO DO EDUSINAL (gerado por ferramentas/gerar_conteudo.mjs)
-- Não edite à mão: mude o conteúdo no app e rode o gerador de novo.
-- Rodar DEPOIS do estrutura.sql, com o banco vazio (no lugar do conteúdo de teste
-- do estrutura_inserts.sql).

USE edu_sinal;

INSERT INTO categorias (id_categoria, nome, ordem) VALUES
  ${lista(novasCategorias)}

INSERT INTO palavras_dicionario (id_palavra, codigo, palavra, exemplo, id_categoria) VALUES
  ${lista([...palavras.values()].map((p) => `(${p.id}, ${texto(p.codigo)}, ${texto(p.nome)}, ${texto(p.exemplo)}, ${p.categoria})`))}

INSERT INTO etapas (id_etapa, codigo, titulo, descricao, ordem) VALUES
  ${lista(etapas)}

INSERT INTO atividades (id_atividade, codigo, id_etapa, ordem, tipo, titulo) VALUES
  ${lista(atividades)}

INSERT INTO cartoes (id_atividade, ordem, id_palavra, dica) VALUES
  ${lista(cartoes)}

INSERT INTO perguntas (id_pergunta, id_atividade, ordem, tipo, enunciado, explicacao) VALUES
  ${lista(perguntas)}

-- Na mesma ordem das opções do app (a API depende disso).
INSERT INTO alternativas (id_pergunta, id_palavra, descricao, correta) VALUES
  ${lista(alternativas)}

INSERT INTO cosmeticos (id_cosmetico, codigo, nome, descricao, tipo_cosmetico, forma_liberar, custo_moedas, id_conquista) VALUES
  ${lista(cosmeticos)}
`;
fs.writeFileSync(path.join(pastaDaApi, "conteudo.sql"), sql);
console.log(`conteudo.sql: ${palavras.size} palavras, ${etapas.length} etapas, ${atividades.length} atividades, ${cartoes.length} cartões, ${perguntas.length} perguntas, ${alternativas.length} alternativas, ${cosmeticos.length} itens`);
