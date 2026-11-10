// Testes da atividade: responder, segunda chance e prova final.
const test = require("node:test");
const assert = require("node:assert/strict");
const { abrirApp, alunoCadastrado } = require("./abrir-app");

// Marca a pergunta atual certa ou errada, do jeito que o aluno faz (escolhe e confere).
function responder(app, certo) {
  app.rodar(`(() => {
    const certa = correctOption(currentStep());
    const opcoes = [...document.querySelectorAll(".answer-option")];
    selectAnswer(opcoes.find((opcao) => (Number(opcao.dataset.option) === certa) === ${certo}));
    checkAnswer();
  })()`);
}

// Começa o 1º exercício da etapa Números (a 1ª atividade, de aprender, já feita).
async function comecarExercicio() {
  const app = await abrirApp({ salvo: alunoCadastrado({ completedLessons: [] }) });
  const [aprender, exercicio] = app.rodar(`learningTopics["numeros"].branches.map((b) => b.id)`);
  app.rodar(`markLessonDone("numeros", "${aprender}")`);
  app.rodar(`startBranch("numeros", "${exercicio}")`);
  assert.equal(app.rodar("state.screen"), "lesson");
  return { app, exercicio };
}

test("errar no exercício traz a pergunta de volta no fim, uma vez só", async () => {
  const { app } = await comecarExercicio();
  const pergunta = app.rodar("currentStep().explain");
  responder(app, false);
  assert.equal(app.rodar("state.currentLesson.steps.length"), 6, "a pergunta errada entrou no fim");
  assert.equal(app.rodar("state.currentLesson.steps.at(-1).isRetry"), true);
  assert.equal(app.rodar("state.currentLesson.steps.at(-1).explain"), pergunta);

  // vai até a segunda chance e erra de novo: não volta outra vez
  for (let i = 0; i < 4; i += 1) {
    app.rodar("nextQuestion()");
    responder(app, true);
  }
  app.rodar("nextQuestion()");
  assert.equal(app.rodar("currentStep().isRetry"), true);
  assert.match(app.document.body.innerHTML, /Segunda chance/);
  responder(app, false);
  assert.equal(app.rodar("state.currentLesson.steps.length"), 6);
  assert.deepEqual(app.erros, []);
  app.fechar();
});

test("acertar na segunda chance mostra “Agora foi!”", async () => {
  const { app } = await comecarExercicio();
  responder(app, false);
  for (let i = 0; i < 5; i += 1) {
    app.rodar("nextQuestion()");
    responder(app, true);
  }
  assert.match(app.document.getElementById("answer-feedback").textContent, /Agora foi!/);
  app.fechar();
});

test("errar gasta uma vida", async () => {
  const { app } = await comecarExercicio();
  const antes = app.rodar("state.lives");
  responder(app, false);
  assert.equal(app.rodar("state.lives"), antes - 1);
  app.fechar();
});

test("concluir um exercício novo dá XP e gasta 1 de energia", async () => {
  const { app, exercicio } = await comecarExercicio();
  const xp = app.rodar("state.xp");
  const energia = app.rodar("state.energy");
  for (let i = 0; i < 5; i += 1) {
    if (i > 0) app.rodar("nextQuestion()");
    responder(app, true);
  }
  app.rodar("finishLesson()");
  assert.equal(app.rodar(`isLessonDone("numeros", "${exercicio}")`), true);
  assert.equal(app.rodar("state.xp"), xp + app.rodar("XP_PER_EXERCISE"));
  assert.equal(app.rodar("state.energy"), energia - 1);
  app.fechar();
});

test("na prova final não tem segunda chance, e errar 2 reprova", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  app.rodar(`learningTopics["numeros"].branches.forEach((b) => markLessonDone("numeros", b.id))`);
  app.rodar(`startBranch("numeros", "final")`);
  assert.equal(app.rodar("state.screen"), "lesson");
  responder(app, false);
  assert.equal(app.rodar("state.currentLesson.steps.length"), 6, "a prova não ganha pergunta extra");
  app.rodar("nextQuestion()");
  responder(app, false);
  assert.equal(app.document.getElementById("lesson-continue").textContent, "Ver resultado");
  app.rodar("finishLesson()");
  assert.equal(app.rodar(`isLessonDone("numeros", "final")`), false);
  app.fechar();
});

test("não dá pra pular a ordem das atividades", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  const ids = app.rodar(`learningTopics["numeros"].branches.map((b) => b.id)`);
  app.rodar(`startBranch("numeros", "${ids[3]}")`);
  assert.notEqual(app.rodar("state.screen"), "lesson");
  app.rodar(`startBranch("numeros", "final")`);
  assert.notEqual(app.rodar("state.screen"), "lesson");
  app.fechar();
});
