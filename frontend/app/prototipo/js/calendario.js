// CALENDÁRIO DA OFENSIVA
// Janela que abre ao tocar no foguinho (barra de cima do celular ou Perfil).
// Mostra o mês com os dias em que o aluno praticou (fogo) e os dias salvos
// pelo protetor de ofensiva (escudo). Dá para voltar aos meses anteriores.

const WEEKDAY_LABELS = ["D", "S", "T", "Q", "Q", "S", "S"]; // começa no domingo, como no Brasil
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Mês mostrado: 0 = este mês, -1 = mês passado, e assim por diante.
let calendarMonthOffset = 0;

// O dia conta para a ofensiva? (praticou ou foi salvo pelo protetor)
function isStreakDay(date) {
  const key = dateKey(date);
  return state.practiceDays.includes(key) || state.frozenDays.includes(key);
}

// Um dia do mês. Dias seguidos da ofensiva, na mesma semana, ficam ligados
// por uma faixa: "has-left" e "has-right" dizem para que lado ela continua.
function renderCalendarDay(date, column) {
  const key = dateKey(date);
  const isToday = key === dateKey();
  const isFuture = key > dateKey();
  let status = "";
  let label = `${date.getDate()}`;
  if (state.practiceDays.includes(key)) {
    status = " is-practiced";
    label += ", praticou";
  } else if (state.frozenDays.includes(key)) {
    status = " is-frozen";
    label += ", salvo pelo protetor";
  }

  const cell = ["calendar-cell"];
  if (status) {
    const day = date.getDate();
    const before = new Date(date.getFullYear(), date.getMonth(), day - 1);
    const after = new Date(date.getFullYear(), date.getMonth(), day + 1);
    if (column > 0 && before.getMonth() === date.getMonth() && isStreakDay(before)) cell.push("has-left");
    if (column < 6 && after.getMonth() === date.getMonth() && isStreakDay(after)) cell.push("has-right");
  }
  const symbol = status === " is-frozen" ? icon("shield-fill-check") : date.getDate();
  const classes = `calendar-day${status}${isToday ? " is-today" : ""}${isFuture ? " is-future" : ""}`;
  return `<span class="${cell.join(" ")}" role="gridcell"><span class="${classes}" aria-label="${label}${isToday ? ", hoje" : ""}">${symbol}</span></span>`;
}

function renderStreakCalendar() {
  const today = brasiliaNow();
  const firstDay = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const emptyCells = firstDay.getDay(); // quantos dias antes do dia 1 (domingo = 0)

  const cells = Array.from({ length: emptyCells }, () => '<span class="calendar-cell is-empty" aria-hidden="true"></span>');
  let practicedCount = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
    if (state.practiceDays.includes(dateKey(date))) practicedCount += 1;
    cells.push(renderCalendarDay(date, (emptyCells + day - 1) % 7));
  }

  const monthName = `${MONTH_NAMES[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
  const isCurrentMonth = calendarMonthOffset === 0;
  return `
    <div class="calendar-card">
      <div class="calendar-month">
        <button class="calendar-nav" type="button" data-action="calendar-month" data-step="-1" aria-label="Mês anterior">${icon("chevron-left")}</button>
        <strong>${monthName}</strong>
        <button class="calendar-nav" type="button" data-action="calendar-month" data-step="1" aria-label="Próximo mês"${isCurrentMonth ? " disabled" : ""}>${icon("chevron-right")}</button>
      </div>
      <div class="calendar-grid" role="grid" aria-label="Dias de ${monthName}">
        ${WEEKDAY_LABELS.map((letter) => `<span class="calendar-weekday" aria-hidden="true">${letter}</span>`).join("")}
        ${cells.join("")}
      </div>
    </div>
    <div class="calendar-totals">
      <div class="calendar-total"><span class="calendar-total-icon is-fire">${icon("fire")}</span><span><strong>${practicedCount}</strong><small>${practicedCount === 1 ? "dia praticado" : "dias praticados"} no mês</small></span></div>
      <div class="calendar-total"><span class="calendar-total-icon is-shield">${icon("shield-fill-check")}</span><span><strong>${state.streakFreezes}</strong><small>${state.streakFreezes === 1 ? "protetor guardado" : "protetores guardados"}</small></span></div>
    </div>`;
}

// Topo da janela: o foguinho grande (aceso se tem ofensiva) e o número.
function renderStreakSummary() {
  const practicedToday = state.practiceDays.includes(dateKey());
  const hint = practicedToday ? "Você já praticou hoje. Volte amanhã para continuar!" : "Faça um exercício hoje para manter a ofensiva.";
  return `
    <div class="streak-hero">
      <span class="streak-flame${state.streak > 0 ? " is-lit" : ""}">${icon("fire")}</span>
      <div>
        <small>SUA OFENSIVA</small>
        <h2 id="streak-title"><strong>${state.streak}</strong> ${state.streak === 1 ? "dia" : "dias"}</h2>
        <p>${hint}</p>
      </div>
    </div>`;
}

function fillStreakModal() {
  document.getElementById("streak-body").innerHTML = `
    ${renderStreakSummary()}
    <div class="streak-content">
      ${renderStreakCalendar()}
      <div class="calendar-legend">
        <span><span class="calendar-day is-practiced" aria-hidden="true">1</span> Praticou</span>
        <span><span class="calendar-day is-frozen" aria-hidden="true">${icon("shield-fill-check")}</span> Protetor</span>
        <span><span class="calendar-day is-today" aria-hidden="true">1</span> Hoje</span>
      </div>
    </div>`;
}

function openStreakCalendar() {
  if (!window.bootstrap) {
    setScreen("profile"); // sem o Bootstrap, a janela não abre: mostra o Perfil
    return;
  }
  calendarMonthOffset = 0;
  fillStreakModal();
  bootstrap.Modal.getOrCreateInstance(document.getElementById("streak-modal")).show();
}

function changeCalendarMonth(step) {
  calendarMonthOffset = Math.min(0, calendarMonthOffset + step); // não mostra meses futuros
  fillStreakModal();
}
