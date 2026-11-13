// LIGAS
// Ranking semanal com os alunos de verdade da mesma liga (vem da API:
// GET /ligas/semana). Os 3 primeiros sobem de liga e os 2 últimos descem quando
// a semana vira (segunda-feira); quem decide isso é o servidor.
// Pensado para menores: só apelidos e avatares, sem chat e sem perfil aberto.

const LEAGUES = [
  { name: "Bronze", className: "league-bronze" },
  { name: "Prata", className: "league-prata" },
  { name: "Ouro", className: "league-ouro" },
  { name: "Safira", className: "league-safira" },
  { name: "Diamante", className: "league-diamante" },
];

const PROMOTION_SPOTS = 3; // quantos sobem
const GROUP_SIZE = 10; // alunos por grupo da liga (o servidor separa os grupos)
const DEMOTION_SPOTS = 2;  // quantos descem

// Dia da semana: segunda = 1 ... domingo = 7.
function weekDayNumber() {
  return ((new Date().getDay() + 6) % 7) + 1;
}

// Classificação da semana, do maior XP para o menor. Antes de a API
// responder, aparece só o próprio aluno.
// O XP do próprio aluno vem sempre do estado mais novo (o ranking dos
// outros pode ter até 1 minuto de atraso).
function buildRanking() {
  if (!state.leagueRanking) return [{ name: state.name, xp: state.week.xp, isMe: true }];
  return state.leagueRanking
    .map((player) => ({
      name: player.sou_eu ? state.name : player.apelido,
      xp: player.sou_eu ? state.week.xp : player.xp,
      look: player.sou_eu ? state.mascot : lookFromServer(player.mascote), // o mascote de cada um é a "foto"
      isMe: player.sou_eu,
    }))
    .sort((a, b) => b.xp - a.xp || Number(b.isMe) - Number(a.isMe)); // empate: você fica na frente
}

// No PC a lista do ranking rola por dentro: rola até o aluno, para ele se ver
// sem procurar (fica no meio da lista quando dá).
function scrollRankingToMe() {
  const list = document.querySelector(".ranking-list");
  const me = list?.querySelector(".ranking-row.is-me");
  if (!me || list.scrollHeight <= list.clientHeight) return;
  list.scrollTop = me.offsetTop - (list.clientHeight - me.offsetHeight) / 2;
}

// Busca o ranking na API (no máximo uma vez por minuto) e redesenha a tela.
let leagueRankingLoadedAt = 0;
async function refreshLeagueRanking() {
  if (!state.isRegistered || state.isGuest || Date.now() - leagueRankingLoadedAt < 60000) return;
  leagueRankingLoadedAt = Date.now();
  try {
    const result = await api("GET", "/ligas/semana");
    state.leagueRanking = result.ranking;
    applyServerState(result.estado);
  } catch (error) {
    leagueRankingLoadedAt = 0; // deu erro: tenta de novo na próxima vez
    return;
  }
  if (["leagues", "trail"].includes(state.screen) && !state.focusTopic) render();
}

// "promotion" (sobe), "demotion" (desce) ou "safe" (fica). Mesma regra do
// servidor: com pouca gente na liga, ninguém desce.
function zoneOf(position, total, league = state.league) {
  // Na Bronze (a primeira) ninguém desce, e no Diamante (a última) ninguém sobe.
  if (position <= PROMOTION_SPOTS) return league === LEAGUES.length - 1 ? "safe" : "promotion";
  if (total > PROMOTION_SPOTS + DEMOTION_SPOTS && position > total - DEMOTION_SPOTS) return league === 0 ? "safe" : "demotion";
  return "safe";
}

function leagueTimeLeft() {
  const daysLeft = 7 - weekDayNumber();
  if (daysLeft === 1) return "1 dia";
  if (daysLeft > 1) return `${daysLeft} dias`;
  return `${24 - new Date().getHours()} h`;
}

// Frase de situação: na zona de promoção, no meio ou na zona de rebaixamento.
// Onde o aluno está na liga desta semana: posição, zona e quanto XP falta para
// entrar na zona de promoção. Usado aqui e no cartão da liga na Home.
function myLeagueStanding(ranking = buildRanking()) {
  const position = ranking.findIndex((player) => player.isMe) + 1;
  const me = ranking[position - 1];
  const zone = zoneOf(position, ranking.length);
  const missing = zone === "promotion" ? 0 : ranking[PROMOTION_SPOTS - 1].xp - me.xp + 1;
  return { position, me, zone, missing };
}

function renderLeagueStatus(ranking) {
  const { position, me, zone, missing } = myLeagueStanding(ranking);

  let message;
  if (me.xp === 0) {
    // Ainda não jogou nesta semana: em vez de assustar com "rebaixamento", convida.
    message = "Você ainda não entrou na disputa desta semana. <strong>Faça uma atividade</strong> para ganhar XP e subir no ranking!";
  } else if (state.league === LEAGUES.length - 1) {
    message = zone === "demotion"
      ? "Cuidado: você está na <strong>zona de rebaixamento</strong> da Liga Diamante. Ganhe XP para continuar aqui!"
      : "Você está na <strong>Liga Diamante</strong>, a mais alta! Continue ganhando XP para ficar aqui.";
  } else if (zone === "promotion") {
    message = "Você está na <strong>zona de promoção</strong>. Continue assim para subir de liga!";
  } else {
    const warning = zone === "demotion" ? "Cuidado: você está na <strong>zona de rebaixamento</strong>. " : "";
    message = `${warning}Faltam <strong>${missing} XP</strong> para entrar na zona de promoção.`;
  }

  return `
    <section class="league-status zone-${me.xp === 0 ? "safe" : zone}">
      <div class="league-status-place"><strong>${position}º</strong><span>lugar</span></div>
      <div><p>${message}</p><small>${me.xp} XP nesta semana · cada exercício novo vale ${XP_PER_EXERCISE} XP</small></div>
      <button class="button-3d button-3d-primary" type="button" data-action="open-topic" data-topic="${currentTopicId()}">Ganhar XP ${icon("arrow-right")}</button>
    </section>`;
}

// A regra da liga atual, no cartão de cima.
function leagueRuleText() {
  if (state.league === 0) return `Os ${PROMOTION_SPOTS} primeiros da salinha sobem para a Liga ${LEAGUES[1].name}.`;
  if (state.league === LEAGUES.length - 1) return `A liga mais alta! Os ${DEMOTION_SPOTS} últimos da salinha descem para a Liga ${LEAGUES[state.league - 1].name}.`;
  return `Os ${PROMOTION_SPOTS} primeiros da salinha sobem de liga e os ${DEMOTION_SPOTS} últimos descem.`;
}

// Uma linha do ranking. Os 3 primeiros ganham medalha; o aluno aparece com o mascote dele.
function renderRankingRow(player, position, total) {
  const zone = zoneOf(position, total);
  const youLabel = player.isMe ? ' <small class="ranking-you">você</small>' : "";
  const place = position <= 3
    ? `<span class="ranking-position ranking-medal medal-${position}" aria-label="${position}º lugar">${position}</span>`
    : `<span class="ranking-position">${position}</span>`;
  const look = player.look || state.mascot;
  const avatar = `<span class="ranking-avatar${player.isMe ? " is-me" : ""} ${backdropClass(look)}" aria-hidden="true">${mascotSvg(look, "avatar", "")}</span>`;
  return `<li class="ranking-row zone-${zone}${player.isMe ? " is-me" : ""}">${place}${avatar}<strong>${escapeHtml(player.name)}${youLabel}</strong><span class="ranking-points">${player.xp} XP</span></li>`;
}

function renderLeagues() {
  if (state.isGuest) return renderLeaguesForGuest();
  const league = LEAGUES[state.league];
  const ranking = buildRanking();

  // Escada: as ligas já passadas ficam coloridas, a atual em destaque e as próximas cinza
  const ladder = LEAGUES.map((item, index) => {
    let status = " is-passed";
    if (index === state.league) status = " is-current";
    else if (index > state.league) status = " is-locked";
    return `<li class="league-step ${item.className}${status}"${index === state.league ? ' aria-current="step"' : ""}><span class="league-badge">${icon(index > state.league ? "lock-fill" : "trophy-fill")}</span><small>${item.name}</small></li>`;
  }).join("");

  // Linhas da tabela, com um aviso entre as zonas.
  const rows = [];
  ranking.forEach((player, index) => {
    const position = index + 1;
    if (zoneOf(position, ranking.length) === "demotion" && zoneOf(position - 1, ranking.length) !== "demotion") {
      rows.push('<li class="ranking-divider zone-demotion" aria-hidden="true"><i class="bi bi-arrow-down" aria-hidden="true"></i> Zona de rebaixamento</li>');
    }
    rows.push(renderRankingRow(player, position, ranking.length));
    if (position === PROMOTION_SPOTS && ranking.length > PROMOTION_SPOTS && zoneOf(position, ranking.length) === "promotion") {
      rows.push('<li class="ranking-divider zone-promotion" aria-hidden="true"><i class="bi bi-arrow-up" aria-hidden="true"></i> Zona de promoção</li>');
    }
  });

  return `
    <section class="league-hero" aria-labelledby="league-title">
      <span class="league-badge league-badge-large ${league.className}">${icon("trophy-fill")}</span>
      <div class="league-hero-copy">
        <small>LIGA DA SEMANA</small>
        <h2 id="league-title">Liga ${league.name}</h2>
        <p>${leagueRuleText()}</p>
      </div>
      <span class="league-timer">${icon("clock-fill")} Termina em <strong>${leagueTimeLeft()}</strong></span>
    </section>
    <div class="desk-columns">
    <div class="desk-col">
    <ol class="league-ladder" aria-label="Ligas, da primeira à última">${ladder}</ol>
    ${renderLeagueStatus(ranking)}
    <p class="safety-note"><i class="bi bi-shield-check" aria-hidden="true"></i> Nas ligas aparecem só apelidos e avatares. Não há chat, mensagens nem perfil aberto de outros alunos.</p>
    <p class="demo-disclaimer">Cada liga é dividida em grupos de até ${GROUP_SIZE} alunos. Aqui aparece o seu grupo: quem ganhou XP nesta semana.</p>
    </div>
    <div class="desk-col desk-col-fill">
    <section class="ranking-section" aria-labelledby="ranking-title">
      <div class="section-heading"><div><p class="eyebrow">CLASSIFICAÇÃO</p><h2 id="ranking-title">Ranking da semana</h2></div></div>
      <ol class="ranking-list">${rows.join("")}</ol>
    </section>
    </div>
    </div>`;
}

// Visitante não entra na liga: em vez do ranking, mostra como as ligas
// funcionam e o convite para criar a conta (o progresso vai junto).
function renderLeaguesForGuest() {
  const ladder = LEAGUES.map((item, index) => `<li class="league-step ${item.className} is-locked"><span class="league-badge">${icon(index === 0 ? "trophy-fill" : "lock-fill")}</span><small>${item.name}</small></li>`).join("");
  return `
    <section class="league-hero" aria-labelledby="league-title">
      <span class="league-badge league-badge-large ${LEAGUES[0].className}">${icon("trophy-fill")}</span>
      <div class="league-hero-copy">
        <small>LIGAS</small>
        <h2 id="league-title">Compita com outros alunos</h2>
        <p>Toda semana, quem ganha mais XP sobe de liga. Dá para chegar até o Diamante!</p>
      </div>
    </section>
    <ol class="league-ladder" aria-label="Ligas, da primeira à última">${ladder}</ol>
    <section class="guest-card" aria-labelledby="guest-league-title">
      <span class="guest-card-icon">${icon("lock-fill")}</span>
      <div>
        <h2 id="guest-league-title">As ligas são para quem tem conta</h2>
        <p>Crie uma conta para entrar na Liga Bronze. É rapidinho, e tudo o que você já fez vai junto.</p>
      </div>
      <button class="button-3d button-3d-primary" type="button" data-screen="signup">Criar conta</button>
    </section>
    <p class="safety-note"><i class="bi bi-shield-check" aria-hidden="true"></i> Nas ligas aparecem só apelidos e avatares. Não há chat, mensagens nem perfil aberto de outros alunos.</p>`;
}
