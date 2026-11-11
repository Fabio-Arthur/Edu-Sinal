// TELAS DA TRILHA
// Apresentação, Home (trilha) e modo foco (árvore de lições).
// O conteúdo das etapas fica em conteudo.js e a atividade em licao.js.
// Cada função "render..." devolve o HTML de uma tela.

function renderIntro() {
  const points = [
    ["signpost-split-fill", "blue", "Aprenda no seu ritmo", "Uma trilha visual, com etapas curtas para aprender e praticar."],
    ["trophy-fill", "yellow", "Pratique todo dia", "Missões, ofensiva e ligas para manter o ritmo, sem pressa."],
    ["shield-fill-check", "teal", "Seguro para todas as idades", "Sem chat entre alunos e sem compras com dinheiro real."],
  ];
  return `
    <section class="welcome" aria-labelledby="intro-title">
      <div class="welcome-stage">
        <span class="welcome-bubble">Oi! Vamos aprender Libras?</span>
        <button class="welcome-mascot mascot-backdrop" type="button" data-action="mascot-react" aria-label="Mascote do EduSinal">${mascotSvg(DEFAULT_LOOK, "full", "", { animated: true })}</button>
      </div>
      <div class="welcome-copy">
        <p class="welcome-brand">Edu<span>Sinal</span></p>
        <h2 id="intro-title">Aprender Libras é abrir espaço para novas conexões.</h2>
        <p>Uma trilha de aprendizagem, exercícios para praticar e um dicionário para consultar quando quiser.</p>
        <div class="welcome-actions">
          <button class="button-3d button-3d-primary" type="button" data-screen="signup">Começar agora</button>
          <button class="button-3d button-3d-outline" type="button" data-screen="login">Já tenho conta</button>
        </div>
        <a class="welcome-link" href="../../landing/index.html?v=2">${icon("info-circle-fill")} Conhecer o projeto</a>
      </div>
    </section>
    <section class="welcome-points" aria-label="Sobre o EduSinal">
      ${points.map(([iconName, color, title, text]) => `<div class="welcome-point"><span class="welcome-point-icon tone-${color}">${icon(iconName)}</span><div><strong>${title}</strong><span>${text}</span></div></div>`).join("")}
    </section>`;
}

// ----- Árvore de exercícios (modo foco) -----
// Os exercícios seguem uma ordem: o 2 só abre depois do 1, e assim por diante.
// Computador: espiral de fora para dentro, com a prova final no centro.
// Celular: caminho ondulado de cima para baixo, só com os ícones; tocar num
// ícone abre um balão com o título e o botão para começar.

// Posições na espiral (computador), em % da área: 5 exercícios + a prova final.
// Os exercícios ficam num oval em volta da prova, todos à mesma distância um
// do outro. "label" diz de que lado fica o texto: sempre para fora do oval,
// para a linha do caminho não passar por cima dele.
const SPIRAL_POINTS = [
  { x: 21.3, y: 71, label: "bottom" },
  { x: 26.8, y: 31.6, label: "top" },
  { x: 50, y: 24, label: "top" },
  { x: 73.2, y: 31.6, label: "top" },
  { x: 78.7, y: 71, label: "bottom" },
  { x: 50, y: 50 }, // prova final (centro exato)
];

// Posições no caminho ondulado (celular), em % da área. A altura da área
// acompanha a tela, para a árvore inteira caber sem rolar.
const WAVE_POINTS = [
  { x: 50, y: 9 },
  { x: 74, y: 24 },
  { x: 50, y: 39 },
  { x: 26, y: 54 },
  { x: 50, y: 69 },
  { x: 50, y: 84 }, // prova final
];

// No celular, o primeiro toque mostra o balão; no computador, já começa.
function isMobileLayout() {
  return Boolean(window.matchMedia && window.matchMedia("(max-width: 1000px)").matches);
}

// Um exercício abre quando o anterior estiver concluído (o primeiro já vem aberto).
function isBranchUnlocked(topicId, index) {
  const branches = learningTopics[topicId].branches;
  return index === 0 || isLessonDone(topicId, branches[index - 1].id);
}

// Curva suave passando por todos os pontos (para desenhar o caminho).
function smoothSegment(points, index) {
  const p0 = points[index - 1] || points[index];
  const p1 = points[index];
  const p2 = points[index + 1];
  const p3 = points[index + 2] || p2;
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  const n = (value) => value.toFixed(1);
  return `M${n(p1.x)} ${n(p1.y)} C${n(c1.x)} ${n(c1.y)}, ${n(c2.x)} ${n(c2.y)}, ${n(p2.x)} ${n(p2.y)}`;
}

// O caminho é desenhado em pedaços: o pedaço depois de um exercício feito fica colorido.
// Cada pedaço tem uma "máscara" (a mesma curva, branca e grossa) que se risca na
// entrada da árvore, revelando a linha aos poucos, um pedaço depois do outro.
function renderPath(topicId, points, viewBox, className) {
  const branches = learningTopics[topicId].branches;
  const segments = points.slice(0, -1).map((_, index) => {
    const isDone = isLessonDone(topicId, branches[index].id);
    const curve = smoothSegment(points, index);
    const maskId = `${className}-${index}`;
    return `<mask id="${maskId}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="120" height="120"><path class="tree-line-mask" d="${curve}" style="--i:${index}" /></mask>
      <path class="${isDone ? "is-done" : ""}" d="${curve}" mask="url(#${maskId})" />`;
  });
  return `<svg class="tree-lines ${className}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true">${segments.join("")}</svg>`;
}

// A máscara precisa saber o comprimento de cada pedaço na tela, em pixels
// (a linha estica junto com a área da árvore). Mede somando pontos da curva.
function measureTreeLines() {
  screenRoot.querySelectorAll(".tree-line-mask").forEach((path) => {
    const matrix = path.getScreenCTM?.();
    if (!matrix || !path.getTotalLength) return; // caminho escondido (o outro layout)
    const total = path.getTotalLength();
    let length = 0;
    let previous = path.getPointAtLength(0).matrixTransform(matrix);
    for (let step = 1; step <= 24; step += 1) {
      const point = path.getPointAtLength((total * step) / 24).matrixTransform(matrix);
      length += Math.hypot(point.x - previous.x, point.y - previous.y);
      previous = point;
    }
    path.style.setProperty("--len", `${Math.ceil(length) + 4}px`);
  });
}

// Situação de um exercício: feito, aberto ou trancado.
function branchStatus(topicId, branch, index) {
  if (isLessonDone(topicId, branch.id)) return "done";
  return isBranchUnlocked(topicId, index) ? "open" : "locked";
}

function renderBranch(topicId, branch, index) {
  const status = branchStatus(topicId, branch, index);
  const spiral = SPIRAL_POINTS[index];
  const wave = WAVE_POINTS[index];
  const symbol = status === "done" ? icon("check-lg") : icon(branch.icon);
  let hint = `${branch.hint} · +${XP_PER_EXERCISE} XP`;
  if (status === "done") hint = "Concluído · refazer";
  if (status === "locked") hint = "Conclua o exercício anterior";
  const isSelected = state.selectedBranch === branch.id;
  return `<button class="tree-leaf is-${status} label-${spiral.label}${isSelected ? " is-selected" : ""}" type="button" style="--x:${spiral.x}%;--y:${spiral.y}%;--mx:${wave.x}%;--my:${wave.y}%;--i:${index}" data-action="tap-branch" data-topic="${topicId}" data-branch="${branch.id}" aria-label="${index + 1}. ${branch.label}: ${hint}" aria-expanded="${isSelected}"><span class="tree-icon">${symbol}<span class="tree-order" aria-hidden="true">${status === "locked" ? icon("lock-fill") : index + 1}</span></span><strong>${branch.label}</strong><small>${hint}</small></button>`;
}

// Centro (computador) ou fim do caminho (celular): a prova final.
// Trancada ou concluída, tocar nela só leva de volta à trilha.
function finalNodeInfo(topicId) {
  const topic = learningTopics[topicId];
  const done = doneBranchCount(topicId);
  const total = topic.branches.length;
  if (isLessonDone(topicId, "final")) return { status: "done", symbol: icon("trophy-fill"), hint: "Etapa concluída · toque para voltar" };
  if (isFinalUnlocked(topicId)) return { status: "open", symbol: icon("trophy-fill"), hint: `Liberada! Pode errar no máximo ${FINAL_MAX_MISTAKES}` };
  return { status: "locked", symbol: icon("lock-fill"), hint: `Conclua os exercícios (${done} / ${total})` };
}

function renderFinalNode(topicId) {
  const topic = learningTopics[topicId];
  const info = finalNodeInfo(topicId);
  const spiral = SPIRAL_POINTS[SPIRAL_POINTS.length - 1];
  const wave = WAVE_POINTS[WAVE_POINTS.length - 1];
  const isSelected = state.selectedBranch === "final";
  const doneBadge = info.status === "done" ? `<span class="tree-final-check" aria-hidden="true">${icon("check-lg")}</span>` : "";
  return `<button class="tree-center is-${info.status}${isSelected ? " is-selected" : ""}" type="button" style="--x:${spiral.x}%;--y:${spiral.y}%;--mx:${wave.x}%;--my:${wave.y}%" data-action="tap-branch" data-topic="${topicId}" data-branch="final" aria-label="Prova final: ${info.hint}" aria-expanded="${isSelected}"><span class="tree-final-node">${info.symbol}${doneBadge}</span><h2 id="topic-title">Prova final</h2><p>${topic.title}</p><small>${info.hint}</small></button>`;
}

// Balão do celular: aparece embaixo do ícone tocado, com título e botão.
function renderBranchBubble(topicId) {
  const selected = state.selectedBranch;
  if (!selected) return "";
  const topic = learningTopics[topicId];
  let title;
  let text;
  let point;
  let action = "";

  if (selected === "final") {
    const info = finalNodeInfo(topicId);
    title = "Prova final";
    text = info.status === "locked" ? `Conclua os 5 exercícios para liberar (${doneBranchCount(topicId)} / 5).` : info.hint;
    point = WAVE_POINTS[WAVE_POINTS.length - 1];
    if (info.status === "open") action = `<button class="button-3d button-3d-primary" type="button" data-action="start-branch" data-topic="${topicId}" data-branch="final" ${activityBlockReason(topicId, "final", "practice") ? "disabled" : ""}>Começar a prova ${icon("arrow-right")}</button>`;
    else action = `<button class="button-3d button-3d-outline" type="button" data-action="close-topic">Voltar à trilha</button>`;
  } else {
    const index = topic.branches.findIndex((branch) => branch.id === selected);
    const branch = topic.branches[index];
    const status = branchStatus(topicId, branch, index);
    title = `${index + 1}. ${branch.label}`;
    text = status === "locked" ? "Conclua o exercício anterior para liberar este." : `${branch.hint} · ${status === "done" ? "já concluído (revisão, sem XP)" : `+${XP_PER_EXERCISE} XP`}`;
    point = WAVE_POINTS[index];
    if (status !== "locked") action = `<button class="button-3d button-3d-primary" type="button" data-action="start-branch" data-topic="${topicId}" data-branch="${branch.id}" ${activityBlockReason(topicId, branch.id, branch.kind) ? "disabled" : ""}>${status === "done" ? "Refazer" : "Começar"} ${icon("arrow-right")}</button>`;
  }
  return `<div class="tree-bubble${selected === "final" ? " is-above" : ""}" role="dialog" aria-label="${title}" style="--mx:${point.x}%;--my:${point.y}%"><strong>${title}</strong><p>${text}</p>${action}</div>`;
}

// Toque num exercício (ou na prova): no celular mostra o balão; no computador começa direto.
function tapBranch(topicId, branchId) {
  if (isMobileLayout()) {
    state.selectedBranch = state.selectedBranch === branchId ? null : branchId; // tocar de novo fecha
    render();
    return;
  }
  if (branchId === "final") {
    if (finalNodeInfo(topicId).status === "open") startBranch(topicId, "final");
    else closeTopic();
    return;
  }
  const index = learningTopics[topicId].branches.findIndex((branch) => branch.id === branchId);
  if (!isBranchUnlocked(topicId, index)) {
    showToast("Conclua o exercício anterior para liberar este.");
    return;
  }
  startBranch(topicId, branchId);
}

// Aviso em cima da árvore quando falta energia ou vidas.
function renderTreeWarning() {
  const shop = `<button class="text-button" type="button" data-screen="shop">lojinha</button>`;
  if (state.energy === 0) return `<p class="tree-warning is-energy" role="status">${icon("battery")} Sem energia (${timeUntilNextEnergy()}). Refaça o que já fez ou recarregue na ${shop}.</p>`;
  if (state.lives === 0) return `<p class="tree-warning" role="status">${icon("heart-fill")} Sem vidas (${timeUntilNextLife()}). Revise no <button class="text-button" type="button" data-screen="signs">dicionário</button> ou recarregue na ${shop}.</p>`;
  return "";
}

function renderTopicTree() {
  trailCenterTopic = state.focusTopic; // ao voltar para a Home, a trilha mostra esta etapa
  refreshLives();
  refreshEnergy();
  const hearts = livesHeartsHtml();
  const topicId = state.focusTopic;
  const topic = learningTopics[topicId];
  const done = doneBranchCount(topicId);
  const total = topic.branches.length;
  return `
    <section class="topic-tree" aria-labelledby="topic-title">
      <div class="topic-heading">
        <button class="back-button" type="button" data-action="close-topic" id="topic-back" aria-label="Voltar para a Home" title="Voltar para a Home">${icon("arrow-left")}</button>
        <div class="topic-title"><small>ETAPA ${topic.number}</small><h2>${topic.title}</h2></div>
        <div class="topic-status">
          <div class="topic-progress"><div class="hero-progress-track" role="progressbar" aria-label="Exercícios feitos" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${total}"><span style="width: ${Math.round((done / total) * 100)}%"></span></div><strong>${done}/${total}</strong></div>
          <div class="topic-lives" aria-label="${state.lives} de ${MAX_LIVES} vidas, ${timeUntilNextLife()}"><span class="lives-hearts" aria-hidden="true">${hearts}</span><small>${timeUntilNextLife()}</small></div>
          <div class="topic-energy" aria-label="${state.energy} de ${MAX_ENERGY} de energia, ${timeUntilNextEnergy()}">${energyBatteryHtml()}<small>${timeUntilNextEnergy()}</small></div>
        </div>
      </div>
      ${renderTreeWarning()}
      <div class="tree-canvas">
        ${renderPath(topicId, SPIRAL_POINTS, "0 0 100 100", "tree-lines-spiral")}
        ${renderPath(topicId, WAVE_POINTS, "0 0 100 100", "tree-lines-wave")}
        ${topic.branches.map((branch, index) => renderBranch(topicId, branch, index)).join("")}
        ${renderFinalNode(topicId)}
        ${renderBranchBubble(topicId)}
      </div>
    </section>`;
}

// Destaque do topo da Home: onde o aluno está e o botão para continuar.
function renderHomeHero() {
  const topicId = currentTopicId();
  const topic = learningTopics[topicId];
  const done = doneBranchCount(topicId);
  const total = topic.branches.length;

  let summary = `${done} de ${total} exercícios`;
  let buttonLabel = done === 0 ? "Começar" : "Continuar";
  let bubble = done === 0 ? "Bora começar?" : "Bora praticar?";
  if (isLessonDone(topicId, "final")) {
    summary = "Etapa concluída!";
    buttonLabel = "Rever a etapa";
    bubble = "Mandou bem!";
  } else if (done === total) {
    summary = "Prova final liberada!";
    buttonLabel = "Fazer a prova";
    bubble = "Você consegue!";
  }
  const percent = isLessonDone(topicId, "final") ? 100 : Math.round((done / total) * 100);
  return `
    <section class="home-hero" aria-labelledby="home-hero-title">
      <div class="home-hero-copy">
        <p class="hero-kicker">ETAPA ${topic.number} · VOCÊ ESTÁ AQUI</p>
        <h2 id="home-hero-title">Oi, ${escapeHtml(state.name)}!</h2>
        <p class="hero-topic">${topic.title}</p>
        <div class="hero-progress">
          <div class="hero-progress-track" role="progressbar" aria-label="Progresso da etapa" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width: ${percent}%"></span></div>
          <small>${summary}</small>
        </div>
        <button class="button-3d button-3d-light" type="button" data-action="open-topic" data-topic="${topicId}">${buttonLabel} ${icon("arrow-right")}</button>
      </div>
      <button class="home-hero-art" type="button" data-screen="mascot" aria-label="Personalizar seu mascote">
        <span class="hero-bubble" aria-hidden="true">${bubble}</span>
        <span class="hero-mascot ${backdropClass()}">${mascotSvg(state.mascot, "full", "", { animated: true })}</span>
      </button>
    </section>`;
}

// Trilha da Home dividida em unidades, cada uma com 4 etapas (ids de learningTopics).
const TRAIL_UNITS = [
  { number: "01", title: "Primeiros passos", topics: ["alfabeto-manual", "numeros", "apresentacoes", "cumprimentos"] },
  { number: "02", title: "Sinais do dia a dia", topics: ["em-casa", "na-escola", "no-trabalho", "na-rua"] },
];

// Situação de uma etapa: "done", "current" ou "locked".
function trailStepStatus(topicId) {
  if (!isTopicUnlocked(topicId)) return "locked";
  if (isLessonDone(topicId, "final")) return "done";
  return "current";
}

// Uma etapa da trilha: bolinha grande (como no Duolingo) e o texto ao lado.
// No computador, cada etapa sobe ou desce um pouco (--wave), formando a onda;
// no celular, a bolinha vai um pouco para um lado ou para o outro (--mwave).
function renderTrailStep(topicId) {
  const topic = learningTopics[topicId];
  const status = trailStepStatus(topicId);
  let symbol = topic.number;
  let label = "";
  let ring = "";
  let tooltip = "";
  if (status === "locked") {
    const previous = learningTopics[TOPIC_ORDER[TOPIC_ORDER.indexOf(topicId) - 1]];
    symbol = icon("lock-fill");
    label = `CONCLUA A ETAPA ${previous.number}`;
  } else if (status === "done") {
    symbol = icon("check-lg");
    label = "CONCLUÍDA";
  } else {
    const done = doneBranchCount(topicId);
    const total = topic.branches.length;
    label = done === 0 ? "COMECE POR AQUI" : `EM ANDAMENTO · ${done}/${total}`;
    ring = ` style="--ring:${Math.round((done / total) * 360)}deg"`; // anel de progresso em volta
    tooltip = `<span class="trail-tooltip" aria-hidden="true">${done === 0 ? "COMEÇAR" : "CONTINUAR"}</span>`;
  }

  const node = status === "locked"
    ? `<span class="trail-node" aria-label="Etapa ${topic.number}, ${label.toLowerCase()}"><span>${symbol}</span></span>`
    : `<button class="trail-node" type="button" data-action="open-topic" data-topic="${topicId}" aria-label="Abrir ${topic.title}"${ring}><span>${symbol}</span></button>`;
  const position = TOPIC_ORDER.indexOf(topicId);
  return `<li class="trail-step is-${status}" style="--wave:${trailWaveOffset(position)}px;--mwave:${trailMobileOffset(position)}px">${tooltip}${node}<div class="trail-step-copy"><small>${label}</small><h3>${topic.title}</h3><p>${topic.subtitle}</p></div></li>`;
}

// Uma unidade: a faixa azul com o nome e as etapas dela.
function renderTrailUnit(unit) {
  const done = unit.topics.filter((topicId) => isLessonDone(topicId, "final")).length;
  return `
    <div class="trail-unit">
      <div class="home-map-banner">
        <div><small>UNIDADE ${unit.number}</small><h2 id="unit-${unit.number}-title">${unit.title}</h2></div>
        <span>${done}/${unit.topics.length} etapas</span>
      </div>
      <ol class="trail-route" style="--m-step:${TRAIL_MOBILE_STEP}px;--lane:${TRAIL_MOBILE_LANE}px" aria-labelledby="unit-${unit.number}-title">
        ${renderTrailMobileWave(unit)}${unit.topics.map(renderTrailStep).join("")}
      </ol>
    </div>`;
}

// ----- Trilha do celular: caminho de cima para baixo, ondulado -----
// Fica dentro de um quadro que rola sozinho (o resto da Home não se mexe).
// As bolinhas andam de um lado para o outro numa faixa à esquerda, levando o
// texto junto, sempre ao lado delas.
const TRAIL_MOBILE_STEP = 112; // distância entre uma etapa e a próxima
const TRAIL_MOBILE_LANE = 120; // largura da faixa das bolinhas
const TRAIL_MOBILE_WAVE = 22;  // quanto a bolinha vai para cada lado
const TRAIL_MOBILE_NODE = 66;  // tamanho da bolinha no celular

function trailMobileOffset(position) {
  return Math.round(Math.sin((position * Math.PI) / 2) * TRAIL_MOBILE_WAVE);
}

// Linha ondulada de uma unidade (no computador ela some: lá a onda é outra).
function renderTrailMobileWave(unit) {
  const points = unit.topics.map((topicId, index) => ({
    x: TRAIL_MOBILE_LANE / 2 + trailMobileOffset(TOPIC_ORDER.indexOf(topicId)),
    y: index * TRAIL_MOBILE_STEP + TRAIL_MOBILE_NODE / 2,
  }));
  const segments = points.slice(0, -1).map((_, index) =>
    `<path class="${isLessonDone(unit.topics[index], "final") ? "is-done" : ""}" d="${smoothSegment(points, index)}" />`);
  const height = points[points.length - 1].y + TRAIL_MOBILE_NODE / 2;
  return `<svg class="trail-wave-mobile" width="${TRAIL_MOBILE_LANE}" height="${height}" viewBox="0 0 ${TRAIL_MOBILE_LANE} ${height}" aria-hidden="true">${segments.join("")}</svg>`;
}

// ----- Trilha do computador: uma linha só, que rola para o lado -----
// As medidas ficam aqui e vão para o CSS como variáveis (style da .trail-track).
// A largura de cada etapa se ajusta à tela: cabe uma unidade inteira (4 etapas)
// de cada vez, com uma margem dos dois lados. Entre uma unidade e outra fica
// um vão de duas margens, e cada seta anda uma "página" (uma unidade).
const TRAIL_MIN_STEP = 130;   // largura mínima de cada etapa
const TRAIL_EDGE = 40;        // margem antes da primeira e depois da última etapa
const TRAIL_WAVE = 24;        // quanto a bolinha sobe ou desce na onda
const TRAIL_ROUTE_TOP = 76;   // espaço acima das bolinhas (para o balão "COMEÇAR")
const TRAIL_NODE = 72;        // tamanho da bolinha
let trailStepWidth = 160;     // largura atual (calculada em layoutTrail)

// Onda: 0, desce, 0, sobe, 0, desce... (um seno, de etapa em etapa)
function trailWaveOffset(position) {
  return Math.round(Math.sin((position * Math.PI) / 2) * TRAIL_WAVE);
}

// Linha ondulada passando pelo centro das bolinhas. O pedaço depois de uma
// etapa concluída fica turquesa. (No celular ela some: lá a linha é reta.)
function renderTrailWave() {
  const points = [];
  TRAIL_UNITS.forEach((unit, unitIndex) => unit.topics.forEach(() => {
    const position = points.length;
    points.push({
      x: position * trailStepWidth + trailStepWidth / 2 + unitIndex * TRAIL_EDGE * 2, // + o vão entre unidades
      y: TRAIL_ROUTE_TOP + TRAIL_NODE / 2 + trailWaveOffset(position),
    });
  }));
  const segments = points.slice(0, -1).map((_, index) =>
    `<path class="${isLessonDone(TOPIC_ORDER[index], "final") ? "is-done" : ""}" d="${smoothSegment(points, index)}" />`);
  const width = points[points.length - 1].x + trailStepWidth / 2;
  const height = TRAIL_ROUTE_TOP + TRAIL_NODE + TRAIL_WAVE * 2;
  return `<svg class="trail-wave" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">${segments.join("")}</svg>`;
}

function renderTrailMap() {
  const sizes = `--step-w:${trailStepWidth}px;--edge:${TRAIL_EDGE}px;--route-top:${TRAIL_ROUTE_TOP}px;--wave-size:${TRAIL_WAVE}px`;
  return `
    <section class="home-map" aria-label="Sua trilha">
      <div class="trail-frame">
        <button class="trail-arrow is-left" type="button" data-action="trail-scroll" data-direction="-1" aria-label="Ver etapas anteriores">${icon("chevron-left")}</button>
        <div class="trail-scroll">
          <div class="trail-track" style="${sizes}">
            ${renderTrailWave()}
            ${TRAIL_UNITS.map(renderTrailUnit).join("")}
          </div>
        </div>
        <button class="trail-arrow is-right" type="button" data-action="trail-scroll" data-direction="1" aria-label="Ver próximas etapas">${icon("chevron-right")}</button>
      </div>
    </section>`;
}

// Etapa que a trilha mostra ao abrir a Home: a última aberta ou, se nenhuma, a atual.
let trailCenterTopic = null;
let trailScrollLeft = 0; // para não pular de lugar quando a mesma tela é redesenhada
let trailScrollTop = 0;  // (no celular, a trilha rola para cima e para baixo)

// Distância de um elemento até o começo da trilha (somando os "pais" com posição).
function offsetInTrack(element, side) {
  let total = 0;
  for (let current = element; current && !current.classList.contains("trail-track"); current = current.offsetParent) {
    total += side === "top" ? current.offsetTop : current.offsetLeft;
  }
  return total;
}

// Mede a área da trilha, ajusta a largura das etapas e redesenha a onda.
// Também zera a rolagem que não vale no layout atual: a trilha do PC só rola
// para o lado e a do celular só para baixo (sem isso, ao mudar o tamanho da
// janela, a rolagem de um ficava "presa" no outro e cortava a faixa).
function layoutTrail(scroller) {
  if (isMobileLayout()) scroller.scrollLeft = 0;
  else scroller.scrollTop = 0;
  trailStepWidth = Math.max(TRAIL_MIN_STEP, Math.floor((scroller.clientWidth - TRAIL_EDGE * 2) / 4));
  const track = scroller.querySelector(".trail-track");
  track.style.setProperty("--step-w", `${trailStepWidth}px`);
  track.querySelector(".trail-wave").outerHTML = renderTrailWave();
  updateTrailArrows(scroller);
}

// Vigia o tamanho do quadro da trilha (ver setupTrailScroll).
let trailResizeWatcher = null;

// Depois de desenhar a Home: ajusta as medidas, posiciona a trilha e liga as setas.
function setupTrailScroll() {
  const scroller = screenRoot.querySelector(".trail-scroll");
  if (!scroller) return;
  layoutTrail(scroller);
  positionTrail(scroller);
  scroller.addEventListener("scroll", () => {
    trailScrollLeft = scroller.scrollLeft;
    trailScrollTop = scroller.scrollTop;
    updateTrailArrows(scroller);
  }, { passive: true });
  updateTrailArrows(scroller);

  // Ao voltar da atividade ou da árvore, o menu lateral volta deslizando
  // (0,38 s) e o quadro da trilha vai encolhendo. Sem vigiar, a trilha ficava
  // com as medidas de antes do menu voltar (etapas largas demais, faixa da
  // unidade cortada). Então: mudou o tamanho do quadro, mede de novo. No
  // primeiro segundo também reposiciona, porque o aluno ainda nem rolou.
  const drawnAt = performance.now();
  let lastWidth = scroller.clientWidth;
  trailResizeWatcher?.disconnect();
  trailResizeWatcher = new ResizeObserver(() => {
    if (scroller.clientWidth === lastWidth) return;
    lastWidth = scroller.clientWidth;
    layoutTrail(scroller);
    if (performance.now() - drawnAt < 1000) positionTrail(scroller);
  });
  trailResizeWatcher.observe(scroller);
}

// Rola a trilha até a etapa certa: a mesma posição de antes (se a tela só foi
// redesenhada) ou a etapa atual.
function positionTrail(scroller) {
  const step = scroller.querySelector(`.trail-node[data-topic="${trailCenterTopic || currentTopicId()}"]`)?.closest(".trail-step");
  if (app.dataset.redraw === "on") {
    if (isMobileLayout()) scroller.scrollTop = trailScrollTop;
    else scroller.scrollLeft = trailScrollLeft;
  } else if (step && isMobileLayout()) {
    // celular: a etapa (a última aberta ou a atual) fica no meio do quadro
    scroller.scrollTop = offsetInTrack(step, "top") + TRAIL_MOBILE_NODE / 2 - scroller.clientHeight / 2;
  } else if (step) {
    // computador: abre na "página" da unidade da etapa; em tela estreita,
    // anda mais um pouco se a etapa ainda ficar escondida
    const stepEnd = offsetInTrack(step, "left") + step.offsetWidth + TRAIL_EDGE;
    scroller.scrollLeft = Math.max(offsetInTrack(step.closest(".trail-unit"), "left") - TRAIL_EDGE, stepEnd - scroller.clientWidth);
  }
}

// Janela mudou de tamanho: as etapas se ajustam de novo.
window.addEventListener("resize", () => {
  const scroller = screenRoot.querySelector(".trail-scroll");
  if (scroller) layoutTrail(scroller);
});

// Cada seta só existe se ainda tiver etapas escondidas daquele lado.
function updateTrailArrows(scroller) {
  const map = scroller.closest(".home-map");
  const hasLeft = scroller.scrollLeft > 4;
  const hasRight = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 4;
  map.querySelector(".trail-arrow.is-left").hidden = !hasLeft;
  map.querySelector(".trail-arrow.is-right").hidden = !hasRight;
  scroller.classList.toggle("has-left", hasLeft);   // pontas esmaecidas (CSS)
  scroller.classList.toggle("has-right", hasRight);
}

// Setas: andam uma "página" (uma unidade e o vão) para o lado; em tela estreita,
// o que cabe na tela. Se sobrar menos de uma etapa até a ponta, vão direto até
// o fim (para não precisar de outro clique).
function scrollTrail(direction) {
  const scroller = screenRoot.querySelector(".trail-scroll");
  if (!scroller) return;
  const end = scroller.scrollWidth - scroller.clientWidth;
  const page = Math.min(trailStepWidth * 4 + TRAIL_EDGE * 2, scroller.clientWidth - TRAIL_EDGE);
  let target = scroller.scrollLeft + direction * page;
  if (target > end - trailStepWidth) target = end;
  if (target < trailStepWidth) target = 0;
  scroller.scrollTo({ left: target, behavior: "smooth" });
}

// Missão do dia na lateral da Home, com barra de progresso (o detalhe fica na aba Missões).
function renderHomeMission(mission) {
  const value = Math.min(mission.progress(), mission.target);
  const isClaimed = state.daily.claimed.includes(mission.id);
  const isReady = isMissionComplete(mission) && !isClaimed;
  let reward = `+${mission.reward} ${icon("coin")}`;
  if (isClaimed) reward = icon("check-circle-fill");
  else if (isReady) reward = icon("gift-fill");
  return `
    <button class="home-quest${isReady ? " is-ready" : ""}${isClaimed ? " is-claimed" : ""}" type="button" data-screen="missions">
      <span class="home-quest-icon tone-${mission.tone}">${icon(mission.icon)}</span>
      <span class="home-quest-copy"><strong>${mission.title}</strong>${progressBarHtml(value, mission.target, mission.title)}<small>${isReady ? "Pronta para resgatar!" : `${value} / ${mission.target}`}</small></span>
      <span class="home-quest-reward">${reward}</span>
    </button>`;
}

// Meta do dia em anel (lateral da Home no computador).
function renderDailyGoal() {
  const goal = state.dailyGoal;
  const done = Math.min(state.daily.exercises, goal);
  const degrees = Math.round((done / goal) * 360);
  const message = done >= goal ? "Meta batida, parabéns!" : `Faltam ${goal - done} para bater a meta`;
  return `
    <section class="home-side-card home-goal" aria-label="Meta do dia">
      <div class="goal-ring" style="--ring:${degrees}deg" role="progressbar" aria-label="Exercícios de hoje" aria-valuenow="${done}" aria-valuemin="0" aria-valuemax="${goal}"><strong>${done}/${goal}</strong></div>
      <div><h2>Meta do dia</h2><p>${message}</p></div>
    </section>`;
}

// Cartão da liga (lateral da Home no computador): troféu, posição, XP da semana e
// quanto falta para subir. Leva para a tela de Ligas.
function renderHomeLeague() {
  const league = LEAGUES[state.league];
  const { position, me, zone, missing } = myLeagueStanding();
  const progress = zone === "promotion" ? "na zona de promoção!" : `faltam ${missing} para subir`;
  const detail = `${me.xp} XP na semana · ${progress}`;
  return `
    <button class="home-side-card home-league" type="button" data-screen="leagues" aria-label="Liga ${league.name}, ${position}º lugar. ${detail}. Abrir ligas">
      <span class="league-badge ${league.className}">${icon("trophy-fill")}</span>
      <span class="home-league-copy"><strong>Liga ${league.name} · ${position}º lugar</strong><small>${detail}</small></span>
      ${icon("chevron-right")}
    </button>`;
}

// Seus números: ofensiva (abre o calendário), energia e vidas. O XP fica no cartão da liga.
function renderHomeTiles() {
  return `
    <section class="home-tiles" aria-label="Seus números">
      <button class="home-tile tile-streak" type="button" data-action="open-streak" aria-label="Ofensiva: ${state.streak} dias. Abrir calendário">${icon("fire")}<strong>${state.streak}</strong><small>${state.streak === 1 ? "dia" : "dias"}</small></button>
      <div class="home-tile tile-energy" aria-label="${state.energy} de ${MAX_ENERGY} de energia, ${timeUntilNextEnergy()}">${icon("battery-charging")}<strong>${state.energy}/${MAX_ENERGY}</strong><small>${state.energy >= MAX_ENERGY ? "energia" : timeUntilNextEnergy(true)}</small></div>
      <div class="home-tile tile-lives${state.lives === 1 ? " is-last-life" : ""}" aria-label="${state.lives} de ${MAX_LIVES} vidas, ${timeUntilNextLife()}">${icon("heart-fill")}<strong>${state.lives}/${MAX_LIVES}</strong><small>${state.lives >= MAX_LIVES ? "vidas" : timeUntilNextLife()}</small></div>
    </section>`;
}

function renderTrail() {
  if (state.focusTopic) return renderTopicTree();
  refreshLives();
  refreshEnergy();
  return `
    <div class="home-dashboard">
      <div class="home-main-column">
        ${renderHomeHero()}
        ${renderTrailMap()}
      </div>

      <aside class="home-side-column" aria-label="Resumo do dia">
        ${renderHomeTiles()}
        ${renderDailyGoal()}
        <section class="home-side-card home-quests" aria-labelledby="home-quests-title">
          <div class="home-side-heading"><h2 id="home-quests-title">Missões do dia</h2><button class="text-button" type="button" data-screen="missions">Ver todas</button></div>
          ${DAILY_MISSIONS.map(renderHomeMission).join("")}
        </section>
        ${renderHomeLeague()}
      </aside>
    </div>
    <p class="demo-disclaimer">O conteúdo das etapas ainda é provisório e será revisado por pessoas surdas fluentes em Libras.</p>`;
}
