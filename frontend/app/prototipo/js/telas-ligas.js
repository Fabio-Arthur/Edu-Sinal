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
    .map((player) => ({ name: player.sou_eu ? state.name : player.apelido, xp: player.sou_eu ? state.week.xp : player.xp, isMe: player.sou_eu }))
    .sort((a, b) => b.xp - a.xp || Number(b.isMe) - Number(a.isMe)); // empate: você fica na frente
}

// Busca o ranking na API (no máximo uma vez por minuto) e redesenha a tela.
let leagueRankingLoadedAt = 0;
async function refreshLeagueRanking() {
  if (!state.isRegistered || Date.now() - leagueRankingLoadedAt < 60000) return;
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
function zoneOf(position, total) {
  if (position <= PROMOTION_SPOTS) return "promotion";
  if (total > PROMOTION_SPOTS + DEMOTION_SPOTS && position > total - DEMOTION_SPOTS) return "demotion";
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
  if (zone === "promotion") {
    message = "Você está na <strong>zona de promoção</strong>. Continue assim para subir de liga!";
  } else {
    const warning = zone === "demotion" ? "Cuidado: você está na <strong>zona de rebaixamento</strong>. " : "";
    message = `${warning}Faltam <strong>${missing} XP</strong> para entrar na zona de promoção.`;
  }

  return `
    <section class="league-status zone-${zone}">
      <div class="league-status-place"><strong>${position}º</strong><span>lugar</span></div>
      <div><p>${message}</p><small>${me.xp} XP nesta semana · cada exercício novo vale ${XP_PER_EXERCISE} XP</small></div>
      <button class="button-3d button-3d-primary" type="button" data-action="open-topic" data-topic="${currentTopicId()}">Ganhar XP ${icon("arrow-right")}</button>
    </section>`;
}

// Uma linha do ranking. Os 3 primeiros ganham medalha; o aluno aparece com o mascote dele.
function renderRankingRow(player, position, total) {
  const zone = zoneOf(position, total);
  const youLabel = player.isMe ? ' <small class="ranking-you">você</small>' : "";
  const place = position <= 3
    ? `<span class="ranking-position ranking-medal medal-${position}" aria-label="${position}º lugar">${position}</span>`
    : `<span class="ranking-position">${position}</span>`;
  const avatar = player.isMe
    ? `<span class="ranking-avatar is-me ${backdropClass()}" aria-hidden="true">${mascotSvg(state.mascot, "avatar", "")}</span>`
    : `<span class="ranking-avatar avatar-tone-${position % 4}" aria-hidden="true">${escapeHtml(player.name.slice(0, 1))}</span>`;
  return `<li class="ranking-row zone-${zone}${player.isMe ? " is-me" : ""}">${place}${avatar}<strong>${escapeHtml(player.name)}${youLabel}</strong><span class="ranking-points">${player.xp} XP</span></li>`;
}

function renderLeagues() {
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
    if (position === PROMOTION_SPOTS && ranking.length > PROMOTION_SPOTS) {
      rows.push('<li class="ranking-divider zone-promotion" aria-hidden="true"><i class="bi bi-arrow-up" aria-hidden="true"></i> Zona de promoção</li>');
    }
  });

  return `
    <section class="league-hero" aria-labelledby="league-title">
      <span class="league-badge league-badge-large ${league.className}">${icon("trophy-fill")}</span>
      <div class="league-hero-copy">
        <small>LIGA DA SEMANA</small>
        <h2 id="league-title">Liga ${league.name}</h2>
        <p>Os ${PROMOTION_SPOTS} primeiros sobem de liga e os ${DEMOTION_SPOTS} últimos descem.</p>
      </div>
      <span class="league-timer">${icon("clock-fill")} Termina em <strong>${leagueTimeLeft()}</strong></span>
    </section>
    <ol class="league-ladder" aria-label="Ligas, da primeira à última">${ladder}</ol>
    ${renderLeagueStatus(ranking)}
    <section aria-labelledby="ranking-title">
      <div class="section-heading"><div><p class="eyebrow">CLASSIFICAÇÃO</p><h2 id="ranking-title">Ranking da semana</h2></div></div>
      <ol class="ranking-list">${rows.join("")}</ol>
    </section>
    <p class="safety-note"><i class="bi bi-shield-check" aria-hidden="true"></i> Nas ligas aparecem só apelidos e avatares. Não há chat, mensagens nem perfil aberto de outros alunos.</p>
    <p class="demo-disclaimer">Aparecem os alunos da sua liga que ganharam XP nesta semana.</p>`;
}
