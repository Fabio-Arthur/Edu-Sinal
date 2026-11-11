// ESTADO DO JOGO
// Aqui ficam os dados do aluno (XP, moedas, vidas...) e as regras que valem
// para várias telas. Quem decide os números é o servidor (ver js/api.js): o app
// recebe o "estado" depois de cada ação e só mostra. No navegador ficam salvas
// apenas as preferências de tela (tema, tamanho do texto e animações).

const savedPrototype = JSON.parse(localStorage.getItem("edusinal-prototype") || "{}");
const requestedScreen = new URLSearchParams(location.search).get("tela");

const MAX_LIVES = 3;
const LIFE_RECHARGE_MS = 30 * 60 * 1000; // uma vida volta a cada 30 minutos
const MAX_ENERGY = 5;                          // atividades seguidas com a energia cheia
const ENERGY_RECHARGE_MS = 3 * 60 * 60 * 1000; // um ponto de energia volta a cada 3 horas
const DAILY_GOAL = 3;                     // meta do dia padrão (o aluno escolhe 1, 3 ou 5 no cadastro)
const XP_PER_EXERCISE = 20;

// ----- Datas -----

// Data no formato "2026-10-21", no fuso do navegador.
function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Quantos dias se passaram entre duas datas no formato acima.
function daysBetween(fromKey, toKey) {
  return Math.round((Date.parse(toKey) - Date.parse(fromKey)) / 86400000);
}

// A semana começa na segunda-feira; a chave é a data dessa segunda.
function weekKey(date = new Date()) {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return dateKey(monday);
}

function emptyDay() {
  return { date: dateKey(), exercises: 0, xp: 0, signsViewed: [], claimed: [] };
}

// ----- Estado -----

// Nomes que podem ir na URL (?tela=ligas) e a tela de cada um.
const screensByUrlName = {
  home: "trail",
  login: "login",
  cadastro: "signup",
  dicionario: "signs",
  ligas: "leagues",
  missoes: "missions",
  lojinha: "shop",
  perfil: "profile",
  mais: "more",
  mascote: "mascot",
  termos: "terms",
};

// Tela em que o app abre: pela URL ou a Home (se não estiver logado, o
// app.js troca para a apresentação depois de perguntar à API).
function firstScreen() {
  return screensByUrlName[requestedScreen] || "trail";
}

const state = {
  screen: firstScreen(),
  theme: savedPrototype.theme || "auto", // "auto" (segue o aparelho), "light" ou "dark"
  textSize: savedPrototype.textSize || "normal",   // "normal" ou "large"
  motion: savedPrototype.motion || "normal",       // "normal" ou "reduced"
  // Os dados do jogo começam vazios e chegam da API (applyServerState, em api.js).
  xp: 0,
  coins: 0,
  streak: 0,              // dias seguidos de ofensiva
  lastActiveDate: null,   // último dia com atividade nova
  streakFreezes: 0,       // protetores de ofensiva
  practiceDays: [],       // dias praticados (calendário), ex.: ["2026-10-23"]
  frozenDays: [],         // dias salvos pelo protetor
  league: 0,              // posição na lista LEAGUES (0 = Bronze)
  lives: MAX_LIVES,
  nextLifeAt: null,
  energy: MAX_ENERGY,
  nextEnergyAt: null,
  energyRefillDate: null,       // dia em que comprou a recarga na Lojinha
  alphabetChallengeDate: null,  // dia em que ganhou o prêmio do Desafia-me
  name: "",
  email: "",
  isRegistered: false,          // logado na API?
  dailyGoal: DAILY_GOAL,        // atividades por dia na meta da Home
  unlockedItems: [],            // itens do mascote comprados ou ganhos
  mascot: { shirt: "camiseta-branca", head: "", face: "", chest: "", background: "" },
  hasFirstActivityReward: false,
  completedLessons: [],         // ex.: "numeros:um-a-cinco"
  signsSeen: [],                // sinais já vistos no dicionário
  daily: emptyDay(),            // progresso de hoje (missões e meta)
  week: { key: weekKey(), xp: 0, claimed: [] }, // XP da semana (ligas)
  leagueRanking: null,          // ranking da semana, quando chega da API

  // Daqui para baixo nada é salvo: só vale enquanto a página está aberta.
  currentLesson: null,     // galho que o aluno está fazendo agora
  answered: false,         // já respondeu a pergunta da tela atual?
  focusTopic: null,        // etapa aberta no modo foco
  selectedBranch: null,    // celular: exercício tocado na árvore (mostra o balão)
  selectedLetter: "A",     // letra escolhida no dicionário
  selectedWord: null,      // palavra escolhida no dicionário
  dictionaryCategory: "alfabeto",
  dictionaryQuery: "",
  editingName: false,      // perfil: mostrando o campo para trocar o nome?
  mascotTab: "shirt",      // aba aberta no editor do mascote
};

const screenTitles = {
  intro: "Conheça o EduSinal",
  login: "Entrar",
  trail: "Minha trilha",
  shop: "Lojinha do EduSinal",
  signs: "Dicionário",
  lesson: "Atividade",
  leagues: "Ligas",
  missions: "Missões",
  profile: "Meu perfil",
  more: "Configurações",
  mascot: "Guarda-roupa",
  signup: "Criar conta",
  terms: "Termos de uso e privacidade",
};

// Itens do menu lateral: [tela, nome, ícone do Bootstrap Icons]
// [tela, nome, ícone, cor da área]. A cor é a mesma em todo lugar (menu do PC,
// barra de baixo do celular): as cores ficam em css/base.css (.tone-...).
const navigationItems = [
  ["trail", "Home", "house-door-fill", "blue"],
  ["signs", "Dicionário", "book-fill", "teal"],
  ["leagues", "Ligas", "trophy-fill", "yellow"],
  ["missions", "Missões", "flag-fill", "coral"],
  ["shop", "Lojinha", "bag-fill", "yellow"],
  ["profile", "Perfil", "person-fill", "blue"],
  ["more", "Configurações", "gear-fill", "gray"],
];

// O tema que vale agora: no "auto", o mesmo do aparelho (modo claro ou escuro do sistema).
const deviceDarkMode = window.matchMedia?.("(prefers-color-scheme: dark)");
function currentTheme() {
  if (state.theme !== "auto") return state.theme;
  return deviceDarkMode?.matches ? "dark" : "light";
}

// Salva no navegador só as preferências de tela. O progresso fica no servidor.
function persist() {
  localStorage.setItem("edusinal-prototype", JSON.stringify({
    theme: state.theme,
    textSize: state.textSize,
    motion: state.motion,
  }));
}

// ----- Virada do dia e da semana -----

// Chamado antes de desenhar cada tela. Se o dia ou a semana virou com o app
// aberto, zera os contadores na tela; os números certos (ofensiva, liga)
// chegam do servidor na próxima ação.
function refreshCalendar() {
  if (state.daily.date !== dateKey()) state.daily = emptyDay();
  if (state.week.key !== weekKey()) state.week = { key: weekKey(), xp: 0, claimed: [] };
}

// ----- Vidas e energia -----
// Quem gasta é o servidor. Aqui o app só conta o tempo para mostrar
// "+1 em 25 min" e encher o coração na hora certa, com as mesmas regras.
// As duas funcionam igual: gastam 1 ponto e voltam sozinhas com o tempo.
//   Vidas: errar uma pergunta gasta 1; volta 1 a cada 30 minutos.
//   Energia: terminar uma atividade gasta 1; volta 1 a cada 3 horas.
//     Ela limita quantas atividades o aluno faz seguidas (ir com calma).
// "count" e "next" são os nomes dos campos no state (ex.: "lives" e
// "nextLifeAt"); "next" guarda a hora em que o próximo ponto volta.

// Devolve os pontos que já tiveram tempo de recarregar.
function rechargeOverTime(count, next, max, interval) {
  if (state[count] >= max) {
    state[count] = max;
    state[next] = null;
    return;
  }

  const now = Date.now();
  let nextAt = Date.parse(state[next] || "");
  if (!Number.isFinite(nextAt)) {
    nextAt = now + interval;
  }

  while (state[count] < max && now >= nextAt) {
    state[count] += 1;
    nextAt += interval;
  }

  state[next] = state[count] >= max ? null : new Date(nextAt).toISOString();
}

// Texto "+1 em 25 min" ou "+1 em 2 h 10 min" (curto: "+1 em 2h10", para os quadradinhos).
function timeUntil(isoDate, short = false) {
  const minutes = Math.max(1, Math.ceil((Date.parse(isoDate) - Date.now()) / 60000));
  const hours = Math.floor(minutes / 60);
  if (hours === 0) return `+1 em ${minutes} min`;
  const rest = String(minutes % 60).padStart(2, "0");
  return short ? `+1 em ${hours}h${rest}` : `+1 em ${hours} h ${rest} min`;
}

function refreshLives() {
  rechargeOverTime("lives", "nextLifeAt", MAX_LIVES, LIFE_RECHARGE_MS);
}

function timeUntilNextLife() {
  if (state.lives >= MAX_LIVES || !state.nextLifeAt) return "Vidas completas";
  return timeUntil(state.nextLifeAt);
}

function refreshEnergy() {
  rechargeOverTime("energy", "nextEnergyAt", MAX_ENERGY, ENERGY_RECHARGE_MS);
}

function timeUntilNextEnergy(short = false) {
  if (state.energy >= MAX_ENERGY || !state.nextEnergyAt) return "Energia cheia";
  return timeUntil(state.nextEnergyAt, short);
}

// Atividade nova (dá prêmio e gasta energia) ou revisão? O Desafia-me do
// alfabeto conta como novo uma vez por dia (ver telas-dicionario.js).
function isNewActivity(topicId, branchId) {
  if (topicId === ALPHABET_TOPIC && branchId === CHALLENGE_ID) return isChallengeRewardAvailable();
  return !isLessonDone(topicId, branchId);
}

// Pode começar esta atividade agora? Devolve "" (pode), "energy" ou "lives".
// Atividade nova precisa de energia; refazer uma que já fez é revisão e é livre.
// Aprender só tem cartões (sem perguntas), então não precisa de vidas.
function activityBlockReason(topicId, branchId, kind) {
  refreshEnergy();
  refreshLives();
  if (isNewActivity(topicId, branchId) && state.energy === 0) return "energy";
  if (kind !== "learn" && state.lives === 0) return "lives";
  return "";
}

// Atualiza os quadradinhos de vidas e energia da Home sem redesenhar a tela.
function updateLifeIndicator() {
  refreshLives();
  refreshEnergy();
  const lives = document.querySelector(".tile-lives");
  if (lives) {
    lives.setAttribute("aria-label", `${state.lives} de ${MAX_LIVES} vidas, ${timeUntilNextLife()}`);
    lives.querySelector("strong").textContent = `${state.lives}/${MAX_LIVES}`;
    lives.querySelector("small").textContent = state.lives >= MAX_LIVES ? "vidas" : timeUntilNextLife();
    lives.classList.toggle("is-last-life", state.lives === 1); // recarregou uma vida: o coração para de pulsar
  }
  const energy = document.querySelector(".tile-energy");
  if (energy) {
    energy.setAttribute("aria-label", `${state.energy} de ${MAX_ENERGY} de energia, ${timeUntilNextEnergy()}`);
    energy.querySelector("strong").textContent = `${state.energy}/${MAX_ENERGY}`;
    energy.querySelector("small").textContent = state.energy >= MAX_ENERGY ? "energia" : timeUntilNextEnergy(true);
  }
}

// ----- Utilidades -----

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

// Ícone do Bootstrap Icons (https://icons.getbootstrap.com). Ex.: icon("heart-fill").
function icon(name, extraClass = "") {
  return `<i class="bi bi-${name}${extraClass ? ` ${extraClass}` : ""}" aria-hidden="true"></i>`;
}

// Aviso rápido no canto da tela (Toast do Bootstrap).
function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-text").textContent = message;
  if (window.bootstrap) bootstrap.Toast.getOrCreateInstance(toast).show();
  else toast.classList.add("show"); // se o Bootstrap não carregar, o aviso aparece mesmo assim
}

// Esconde o aviso que estiver aparecendo (ex.: ao começar uma atividade, para
// o aviso da anterior não cobrir as respostas).
function hideToast() {
  const toast = document.getElementById("toast");
  if (window.bootstrap) bootstrap.Toast.getInstance(toast)?.hide();
  else toast.classList.remove("show");
}

// Janela de confirmação (Modal do Bootstrap). onConfirm só roda se a pessoa confirmar.
function askConfirm({ title, text, confirmLabel = "Confirmar" }, onConfirm) {
  if (!window.bootstrap) {
    if (window.confirm(text)) onConfirm();
    return;
  }
  const modalElement = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-text").textContent = text;
  const confirmButton = document.getElementById("confirm-ok");
  confirmButton.textContent = confirmLabel;
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  confirmButton.onclick = () => {
    modal.hide();
    onConfirm();
  };
  modal.show();
}

// Corações cheios e vazios, usados na Home e no placar do modo foco.
function livesHeartsHtml() {
  return Array.from({ length: MAX_LIVES }, (_, index) =>
    index < state.lives ? icon("heart-fill", "life-heart is-full") : icon("heart", "life-heart"),
  ).join("");
}

// Bateria com um tracinho por ponto de energia (placar do modo foco).
function energyBatteryHtml() {
  const cells = Array.from({ length: MAX_ENERGY }, (_, index) => `<span class="energy-cell${index < state.energy ? " is-full" : ""}"></span>`).join("");
  return `<span class="energy-battery" aria-hidden="true">${cells}</span>`;
}

// Barra de progresso acessível (missões, conquistas, meta do dia).
function progressBarHtml(value, target, label) {
  const shown = Math.min(value, target);
  const percent = Math.round((shown / target) * 100);
  return `<div class="progress-track" role="progressbar" aria-label="${label}" aria-valuenow="${shown}" aria-valuemin="0" aria-valuemax="${target}"><span style="width: ${percent}%"></span></div>`;
}
