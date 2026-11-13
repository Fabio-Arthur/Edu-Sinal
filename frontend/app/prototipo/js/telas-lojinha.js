// LOJINHA
// Tudo é comprado com moedas do jogo (não existe dinheiro real).
// Aqui ficam as ajudas e a vitrine do dia: 3 itens do mascote que trocam
// todo dia. Os itens em si estão em telas-mascote.js.

const MAX_STREAK_FREEZES = 2;

// Ajudas: são usadas na hora (vidas e energia) ou guardadas (protetor de ofensiva).
const POWER_UPS = [
  { id: "recarga-energia", icon: "battery-charging", name: "Recarga de energia", text: `Enche as ${MAX_ENERGY} energias na hora. Só uma por dia, para ir com calma.`, cost: 40 },
  { id: "recarga-vidas", icon: "heart-pulse-fill", name: "Recarga de vidas", text: `Enche as ${MAX_LIVES} vidas na hora.`, cost: 30 },
  { id: "protetor-ofensiva", icon: "shield-fill-check", name: "Protetor de ofensiva", text: `Salva sua ofensiva se você ficar um dia sem praticar. Máximo de ${MAX_STREAK_FREEZES}.`, cost: 50 },
];

// Se a ajuda pode ser comprada agora; se não, o motivo.
function powerUpBlockReason(power) {
  if (power.id === "recarga-energia") {
    refreshEnergy();
    if (state.energyRefillDate === dateKey()) return "Volte amanhã";
    if (state.energy >= MAX_ENERGY) return "Energia cheia";
  }
  if (power.id === "recarga-vidas") {
    refreshLives();
    if (state.lives >= MAX_LIVES) return "Vidas completas";
  }
  if (power.id === "protetor-ofensiva" && state.streakFreezes >= MAX_STREAK_FREEZES) return `Você já tem ${MAX_STREAK_FREEZES}`;
  if (state.coins < power.cost) return "Moedas insuficientes";
  return "";
}

// Comprar uma ajuda: o servidor confere as moedas e as regras e devolve o estado.
async function buyPowerUp(powerId) {
  const power = POWER_UPS.find((entry) => entry.id === powerId);
  if (!power || powerUpBlockReason(power)) return;

  try {
    applyServerState(await api("POST", "/lojinha/compras", { id: power.id }));
  } catch (error) {
    showApiError(error);
    return;
  }
  const messages = {
    "recarga-energia": "Energia recarregada!",
    "recarga-vidas": "Vidas recarregadas!",
    "protetor-ofensiva": "Protetor de ofensiva guardado.",
  };
  showToast(messages[power.id]);
  render();
}

// Estado atual de cada ajuda (mostrado no cartão).
function powerUpStatus(power) {
  if (power.id === "recarga-energia") return `${icon("battery-charging")} ${state.energy} de ${MAX_ENERGY} · ${state.energyRefillDate === dateKey() ? "já usada hoje" : timeUntilNextEnergy()}`;
  if (power.id === "recarga-vidas") return `${icon("heart-fill")} ${state.lives} de ${MAX_LIVES} vidas`;
  return `${icon("shield-fill-check")} Você tem ${state.streakFreezes} de ${MAX_STREAK_FREEZES}`;
}

function renderPowerUp(power) {
  const reason = powerUpBlockReason(power);
  const button = reason
    ? `<button class="button-3d shop-buy" type="button" disabled>${reason}</button>`
    : `<button class="button-3d button-3d-gold shop-buy" type="button" data-action="buy-power" data-power="${power.id}">Comprar ${icon("coin")} ${power.cost}</button>`;
  return `
    <article class="shop-card shop-card-${power.id}">
      <span class="shop-card-icon">${icon(power.icon)}</span>
      <div class="shop-card-info">
        <h3>${power.name}</h3>
        <p>${power.text}</p>
        <span class="shop-card-status">${powerUpStatus(power)}</span>
      </div>
      ${button}
    </article>`;
}

// ----- Vitrine do dia -----

const DAILY_SHOP_SIZE = 3;

// Gerador de números "aleatórios" que sempre dá a mesma sequência para o
// mesmo texto. Usando a data como texto, todo mundo vê a mesma vitrine no
// mesmo dia, e recarregar a página não troca os itens.
function seededRandom(seedText) {
  let seed = 0;
  for (const char of seedText) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
  return () => {
    // Mistura os bits do número (algoritmo "mulberry32") para que dias
    // seguidos, como 25 e 26, deem vitrines bem diferentes.
    seed = (seed + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296; // número entre 0 e 1
  };
}

// Os 3 itens do dia: embaralha todos os itens vendidos por moedas e pega
// os primeiros, sem repetir o tipo (uma roupa, um fundo, um rosto...).
function dailyShopItems(day = dateKey()) {
  const random = seededRandom(day);
  const pool = MASCOT_ITEMS.filter((item) => item.unlock.type === "coins");
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = [];
  for (const item of pool) {
    if (picked.length < DAILY_SHOP_SIZE && !picked.some((other) => other.slot === item.slot)) picked.push(item);
  }
  return picked;
}

function isInDailyShop(item) {
  return dailyShopItems().includes(item);
}

// Quanto falta para a meia-noite, quando a vitrine troca.
function timeUntilNewShop() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const minutes = Math.ceil((midnight - now) / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
}

// Cartão de um item da vitrine: o desenho do item sozinho e o botão.
// (Como fica no mascote aparece na janela de compra.)
// O botão usa a mesma ação do guarda-roupa (compra e já veste).
function renderShopItem(item) {
  const slotInfo = MASCOT_SLOTS.find((slot) => slot.id === item.slot);
  // Fundo: a moldura já é o próprio fundo. Os outros itens ficam no azul da logo.
  const frame = item.slot === "background" ? backdropClass(lookWith(item.slot, item.id)) : "mascot-backdrop";
  const action = `data-action="mascot-item" data-slot="${item.slot}" data-item="${item.id}"`;
  let button;
  if (state.mascot[item.slot] === item.id) {
    button = `<button class="button-3d shop-buy" type="button" disabled>${icon("check-lg")} Em uso</button>`;
  } else if (isMascotItemOwned(item)) {
    button = `<button class="button-3d button-3d-primary shop-buy" type="button" ${action}>Vestir</button>`;
  } else {
    // Sempre mostra o preço. Sem moedas suficientes, o botão fica apagado e,
    // se clicar, avisa quanto falta (em chooseMascotItem).
    const color = state.coins < item.unlock.cost ? "" : " button-3d-gold";
    button = `<button class="button-3d${color} shop-buy" type="button" ${action}>Comprar ${icon("coin")} ${item.unlock.cost}</button>`;
  }
  return `
    <article class="shop-card shop-item">
      <span class="shop-item-art ${frame}">${mascotItemSvg(item)}</span>
      <div class="shop-item-info">
        <span class="shop-item-slot">${slotInfo.label}</span>
        <h3>${item.name}</h3>
        ${item.description ? `<p class="shop-item-description">${item.description}</p>` : ""}
        ${isMascotItemOwned(item) ? `<span class="shop-item-owned">${icon("check-circle-fill")} Já é seu</span>` : ""}
      </div>
      ${button}
    </article>`;
}

function renderShop() {
  const items = mascotItemsCount();
  return `
    <section class="shop-hero" aria-labelledby="shop-title">
      <span class="shop-hero-coin">${icon("coin")}</span>
      <div class="shop-hero-copy">
        <small>RECOMPENSAS DA JORNADA</small>
        <h2 id="shop-title">Lojinha</h2>
        <p>Use as moedas dos exercícios e das missões. Não há compras com dinheiro real.</p>
      </div>
      <span class="shop-hero-balance"><strong>${state.coins}</strong> moedas</span>
    </section>
    <div class="screen-scroll">
    <section class="shop-group" aria-labelledby="shop-daily-title">
      <div class="mission-heading"><h2 id="shop-daily-title">Vitrine do dia</h2><span class="mission-timer">${icon("clock-fill")} Troca em ${timeUntilNewShop()}</span></div>
      <div class="shop-showcase">${dailyShopItems().map(renderShopItem).join("")}</div>
    </section>
    <section class="shop-group" aria-labelledby="shop-power-title">
      <div class="mission-heading"><h2 id="shop-power-title">Ajudas</h2><span class="mission-timer">${icon("lightning-charge-fill")} Para a jornada</span></div>
      <div class="shop-grid">${POWER_UPS.map(renderPowerUp).join("")}</div>
    </section>
    <section class="shop-group" aria-labelledby="shop-mascot-title">
      <div class="mission-heading"><h2 id="shop-mascot-title">Guarda-roupa do mascote</h2><span class="mission-timer">${icon("bag-heart-fill")} ${items.owned} de ${items.total} itens</span></div>
      <div class="shop-wardrobe">
        <span class="shop-wardrobe-mascot ${backdropClass()}">${mascotSvg(state.mascot, "full", "", { animated: true })}</span>
        <div><h3>Roupas, acessórios e fundos</h3><p>Vista o que já é seu. Itens novos aparecem na vitrine do dia ou vêm de conquistas.</p></div>
        <button class="button-3d button-3d-primary" type="button" data-screen="mascot">Abrir guarda-roupa ${icon("arrow-right")}</button>
      </div>
    </section>
    <p class="demo-disclaimer">As moedas são do jogo: não há compras com dinheiro real.</p>
    </div>`;
}
