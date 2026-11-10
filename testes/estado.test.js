// Testes das regras do jogo: vidas, energia, ofensiva e virada do dia.
const test = require("node:test");
const assert = require("node:assert/strict");
const { abrirApp, alunoCadastrado } = require("./abrir-app");

const MINUTO = 60 * 1000;
const AGORA = "2026-10-15T10:00:00";

test("uma vida volta a cada 30 minutos, até 3", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ lives: 1, nextLifeAt: new Date(AGORA).toISOString() }), agora: AGORA });
  app.rodar("refreshLives()");
  assert.equal(app.rodar("state.lives"), 2);
  app.relogio.avancar(29 * MINUTO);
  app.rodar("refreshLives()");
  assert.equal(app.rodar("state.lives"), 2, "29 minutos ainda não bastam");
  app.relogio.avancar(1 * MINUTO);
  app.rodar("refreshLives()");
  assert.equal(app.rodar("state.lives"), 3);
  assert.equal(app.rodar("state.nextLifeAt"), null, "com vidas cheias não tem contagem");
  app.fechar();
});

test("a energia volta 1 ponto a cada 3 horas", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ energy: 5 }), agora: AGORA });
  app.rodar("spendEnergy()");
  assert.equal(app.rodar("state.energy"), 4);
  app.relogio.avancar(3 * 60 * MINUTO);
  app.rodar("refreshEnergy()");
  assert.equal(app.rodar("state.energy"), 5);
  app.fechar();
});

test("sem energia, atividade nova fica bloqueada, mas revisão não", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ energy: 0, nextEnergyAt: "2026-10-15T12:00:00" }), agora: AGORA });
  const [aprender] = app.rodar(`learningTopics["alfabeto-manual"].branches.map((b) => b.id)`);
  assert.equal(app.rodar(`activityBlockReason("alfabeto-manual", "${aprender}", "learn")`), "energy");
  app.rodar(`markLessonDone("alfabeto-manual", "${aprender}")`);
  assert.equal(app.rodar(`activityBlockReason("alfabeto-manual", "${aprender}", "learn")`), "", "refazer é revisão");
  app.fechar();
});

test("ficar um dia sem praticar zera a ofensiva", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ streak: 5, lastActiveDate: "2026-10-13" }), agora: AGORA });
  assert.equal(app.rodar("state.streak"), 0);
  app.fechar();
});

test("praticar ontem mantém a ofensiva", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ streak: 5, lastActiveDate: "2026-10-14" }), agora: AGORA });
  assert.equal(app.rodar("state.streak"), 5);
  app.fechar();
});

test("o protetor de ofensiva salva o dia perdido e aparece no calendário", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ streak: 5, lastActiveDate: "2026-10-13", streakFreezes: 1 }), agora: AGORA });
  assert.equal(app.rodar("state.streak"), 5);
  assert.equal(app.rodar("state.streakFreezes"), 0);
  assert.deepEqual(app.rodar("state.frozenDays"), ["2026-10-14"]);
  app.fechar();
});

test("no dia seguinte, as missões e a meta do dia recomeçam", async () => {
  const daily = { date: "2026-10-14", exercises: 3, xp: 60, signsViewed: ["Oi"], claimed: ["meta"] };
  const app = await abrirApp({ salvo: alunoCadastrado({ daily, lastActiveDate: "2026-10-14" }), agora: AGORA });
  assert.equal(app.rodar("state.daily.date"), "2026-10-15");
  assert.equal(app.rodar("state.daily.exercises"), 0);
  assert.deepEqual(app.rodar("state.daily.claimed"), []);
  app.fechar();
});

test("a semana das ligas começa na segunda-feira", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado(), agora: AGORA }); // 15/10/2026 é quinta
  assert.equal(app.rodar("weekKey()"), "2026-10-12");
  assert.equal(app.rodar(`weekKey(new Date("2026-10-18T10:00:00"))`), "2026-10-12", "domingo ainda é da mesma semana");
  assert.equal(app.rodar(`weekKey(new Date("2026-10-19T10:00:00"))`), "2026-10-19");
  app.fechar();
});
