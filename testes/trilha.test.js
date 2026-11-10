// Testes da trilha: as 8 etapas, as atividades de cada uma e a ordem em que abrem.
const test = require("node:test");
const assert = require("node:assert/strict");
const { abrirApp, alunoCadastrado } = require("./abrir-app");

const ETAPAS = [
  "alfabeto-manual", "numeros", "apresentacoes", "cumprimentos",
  "em-casa", "na-escola", "no-trabalho", "na-rua",
];

test("a trilha tem as 8 etapas, na ordem certa", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  assert.deepEqual(app.rodar("TOPIC_ORDER"), ETAPAS);
  assert.deepEqual(app.erros, []);
  app.fechar();
});

test("cada etapa tem aprender, exercício, aprender, exercício e revisão, com 5 perguntas por exercício", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  for (const etapa of ETAPAS) {
    const tipos = app.rodar(`learningTopics["${etapa}"].branches.map((b) => b.kind)`);
    assert.deepEqual(tipos, ["learn", "practice", "learn", "practice", "practice"], etapa);
    const perguntas = app.rodar(`learningTopics["${etapa}"].branches.filter((b) => b.kind === "practice").map((b) => b.questions.length)`);
    assert.deepEqual(perguntas, [5, 5, 5], etapa);
  }
  app.fechar();
});

test("a prova final de cada etapa tem 6 perguntas (2 de cada exercício)", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  for (const etapa of ETAPAS) {
    assert.equal(app.rodar(`stepsFor("${etapa}", "final").length`), 6, etapa);
  }
  app.fechar();
});

test("toda pergunta tem resposta certa válida e explicação", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  const problemas = app.rodar(`(() => {
    const achados = [];
    for (const [etapa, topico] of Object.entries(learningTopics)) {
      for (const atividade of topico.branches.filter((b) => b.kind === "practice")) {
        atividade.questions.forEach((p, i) => {
          const onde = etapa + "/" + atividade.id + " pergunta " + (i + 1);
          if (!p.explain) achados.push(onde + ": sem explicação");
          if (p.type === "vf") {
            if (typeof p.answer !== "boolean") achados.push(onde + ": resposta de V ou F não é true/false");
          } else if (!Array.isArray(p.options) || !(p.answer >= 0 && p.answer < p.options.length)) {
            achados.push(onde + ": resposta fora das opções");
          }
        });
      }
    }
    return achados;
  })()`);
  assert.deepEqual(problemas, []);
  app.fechar();
});

test("só a primeira etapa começa aberta; a próxima abre com a prova final da anterior", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  assert.equal(app.rodar(`isTopicUnlocked("alfabeto-manual")`), true);
  assert.equal(app.rodar(`isTopicUnlocked("numeros")`), false);
  app.rodar(`markLessonDone("alfabeto-manual", "final")`);
  assert.equal(app.rodar(`isTopicUnlocked("numeros")`), true);
  assert.equal(app.rodar(`isTopicUnlocked("apresentacoes")`), false);
  app.fechar();
});

test("as atividades abrem uma de cada vez e a prova só depois das 5", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  const ids = app.rodar(`learningTopics["numeros"].branches.map((b) => b.id)`);
  assert.equal(app.rodar(`isBranchUnlocked("numeros", 0)`), true);
  assert.equal(app.rodar(`isBranchUnlocked("numeros", 1)`), false);
  ids.slice(0, 4).forEach((id) => app.rodar(`markLessonDone("numeros", "${id}")`));
  assert.equal(app.rodar(`isFinalUnlocked("numeros")`), false, "faltando a revisão");
  app.rodar(`markLessonDone("numeros", "${ids[4]}")`);
  assert.equal(app.rodar(`isFinalUnlocked("numeros")`), true);
  app.fechar();
});

test("progresso de uma trilha antiga é zerado, mas as letras do alfabeto do Dicionário ficam", async () => {
  const app = await abrirApp({
    salvo: alunoCadastrado({ trailVersion: 1, completedLessons: ["alfabeto:A", "alfabeto:B", "numeros:um-a-cinco", "saudacoes:final"] }),
  });
  assert.deepEqual(app.rodar("state.completedLessons"), ["alfabeto:A", "alfabeto:B"]);
  assert.equal(app.rodar("state.trailVersion"), app.rodar("TRAIL_VERSION"));
  app.fechar();
});

test("na trilha atual, só some o progresso de etapas ou atividades que não existem mais", async () => {
  const [aprender] = await (async () => {
    const espiar = await abrirApp({ salvo: alunoCadastrado() });
    const ids = espiar.rodar(`learningTopics["numeros"].branches.map((b) => b.id)`);
    espiar.fechar();
    return ids;
  })();
  const salvos = ["alfabeto:C", `numeros:${aprender}`, "etapa-que-sumiu:final", "numeros:atividade-que-sumiu"];
  const app = await abrirApp({ salvo: alunoCadastrado({ completedLessons: salvos }) });
  assert.deepEqual(app.rodar("state.completedLessons"), ["alfabeto:C", `numeros:${aprender}`]);
  app.fechar();
});
