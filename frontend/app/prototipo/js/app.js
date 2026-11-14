// APLICAÇÃO PRINCIPAL
// Troca de telas, menu lateral, cliques e teclado.
// Este arquivo precisa carregar por último (depois dos outros em /js).

const app = document.querySelector(".app-shell");
const screenRoot = document.getElementById("screen-root");
const heading = document.getElementById("screen-heading");

// Cada tela e a função que desenha o HTML dela.
const screenRenderers = {
  intro: renderIntro,
  login: renderLogin,
  signup: renderSignup,
  trail: renderTrail,
  lesson: renderLesson,
  signs: renderSigns,
  leagues: renderLeagues,
  missions: renderMissions,
  shop: renderShop,
  profile: renderProfile,
  more: renderMore,
  mascot: renderMascotEditor,
  terms: renderTerms,
};

// ----- Desenho da página -----

// Celular: abas da barra de baixo. Perfil abre pelo mascote e Configurações
// pela engrenagem, os dois na barra de cima.
const MOBILE_TABS = ["trail", "signs", "leagues", "missions", "shop"];

// Telas que acendem uma aba mesmo não sendo ela (a atividade fica dentro da Home).
// O Perfil e o editor do mascote não têm aba: acendem o mascote da barra de cima.
const PARENT_TAB = { lesson: "trail" };

function renderBottomNav() {
  const activeTab = PARENT_TAB[state.screen] || state.screen;
  const ready = readyMissionsCount();
  document.getElementById("bottom-nav").innerHTML = MOBILE_TABS.map((screen) => {
    const [, label, iconName, tone] = navigationItems.find(([id]) => id === screen);
    const isActive = activeTab === screen;
    const badge = screen === "missions" && ready > 0 ? `<span class="bottom-badge" aria-label="${ready} para resgatar">${ready}</span>` : "";
    return `<button class="bottom-tab${isActive ? " is-active" : ""}" type="button" data-screen="${screen}"${isActive ? ' aria-current="page"' : ""}><span class="bottom-tab-icon tone-${tone}">${icon(iconName)}</span><span>${label}</span>${badge}</button>`;
  }).join("");
}

// Celular: ofensiva, moedas, energia e vidas na barra de cima (como no Duolingo).
function renderMobileStats() {
  refreshLives();
  refreshEnergy();
  document.getElementById("mobile-stats").innerHTML = `
    <button class="stat-chip stat-streak" type="button" data-action="open-streak" aria-label="Ofensiva: ${state.streak} dias. Abrir calendário">${icon("fire")}<strong>${state.streak}</strong></button>
    <button class="stat-chip stat-coins" type="button" data-screen="shop" aria-label="${state.coins} moedas. Abrir lojinha">${icon("coin")}<strong>${state.coins}</strong></button>
    <button class="stat-chip stat-energy" type="button" data-screen="shop" aria-label="${state.energy} de ${MAX_ENERGY} de energia">${icon("battery-charging")}<strong>${state.energy}</strong></button>
    <button class="stat-chip stat-lives${state.lives === 1 ? " is-last-life" : ""}" type="button" data-screen="shop" aria-label="${state.lives} de ${MAX_LIVES} vidas">${icon("heart-fill")}<strong>${state.lives}</strong></button>`;
}

// Celular: o mascote do aluno no canto de cima leva ao Perfil.
function renderMobileAvatar() {
  const avatar = document.getElementById("mobile-avatar");
  const isActive = state.screen === "profile" || state.screen === "mascot";
  avatar.className = `mobile-avatar ${backdropClass()}${isActive ? " is-active" : ""}`;
  avatar.toggleAttribute("aria-current", isActive);
  avatar.innerHTML = mascotSvg(state.mascot, "avatar", "");
}

// Menu lateral do computador. O Perfil mostra o rosto do mascote do aluno e as
// Missões mostram quantas estão prontas para resgatar.
function renderNavigation() {
  const activeScreen = state.screen === "mascot" ? "profile" : state.screen; // o editor do mascote fica no Perfil
  const ready = readyMissionsCount();
  const items = navigationItems.map(([screen, label, iconName, tone]) => {
    const isActive = activeScreen === screen;
    const symbol = screen === "profile"
      ? `<span class="nav-icon is-avatar ${backdropClass()}">${mascotSvg(state.mascot, "avatar", "")}</span>`
      : `<span class="nav-icon tone-${tone}">${icon(iconName)}</span>`;
    const badge = screen === "missions" && ready > 0 ? `<span class="nav-badge" aria-label="${ready} para resgatar">${ready}</span>` : "";
    return `
    <button class="nav-item${isActive ? " is-active" : ""}" type="button" data-screen="${screen}"${isActive ? ' aria-current="page"' : ""}>
      ${symbol}<span>${label}</span>${badge}
    </button>`;
  }).join("");
  document.getElementById("side-nav").innerHTML = items;
}

// Última tela desenhada. Se for a mesma, as animações de entrada não se repetem.
let lastDrawnView = "";

// Altura das barras do celular, medida de verdade: a de cima e o espaço que a
// página reserva embaixo para a barra de baixo. A Home usa esse valor para
// caber exatamente na tela (ver css/home.css). No computador a de cima some.
function updateBarsHeight() {
  const top = document.querySelector(".mobile-topbar").getBoundingClientRect().height;
  const bottom = parseFloat(getComputedStyle(document.querySelector(".workspace")).paddingBottom) || 0;
  app.style.setProperty("--bars-height", `${top + bottom}px`);
}
window.addEventListener("resize", updateBarsHeight);

// Desenha de novo a tela atual com os dados do momento.
function render() {
  refreshCalendar();
  const view = `${state.screen}|${state.focusTopic}`;
  app.dataset.redraw = view === lastDrawnView ? "on" : "off";
  lastDrawnView = view;
  heading.textContent = screenTitles[state.screen] || "EduSinal";
  app.dataset.currentScreen = state.screen;
  app.dataset.focus = state.focusTopic ? "on" : "off";
  renderNavigation();
  renderBottomNav();
  renderMobileStats();
  renderMobileAvatar();
  const settings = document.getElementById("settings-button");
  settings.classList.toggle("is-active", state.screen === "more");
  settings.toggleAttribute("aria-current", state.screen === "more");
  screenRoot.innerHTML = screenRenderers[state.screen]();
  updateBarsHeight();
  if (state.focusTopic) measureTreeLines(); // para o caminho da árvore "se desenhar"
  else if (state.screen === "trail") setupTrailScroll(); // trilha da Home no lugar certo
  if (["leagues", "trail"].includes(state.screen)) refreshLeagueRanking(); // ranking de verdade, da API
  if (state.screen === "leagues") scrollRankingToMe(); // o aluno se vê no ranking sem rolar
  const theme = currentTheme(); // "auto" vira o tema do aparelho
  app.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;          // janelas do Bootstrap ficam fora do app
  document.documentElement.setAttribute("data-bs-theme", theme); // tema dos componentes do Bootstrap
  // Barra de status do celular com a cor do tema escolhido no app (e não a do sistema)
  const background = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", background));
  app.dataset.textSize = state.textSize;
  app.dataset.motion = state.motion;
}

// Vai para outra tela. Sem energia, as atividades novas ficam bloqueadas; sem
// vidas, os exercícios (ver activityBlockReason em estado.js).
function setScreen(screen) {
  if (screen === "lesson" && !state.currentLesson) screen = "trail"; // atividade só começa pela árvore
  if (screen === "lesson") {
    const lesson = state.currentLesson;
    const reason = activityBlockReason(lesson.topicId, lesson.branchId, lesson.kind);
    if (reason === "energy") {
      showToast(`Sua energia acabou (${timeUntilNextEnergy()}). Você ainda pode refazer atividades e revisar no dicionário.`);
      return;
    }
    if (reason === "lives") {
      showToast("Suas vidas estão recarregando. Você ainda pode revisar sinais e conteúdos.");
      return;
    }
  }
  if (screen === "signup" || screen === "login") hideToast(); // o aviso cobriria o botão "Continuar"
  if (screen === "signup" && state.screen !== "signup") resetSignup(); // cadastro novo começa da 1ª etapa
  if (screen === "login" && state.screen !== "login") resetLogin();
  state.screen = screen;
  state.answered = false;
  state.focusTopic = null;
  state.selectedBranch = null;
  state.editingName = false;
  if (screen !== "lesson") state.currentLesson = null;
  heading.textContent = screenTitles[screen] || "EduSinal";
  render();
  screenRoot.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ----- Modo foco (árvore de lições) -----

// Abre a árvore de uma etapa, de qualquer tela (Home, missões...).
// Animação entre a Home e a árvore (View Transitions do navegador): o destaque
// de boas-vindas vira a faixa da etapa e a bolinha da etapa vai para o centro,
// virando a prova final. "pairs" liga o elemento de antes ao de depois pelo nome.
// Sem suporte no navegador (ou com animações reduzidas), só troca a tela.
function withTopicTransition(topicId, update) {
  const reduceMotion = state.motion === "reduced" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduceMotion) {
    update();
    return;
  }
  const pairs = [
    [".home-hero", "topic-banner"],
    [".topic-heading", "topic-banner"],
    [`.trail-node[data-topic="${topicId}"]`, "topic-node"],
    [".tree-final-node", "topic-node"],
  ];
  const setNames = (value) => pairs.forEach(([selector, name]) => {
    const element = screenRoot.querySelector(selector);
    if (element) element.style.viewTransitionName = value ? name : "";
  });
  setNames(true); // tela de antes
  // durante a transição o menu lateral some de uma vez (a animação própria dele
  // atrapalharia a "foto" da tela de depois)
  document.documentElement.classList.add("is-transitioning");
  const transition = document.startViewTransition(() => {
    update();
    setNames(true); // tela de depois
  });
  transition.finished.finally(() => {
    setNames(false);
    document.documentElement.classList.remove("is-transitioning");
  });
}

function openTopic(topicId) {
  if (!isTopicUnlocked(topicId)) {
    showToast("Conclua a etapa anterior para liberar esta.");
    return;
  }
  withTopicTransition(topicId, () => {
    setScreen("trail");
    state.focusTopic = topicId;
    render();
    document.getElementById("topic-back").focus({ preventScroll: true });
  });
}

function closeTopic() {
  const topicId = state.focusTopic;
  withTopicTransition(topicId, () => {
    state.focusTopic = null;
    state.selectedBranch = null;
    render();
    screenRoot.querySelector(`[data-topic="${topicId}"]`)?.focus({ preventScroll: true });
  });
}

// (a atividade fica em licao.js; as ações de cada aba, no arquivo da aba)

// ----- Eventos -----

document.addEventListener("click", (event) => {
  const letterButton = event.target.closest("[data-alphabet-letter]");
  if (letterButton && !letterButton.disabled) {
    selectLetter(letterButton.dataset.alphabetLetter);
    return;
  }

  const screenButton = event.target.closest("[data-screen]");
  if (screenButton) {
    event.preventDefault();
    setScreen(screenButton.dataset.screen);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  const data = actionButton.dataset;

  // Trilha e atividade
  if (action === "open-topic") openTopic(data.topic);
  else if (action === "close-topic") closeTopic();
  else if (action === "trail-scroll") scrollTrail(Number(data.direction));
  else if (action === "tap-branch") tapBranch(data.topic, data.branch);
  else if (action === "start-branch") startBranch(data.topic, data.branch);
  else if (action === "select-answer") selectAnswer(actionButton);
  else if (action === "check-answer") checkAnswer();
  else if (action === "next-question") nextQuestion();
  else if (action === "finish-lesson") finishLesson();
  else if (action === "leave-lesson") leaveLesson();
  // Dicionário
  else if (action === "dictionary-category") chooseDictionaryCategory(data.category);
  else if (action === "select-word") selectWord(data.word);
  else if (action === "start-challenge") startAlphabetChallenge();
  else if (action === "toggle-challenge-sheet") toggleChallengeSheet();
  else if (action === "mascot-react") playMascotReaction();
  // Missões e lojinha
  else if (action === "claim-mission") claimMission(data.scope, data.mission);
  else if (action === "buy-power") buyPowerUp(data.power);
  // Mascote
  else if (action === "mascot-item") chooseMascotItem(data.slot, data.item);
  else if (action === "mascot-tab") chooseMascotTab(data.slot);
  else if (action === "mascot-reset") resetMascotLook();
  // Perfil e Configurações
  else if (action === "edit-name") setEditingName(true);
  else if (action === "cancel-name") setEditingName(false);
  else if (action === "set-theme") setTheme(data.value);
  else if (action === "set-text-size") setTextSize(data.value);
  else if (action === "set-motion") setMotion(data.value);
  else if (action === "set-goal") setDailyGoal(data.value);
  // Cadastro por etapas
  else if (action === "signup-back") signupBack();
  else if (action === "signup-goal") chooseSignupGoal(data.value);
  else if (action === "signup-start") setScreen("trail");
  else if (action === "login-back") loginBack();
  else if (action === "login-start") setScreen("trail");
  else if (action === "delete-account") deleteAccount();
  else if (action === "open-terms") openTerms();
  else if (action === "toggle-password") togglePassword(actionButton);
  else if (action === "close-terms") closeTerms();
  else if (action === "logout") logout();
  else if (action === "guest-start") startAsGuest();
  // Calendário da ofensiva
  else if (action === "open-streak") openStreakCalendar();
  else if (action === "calendar-month") changeCalendarMonth(Number(data.step));
});

// Busca do dicionário: atualiza a lista a cada letra digitada.
document.addEventListener("input", (event) => {
  if (event.target.id === "dictionary-search") searchDictionary(event.target.value);
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "login-form") {
    event.preventDefault();
    handleLoginSubmit(event.target);
  } else if (event.target.id === "signup-form") {
    event.preventDefault();
    handleSignupSubmit(event.target);
  } else if (event.target.id === "profile-name-form") {
    event.preventDefault();
    saveName(event.target);
  }
});

// Esc fecha o modo foco.
document.addEventListener("keydown", (event) => {
  if (handleLessonKey(event)) return; // atividade: 1 a 4 e Enter (em licao.js)
  if (event.key !== "Escape") return;
  if (state.focusTopic) closeTopic();
});

// O aparelho trocou de modo claro para escuro (ou o contrário): no tema
// "Automático", o app troca junto, na hora.
deviceDarkMode?.addEventListener("change", () => {
  if (state.theme === "auto") render();
});

// Mantém vidas e energia (e o tempo de recarga) atualizadas na Home e na barra do celular.
window.setInterval(() => {
  if (state.screen === "trail") updateLifeIndicator();
  renderMobileStats();
}, 15000);

// ----- Recadinho no Console -----
// Easter egg: só quem abre o F12 vê o Claudinho em pixel art (O = laranja, D = laranja escuro, E = olho).
const CLAUDINHO_PIXELS = [
  "..OOOOOOOOOO..",
  "..OOEOOOOEOO..",
  "OOOOEOOOOEOOOO",
  "OOOOOOOOOOOOOO",
  "..OOOOOOOOOO..",
  "..DDDDDDDDDD..",
  "...O.O..O.O...",
  "...O.O..O.O...",
];
const CLAUDINHO_COLORS = { O: "#d97757", D: "#b85c3e", E: "#1e1f29", ".": "transparent" };

function greetDevelopers() {
  const rows = CLAUDINHO_PIXELS.map((row) => "%c  ".repeat(row.length)).join("%c\n");
  const styles = CLAUDINHO_PIXELS.flatMap((row, index) => {
    const pixels = [...row].map((pixel) => `background: ${CLAUDINHO_COLORS[pixel]}; font-size: 8px;`);
    return index < CLAUDINHO_PIXELS.length - 1 ? [...pixels, ""] : pixels;
  });
  console.log(rows, ...styles);
  console.log(
    "%cOi, curioso! 👋%c\nSe você abriu o F12, já tem alma de dev.\nO EduSinal foi feito pela equipe do TCC, com uma ajudinha do Claude 🧡\nDica: pergunte sempre o porquê. É assim que se aprende.",
    "color: #d97757; font-size: 16px; font-weight: 800;",
    "font-size: 13px;"
  );
}

// ----- Início -----
// O HTML nasce vazio; desenhamos a primeira tela aqui. Antes, perguntamos à
// API se a pessoa ainda está logada (o cookie da sessão vale 7 dias).
async function startApp() {
  const publicScreens = ["intro", "login", "signup", "terms"];
  if (publicScreens.includes(state.screen)) {
    render(); // a tela pública aparece na hora...
    // ...mas, se a pessoa já está logada (ex.: recarregou a página com
    // ?tela=cadastro no endereço depois de criar a conta), vai para a Home.
    const loginScreens = ["intro", "login", "signup"];
    if (loginScreens.includes(state.screen) && await hasSession() && loginScreens.includes(state.screen)) {
      setScreen("trail");
    }
    return;
  }
  const loggedIn = await loadSession();
  if (!loggedIn) state.screen = "intro";
  render();
}

startApp();
greetDevelopers();
