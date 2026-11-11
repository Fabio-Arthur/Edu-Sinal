// CONVERSA COM A API
// Este é o único arquivo do app que fala com o servidor. As telas chamam
// as funções daqui; se a API mudar de endereço, só muda aqui.
//
// Como funciona:
//   - quem está logado é guardado num cookie que só o servidor lê (HttpOnly);
//     o app nunca vê a senha nem o código da sessão;
//   - depois de qualquer ação (responder, comprar, resgatar...), a API devolve
//     o "estado" inteiro do aluno, e o app só copia para o "state" e redesenha.
//     Assim quem decide XP, moedas, vidas e energia é sempre o servidor.

// No computador, a API roda na porta 8000 do MESMO endereço do app (127.0.0.1
// ou localhost: precisa ser igual, senão o navegador não manda o cookie).
// Publicado, o app chama "/api" e a hospedagem repassa para a API.
const API_URL = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? `${location.protocol}//${location.hostname}:8000`
  : "/api";

// Erro que veio da API, com a mensagem em português para mostrar ao aluno.
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Faz um pedido para a API e devolve o JSON da resposta.
// Ex.: await api("POST", "/missoes/xp/resgatar")
async function api(method, path, body) {
  // Se demorar, mostra o "carregando" (a barrinha no topo, ver css/base.css)
  const loadingTimer = setTimeout(() => document.body.classList.add("is-loading"), 300);
  try {
    let response;
    try {
      response = await fetch(API_URL + path, {
        method,
        credentials: "include", // manda o cookie da sessão junto
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      // Nem chegou no servidor: internet caiu ou a API está desligada.
      throw new ApiError("Sem conexão com o servidor. Confira a internet e tente de novo.", 0);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      // O FastAPI manda o erro em "detail" (às vezes uma lista, no 422).
      const message = typeof data.detail === "string" ? data.detail : "Algo deu errado. Tente de novo.";
      throw new ApiError(message, response.status);
    }
    return data;
  } finally {
    clearTimeout(loadingTimer);
    document.body.classList.remove("is-loading");
  }
}

// Mostra o erro para o aluno. Sessão vencida (401) volta para o login.
function showApiError(error) {
  if (error.status === 401 && !["intro", "login", "signup", "terms"].includes(state.screen)) {
    state.isRegistered = false;
    setScreen("login");
  }
  showToast(error.message);
}

// Copia o estado que veio da API para o "state" do app.
// A API usa nomes em português; o app, os nomes antigos (em inglês).
function applyServerState(estado) {
  if (!estado) return;
  Object.assign(state, {
    isRegistered: true,
    name: estado.apelido,
    email: estado.email,
    dailyGoal: estado.meta_diaria,
    xp: estado.xp,
    coins: estado.moedas,
    lives: estado.vidas,
    nextLifeAt: estado.proxima_vida_em,
    energy: estado.energia,
    nextEnergyAt: estado.proxima_energia_em,
    energyRefillDate: estado.recarga_energia_em,
    streak: estado.ofensiva,
    lastActiveDate: estado.ultimo_dia_praticado,
    streakFreezes: estado.protetores,
    league: estado.liga,
    alphabetChallengeDate: estado.premio_desafio_em,
    hasFirstActivityReward: estado.ganhou_bonus_primeira,
    completedLessons: estado.concluidas,
    unlockedItems: estado.itens,
    mascot: {
      shirt: estado.mascote.roupa,
      head: estado.mascote.chapeu,
      face: estado.mascote.rosto,
      chest: estado.mascote.peito,
      background: estado.mascote.fundo,
    },
    practiceDays: estado.dias_praticados,
    frozenDays: estado.dias_salvos,
    signsSeen: estado.sinais_vistos,
    daily: {
      date: estado.hoje.dia,
      exercises: estado.hoje.atividades,
      xp: estado.hoje.xp,
      signsViewed: estado.hoje.sinais_vistos,
      claimed: estado.hoje.missoes_resgatadas,
    },
    week: {
      key: estado.semana.segunda,
      xp: estado.semana.xp,
      claimed: estado.semana.missoes_resgatadas,
    },
  });
}

// Partes do mascote: nome no app → nome na API.
const MASCOT_SLOT_NAMES = { shirt: "roupa", head: "chapeu", face: "rosto", chest: "peito", background: "fundo" };

// Ao abrir o app: se a sessão ainda vale, carrega o progresso. Senão, mostra a apresentação.
async function loadSession() {
  try {
    applyServerState(await api("GET", "/eu"));
    return true;
  } catch (error) {
    if (error.status !== 401) showToast(error.message);
    state.isRegistered = false;
    return false;
  }
}
