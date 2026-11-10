# Testes do front-end

Testes automáticos do protótipo (`frontend/app/prototipo`). Eles abrem o app
num "navegador de mentira" ([jsdom](https://github.com/jsdom/jsdom)) e usam
as funções de verdade do app, então avisam se uma mudança quebrar alguma regra.

A pasta fica **fora** de `frontend/` de propósito: lá dentro, a Vercel poderia
achar o `package.json` e tentar "montar" o site.

## Como rodar

Precisa do [Node.js](https://nodejs.org) 20 ou mais novo.

```bash
cd testes
npm install   # só na primeira vez
npm test
```

Leva uns 15 segundos. No fim aparece quantos passaram (`pass`) e quantos
falharam (`fail`); se algum falhar, ele mostra qual e o que esperava.

## O que é testado

| Arquivo | O quê |
|---|---|
| `trilha.test.js` | as 8 etapas e a ordem delas, as 5 atividades de cada uma, 5 perguntas por exercício, prova com 6, toda pergunta com resposta certa e explicação, ordem de liberação, limpeza do progresso antigo (sem perder as letras do Dicionário) |
| `licao.test.js` | segunda chance (a errada volta no fim, uma vez só, com "Agora foi!"), perder vida ao errar, XP e energia ao concluir, prova sem segunda chance e reprovando com 2 erros, não pular atividades |
| `estado.test.js` | vidas voltando a cada 30 min, energia a cada 3 h, bloqueio sem energia (revisão continua livre), ofensiva (zera, mantém, protetor), virada do dia e semana começando na segunda |
| `telas.test.js` | todas as telas abrem sem erro no computador e no celular, tela inicial certa, `?tela=` na URL, árvore de cada etapa, calendário começando no domingo |

## Escrevendo um teste novo

```js
const { abrirApp, alunoCadastrado } = require("./abrir-app");

test("o que deve acontecer", async () => {
  const app = await abrirApp({ salvo: alunoCadastrado({ xp: 50 }), agora: "2026-10-15T10:00:00" });
  assert.equal(app.rodar("state.xp"), 50); // "rodar" executa código dentro da página
  app.fechar();
});
```

- `salvo`: o que estaria guardado no navegador (o progresso do aluno).
- `agora`: a data e hora da página (o relógio fica parado; `app.relogio.avancar(ms)` adianta).
- `celular: true`: abre como se fosse no celular.
- `app.erros`: erros de JavaScript que aconteceram na página.
