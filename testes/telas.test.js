// Testes das telas: todas abrem sem erro e o calendário começa no domingo.
const test = require("node:test");
const assert = require("node:assert/strict");
const { abrirApp, alunoCadastrado } = require("./abrir-app");

const TELAS = ["intro", "login", "signup", "trail", "signs", "leagues", "missions", "shop", "profile", "more", "mascot"];

for (const celular of [false, true]) {
  test(`todas as telas abrem sem erro (${celular ? "celular" : "computador"})`, async () => {
    const app = await abrirApp({ salvo: alunoCadastrado(), celular });
    for (const tela of TELAS) {
      app.rodar(`setScreen("${tela}")`);
      assert.equal(app.rodar("state.screen"), tela);
      assert.ok(app.document.getElementById("screen-root").innerHTML.trim().length > 0, `tela vazia: ${tela}`);
    }
    assert.deepEqual(app.erros, []);
    app.fechar();
  });
}

test("quem nunca se cadastrou começa na apresentação; quem já se cadastrou, na Home", async () => {
  const novo = await abrirApp();
  assert.equal(novo.rodar("state.screen"), "intro");
  novo.fechar();
  const antigo = await abrirApp({ salvo: alunoCadastrado() });
  assert.equal(antigo.rodar("state.screen"), "trail");
  antigo.fechar();
});

test("o endereço ?tela= abre a tela pedida", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado(), tela: "lojinha" });
  assert.equal(app.rodar("state.screen"), "shop");
  app.fechar();
});

test("a árvore de cada etapa abre sem erro", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado() });
  for (const etapa of app.rodar("TOPIC_ORDER")) {
    app.rodar(`state.focusTopic = "${etapa}"; render();`);
    assert.equal(app.rodar("state.focusTopic"), etapa);
  }
  assert.deepEqual(app.erros, []);
  app.fechar();
});

test("o calendário da ofensiva começa no domingo", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado(), agora: "2026-10-15T10:00:00" });
  const pagina = app.document.createElement("div");
  pagina.innerHTML = app.rodar("renderStreakCalendar()");
  const diasDaSemana = [...pagina.querySelectorAll(".calendar-weekday")].map((dia) => dia.textContent);
  assert.deepEqual(diasDaSemana, ["D", "S", "T", "Q", "Q", "S", "S"]);
  // 1º de outubro de 2026 é quinta: 4 espaços vazios antes (D, S, T, Q)
  assert.equal(pagina.querySelectorAll(".calendar-cell.is-empty").length, 4);
  app.fechar();
});
