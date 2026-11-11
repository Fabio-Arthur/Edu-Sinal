// MISSÕES
// Metas pequenas que dão moedas. As diárias recomeçam à meia-noite e as
// semanais na segunda-feira. O progresso vem do que o aluno faz de verdade.

// progress: função que diz quanto já foi feito.
// As duas primeiras seguem a meta diária que o aluno escolheu no cadastro
// (1, 3 ou 5 atividades): por isso o alvo e o título são calculados na hora ("get").
const DAILY_MISSIONS = [
  {
    id: "exercicios", icon: "pencil-fill", tone: "coral", text: "Faça atividades novas na árvore da etapa.", reward: 10,
    get target() { return state.dailyGoal; },
    get title() { return `Conclua ${state.dailyGoal} ${state.dailyGoal === 1 ? "atividade" : "atividades"}`; },
    progress: () => state.daily.exercises,
  },
  {
    id: "xp", icon: "stars", tone: "yellow", text: `Cada atividade nova vale ${XP_PER_EXERCISE} XP.`, reward: 10,
    get target() { return state.dailyGoal * XP_PER_EXERCISE; },
    get title() { return `Ganhe ${state.dailyGoal * XP_PER_EXERCISE} XP`; },
    progress: () => state.daily.xp,
  },
  { id: "dicionario", icon: "book-fill", tone: "teal", title: "Veja 3 sinais no dicionário", text: "Revisar é livre e não gasta vidas.", target: 3, reward: 5, progress: () => state.daily.signsViewed.length },
];

const WEEKLY_MISSIONS = [
  { id: "xp-semana", icon: "trophy-fill", tone: "yellow", title: "Ganhe 200 XP na semana", text: "O mesmo XP que conta para a liga.", target: 200, reward: 30, progress: () => state.week.xp },
  { id: "ofensiva", icon: "fire", tone: "coral", title: "Chegue a 5 dias de ofensiva", text: "Pratique um pouco todos os dias.", target: 5, reward: 20, progress: () => state.streak },
];

function missionList(scope) {
  return scope === "daily" ? DAILY_MISSIONS : WEEKLY_MISSIONS;
}

// Lista de missões já resgatadas (hoje ou nesta semana).
function claimedList(scope) {
  return scope === "daily" ? state.daily.claimed : state.week.claimed;
}

function isMissionComplete(mission) {
  return mission.progress() >= mission.target;
}

// Quantas missões estão prontas esperando o resgate (aparece na Home).
function readyMissionsCount() {
  let count = 0;
  ["daily", "weekly"].forEach((scope) => {
    missionList(scope).forEach((mission) => {
      if (isMissionComplete(mission) && !claimedList(scope).includes(mission.id)) count += 1;
    });
  });
  return count;
}

// Resgatar: o servidor confere se a missão foi mesmo completada e dá as moedas.
async function claimMission(scope, missionId) {
  const mission = missionList(scope).find((entry) => entry.id === missionId);
  const claimed = claimedList(scope);
  if (!mission || claimed.includes(mission.id) || !isMissionComplete(mission)) return;

  try {
    applyServerState(await api("POST", `/missoes/${missionId}/resgatar`));
  } catch (error) {
    showApiError(error);
    return;
  }
  render();
  showToast(`Missão concluída: +${mission.reward} moedas!`);
}

function renderMissionRow(mission, scope) {
  const value = Math.min(mission.progress(), mission.target);
  const isClaimed = claimedList(scope).includes(mission.id);
  const isReady = isMissionComplete(mission) && !isClaimed;
  const percent = Math.round((value / mission.target) * 100);

  let action = `<span class="mission-reward">${icon("coin")} +${mission.reward}</span>`;
  if (isClaimed) {
    action = `<span class="mission-claimed">${icon("check-circle-fill")} Resgatada</span>`;
  } else if (isReady) {
    action = `<button class="button-3d button-3d-gold mission-claim" type="button" data-action="claim-mission" data-scope="${scope}" data-mission="${mission.id}">${icon("gift-fill")} Resgatar +${mission.reward}</button>`;
  }

  return `
    <article class="mission-row${isReady ? " is-ready" : ""}${isClaimed ? " is-claimed" : ""}">
      <span class="mission-mark tone-${mission.tone}">${icon(mission.icon)}</span>
      <div class="mission-copy">
        <h3>${mission.title}</h3>
        <p>${mission.text}</p>
        <div class="mission-progress"><div class="mission-bar" role="progressbar" aria-label="${mission.title}" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${mission.target}"><span style="width: ${percent}%"></span></div><strong>${value} / ${mission.target}</strong></div>
      </div>
      ${action}
    </article>`;
}

// Moedas que ainda dá para ganhar com as missões não resgatadas.
function coinsLeftToEarn() {
  let total = 0;
  ["daily", "weekly"].forEach((scope) => {
    missionList(scope).forEach((mission) => {
      if (!claimedList(scope).includes(mission.id)) total += mission.reward;
    });
  });
  return total;
}

function renderMissions() {
  const doneToday = DAILY_MISSIONS.filter((mission) => state.daily.claimed.includes(mission.id)).length;
  const ready = readyMissionsCount();
  const hoursLeft = 24 - new Date().getHours();
  const heroText = ready > 0
    ? `${ready} ${ready === 1 ? "missão pronta" : "missões prontas"} para resgatar!`
    : "Complete metas pequenas e ganhe moedas para a lojinha.";
  return `
    <section class="missions-hero" aria-labelledby="missions-title">
      <span class="missions-hero-gift${ready > 0 ? " is-ready" : ""}">${icon("gift-fill")}</span>
      <div class="missions-hero-copy">
        <small>OBJETIVOS</small>
        <h2 id="missions-title">Missões</h2>
        <p>${heroText}</p>
      </div>
      <div class="missions-hero-stats">
        <span><strong>${doneToday}/${DAILY_MISSIONS.length}</strong> hoje</span>
        <span><strong>${icon("coin")} ${coinsLeftToEarn()}</strong> para ganhar</span>
      </div>
    </section>
    <section class="mission-group" aria-labelledby="daily-missions-title">
      <div class="mission-heading"><h2 id="daily-missions-title">Missões do dia</h2><span class="mission-timer">${icon("clock-fill")} Renovam em ${hoursLeft} h</span></div>
      <div class="mission-list">${DAILY_MISSIONS.map((mission) => renderMissionRow(mission, "daily")).join("")}</div>
    </section>
    <section class="mission-group" aria-labelledby="weekly-missions-title">
      <div class="mission-heading"><h2 id="weekly-missions-title">Missões da semana</h2><span class="mission-timer">${icon("calendar-week-fill")} Renovam na segunda</span></div>
      <div class="mission-list">${WEEKLY_MISSIONS.map((mission) => renderMissionRow(mission, "weekly")).join("")}</div>
    </section>
    <button class="button-3d button-3d-primary missions-practice" type="button" data-action="open-topic" data-topic="${currentTopicId()}">Praticar agora ${icon("arrow-right")}</button>`;
}
