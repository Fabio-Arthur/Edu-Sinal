// Abre o protótipo do EduSinal num "navegador de mentira" (jsdom), rodando os
// mesmos arquivos da pasta frontend. Cada teste abre o app do zero.
//
//   const app = await abrirApp({ salvo: { xp: 50 }, agora: "2026-10-15T10:00:00" });
//   app.rodar("state.xp")        // roda um código dentro da página e devolve o resultado
//   app.relogio.avancar(60000)   // adianta o relógio da página em 1 minuto
//   app.erros                    // erros de JavaScript que aconteceram na página
//   app.fechar()

const fs = require("node:fs");
const path = require("node:path");
const { after } = require("node:test");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");

const RAIZ = path.resolve(__dirname, "..");
const ENDERECO = "http://edusinal.teste/";
const PAGINA = `${ENDERECO}frontend/app/prototipo/index.html`;

// Fecha todas as páginas no fim, mesmo se um teste falhar no meio
// (o app tem um relógio que roda a cada 15 s e não deixaria o teste terminar).
const abertas = new Set();
after(() => abertas.forEach((window) => window.close()));

// Entrega os arquivos do projeto como se viessem de um site
// (o "?v=118" do fim dos endereços é ignorado).
class ArquivosDoProjeto extends ResourceLoader {
  fetch(url) {
    if (!url.startsWith(ENDERECO)) return null; // nada de internet nos testes
    const caminho = path.join(RAIZ, decodeURIComponent(new URL(url).pathname));
    return fs.promises.readFile(caminho);
  }
}

// Relógio da página parado numa data escolhida (para testar ofensiva, vidas...).
function instalarRelogio(window, agora) {
  const DataReal = window.Date;
  let momento = new DataReal(agora).getTime();
  class DataDeTeste extends DataReal {
    constructor(...valores) {
      if (valores.length === 0) super(momento);
      else super(...valores);
    }
    static now() {
      return momento;
    }
  }
  window.Date = DataDeTeste;
  return {
    avancar(ms) {
      momento += ms;
    },
  };
}

// Coisas de navegador que o jsdom não tem.
function completarNavegador(window, { celular }) {
  window.matchMedia = (consulta) => ({
    matches: celular && consulta.includes("max-width"),
    media: consulta,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.scrollTo = () => {};
  window.Element.prototype.scrollTo = () => {};
}

async function abrirApp({ salvo = null, agora = "2026-10-15T10:00:00", celular = false, tela = "" } = {}) {
  const erros = [];
  const consoleDaPagina = new VirtualConsole();
  consoleDaPagina.on("jsdomError", (erro) => {
    if (!String(erro.message).startsWith("Not implemented")) erros.push(erro);
  });

  let relogio;
  const dom = await JSDOM.fromFile(path.join(RAIZ, "frontend/app/prototipo/index.html"), {
    url: tela ? `${PAGINA}?tela=${tela}` : PAGINA,
    runScripts: "dangerously",
    resources: new ArquivosDoProjeto(),
    pretendToBeVisual: true,
    virtualConsole: consoleDaPagina,
    beforeParse(window) {
      relogio = instalarRelogio(window, agora);
      completarNavegador(window, { celular });
      if (salvo) window.localStorage.setItem("edusinal-prototype", JSON.stringify(salvo));
    },
  });
  const { window } = dom;
  abertas.add(window);
  await new Promise((pronto) => {
    if (window.document.readyState === "complete") pronto();
    else window.addEventListener("load", pronto);
  });

  return {
    window,
    document: window.document,
    erros,
    relogio,
    // o resultado vira dado comum (listas e objetos da página não são iguais aos do Node)
    rodar: (codigo) => {
      const resultado = window.eval(codigo);
      return resultado === undefined ? undefined : JSON.parse(JSON.stringify(resultado));
    },
    fechar: () => {
      abertas.delete(window);
      window.close();
    },
  };
}

// Perfil de aluno já cadastrado, com a trilha na versão atual (sem progresso).
function alunoCadastrado(extra = {}) {
  return { isRegistered: true, name: "Teste", trailVersion: 2, completedLessons: [], ...extra };
}

module.exports = { abrirApp, alunoCadastrado };
