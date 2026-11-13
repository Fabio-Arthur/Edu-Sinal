// MASCOTE PERSONALIZÁVEL
// Lista de roupas e acessórios, as regras para liberar cada um e a tela
// do editor. O desenho em si fica em mascote-desenho.js.
//
// Formas de liberar um item (campo "unlock"):
//   { type: "free" }                      grátis desde o começo
//   { type: "coins", cost: 30 }           comprado com moedas
//   { type: "reward" }                    ganho em um momento do jogo (broche da 1ª atividade)
//   { type: "achievement", id: "etapa" }  ganho ao completar uma conquista do perfil

// Partes que podem ser trocadas, na ordem das abas do editor.
const MASCOT_SLOTS = [
  { id: "shirt", label: "Roupa", crop: "full" },
  { id: "head", label: "Cabeça", crop: "head" },
  { id: "face", label: "Rosto", crop: "head" },
  { id: "chest", label: "Broche", crop: "full" },
  { id: "background", label: "Fundo", crop: "full" },
];

// Visual da logo: camiseta branca e nada mais.
const DEFAULT_LOOK = { shirt: "camiseta-branca", head: "", face: "", chest: "", background: "" };

const MASCOT_ITEMS = [
  // Roupas (fill = cor, trim = gola, design = estilo)
  { id: "camiseta-branca", slot: "shirt", name: "Clássica da logo", fill: "#ffffff", trim: "#1652c7", design: "plain", unlock: { type: "free" } },
  { id: "camiseta-azul", slot: "shirt", name: "Camiseta azul", fill: "#3d8bfd", trim: "#1652c7", design: "plain", unlock: { type: "free" } },
  { id: "camiseta-turquesa", slot: "shirt", name: "Camiseta turquesa", fill: "#2bbbb3", trim: "#137a75", design: "plain", unlock: { type: "free" } },
  { id: "camiseta-coral", slot: "shirt", name: "Camiseta coral", description: "Quentinha igual fim de tarde", fill: "#f07a68", trim: "#b84a3a", design: "plain", unlock: { type: "coins", cost: 20 } },
  { id: "camiseta-amarela", slot: "shirt", name: "Camiseta amarela", description: "Alegre como dia de sol", fill: "#f7cd4d", trim: "#b58a12", design: "plain", unlock: { type: "coins", cost: 20 } },
  { id: "camiseta-listrada", slot: "shirt", name: "Listrada", description: "Listras pra todo lado", fill: "#ffffff", stripe: "#9cc3f0", trim: "#1652c7", design: "stripes", unlock: { type: "coins", cost: 35 } },
  { id: "moletom-edusinal", slot: "shirt", name: "Moletom EduSinal", fill: "#24497f", trim: "#162f55", design: "hoodie", unlock: { type: "achievement", id: "etapa" } },
  { id: "camisa-campeao", slot: "shirt", name: "Camisa de campeão", fill: "#f2c230", trim: "#b8860b", design: "champion", unlock: { type: "achievement", id: "liga" } },

  // Cabeça
  { id: "", slot: "head", name: "Nada", unlock: { type: "free" } },
  { id: "bone", slot: "head", name: "Boné", unlock: { type: "free" } },
  { id: "laco", slot: "head", name: "Laço", unlock: { type: "free" } },
  { id: "chapeu-festa", slot: "head", name: "Chapéu de festa", description: "Pra comemorar cada conquista", unlock: { type: "coins", cost: 30 } },
  { id: "tiara-flores", slot: "head", name: "Tiara de flores", description: "Um jardim na cabeça", unlock: { type: "coins", cost: 40 } },
  { id: "coroa", slot: "head", name: "Coroa", unlock: { type: "achievement", id: "ofensiva" } },

  // Rosto
  { id: "", slot: "face", name: "Nada", unlock: { type: "free" } },
  { id: "bochechas", slot: "face", name: "Bochechas", unlock: { type: "free" } },
  { id: "oculos-redondos", slot: "face", name: "Óculos redondos", unlock: { type: "free" } },
  { id: "oculos-sol", slot: "face", name: "Óculos de sol", description: "Estilo até debaixo do sol", unlock: { type: "coins", cost: 30 } },

  // Broches (os mesmos ids e preços da lojinha antiga, para ninguém perder o que comprou)
  { id: "", slot: "chest", name: "Nada", unlock: { type: "free" } },
  // Broches: só por conquista (cada conquista do Perfil dá um prêmio)
  { id: "broche-sinal", slot: "chest", name: "Broche de sinais", unlock: { type: "achievement", id: "primeiro" } },
  { id: "estrela-coral", slot: "chest", name: "Estrela coral", description: "Pra quem brilha nos estudos", unlock: { type: "achievement", id: "cinco" } },
  { id: "flor-amarela", slot: "chest", name: "Flor amarela", description: "Uma flor que nunca murcha", unlock: { type: "achievement", id: "colecionador" } },
  { id: "folha-azul", slot: "chest", name: "Folha azul", description: "Pra quem explora o dicionário", unlock: { type: "achievement", id: "explorador" } },

  // Fundos (cor atrás do mascote)
  { id: "", slot: "background", name: "Azul da logo", unlock: { type: "free" } },
  { id: "fundo-ceu", slot: "background", name: "Céu azul", description: "Um céu limpinho atrás de você", unlock: { type: "coins", cost: 20 } },
  { id: "fundo-mar", slot: "background", name: "Mar turquesa", description: "Ondas calmas cor de mar", unlock: { type: "coins", cost: 30 } },
  { id: "fundo-por-do-sol", slot: "background", name: "Pôr do sol", description: "O céu laranja do fim do dia", unlock: { type: "coins", cost: 30 } },
  { id: "fundo-sol", slot: "background", name: "Sol da manhã", description: "Bom dia com luz suave", unlock: { type: "coins", cost: 30 } },
];

function findMascotItem(slot, id) {
  return MASCOT_ITEMS.find((item) => item.slot === slot && item.id === id);
}

// O aluno já pode usar este item?
function isMascotItemOwned(item) {
  const unlock = item.unlock;
  if (unlock.type === "free") return true;
  if (unlock.type === "achievement") {
    const achievement = ACHIEVEMENTS.find((entry) => entry.id === unlock.id);
    return achievement.progress() >= achievement.target;
  }
  return state.unlockedItems.includes(item.id); // moedas ou recompensa
}

// Quantos itens o aluno já pode usar, de quantos existem (sem contar os "Nada").
function mascotItemsCount() {
  const items = MASCOT_ITEMS.filter((item) => item.id);
  return { owned: items.filter(isMascotItemOwned).length, total: items.length };
}

// Texto curto que explica como liberar o item.
function unlockLabel(item) {
  const unlock = item.unlock;
  if (unlock.type === "coins") return `${unlock.cost} ${icon("coin")}`;
  if (unlock.type === "reward") return "1ª atividade";
  if (unlock.type === "achievement") {
    const achievement = ACHIEVEMENTS.find((entry) => entry.id === unlock.id);
    return isAchievementVisible(achievement) ? `Conquista: ${achievement.title}` : "Conquista escondida";
  }
  return "Grátis";
}

// O visual atual trocando só uma parte (usado nas miniaturas do editor).
function lookWith(slot, id) {
  return { ...state.mascot, [slot]: id };
}

// Classe CSS do fundo atrás do mascote (sem fundo comprado = azul da logo).
function backdropClass(look = state.mascot) {
  return look.background ? `mascot-backdrop bg-${look.background}` : "mascot-backdrop";
}

// ----- Ações do editor -----

// Clique em um item: usa se já for do aluno; compra se estiver na vitrine do dia.
function chooseMascotItem(slot, id) {
  const item = findMascotItem(slot, id);
  if (!item) return;

  if (!isMascotItemOwned(item)) {
    if (item.unlock.type === "achievement") {
      const achievement = ACHIEVEMENTS.find((entry) => entry.id === item.unlock.id);
      showToast(isAchievementVisible(achievement)
        ? `Complete a conquista “${achievement.title}” no perfil para liberar.`
        : "Esse item vem de uma conquista escondida. Complete as conquistas do Perfil para descobrir qual!");
      return;
    }
    if (item.unlock.type === "reward") {
      showToast("Complete a primeira atividade para receber este item.");
      return;
    }
    if (!isInDailyShop(item)) {
      showToast("Este item não está na vitrine de hoje. Fique de olho na Lojinha!");
      return;
    }
    if (state.coins < item.unlock.cost) {
      showToast(`Faltam ${item.unlock.cost - state.coins} moedas. Ganhe mais nos exercícios e nas missões!`);
      return;
    }
    // Compra só depois de confirmar, pra ninguém gastar moedas sem querer.
    askToBuy(item, async () => {
      try {
        applyServerState(await api("POST", "/lojinha/compras", { id: item.id }));
      } catch (error) {
        showApiError(error);
        return;
      }
      showToast(`${item.name} comprado: −${item.unlock.cost} moedas.`);
      wearMascotItem(slot, id);
    });
    return;
  }

  wearMascotItem(slot, id);
}

// Na janela de compra, o botão Comprar fica travado por 3 s (a barrinha vai enchendo)
// antes de liberar, pra ninguém comprar sem querer. Cancelar funciona na hora.
const BUY_WAIT_MS = 3000;
let buyCountdown = null;

// Janela de compra (Modal do Bootstrap): o mascote já com o item, o preço e
// os botões Cancelar e Comprar. onConfirm só roda se a pessoa confirmar.
function askToBuy(item, onConfirm) {
  const coinsLeft = state.coins - item.unlock.cost;
  const text = `Depois da compra, você fica com ${coinsLeft} ${coinsLeft === 1 ? "moeda" : "moedas"}.`;
  if (!window.bootstrap) {
    if (window.confirm(`Comprar ${item.name}? ${text}`)) onConfirm();
    return;
  }
  // Mostra como o mascote do aluno fica com o item, igual na tela de Perfil.
  const look = lookWith(item.slot, item.id);
  const art = document.getElementById("buy-art");
  art.className = `buy-modal-art ${backdropClass(look)}`;
  art.innerHTML = mascotSvg(look, "full", "");
  document.getElementById("buy-title").textContent = item.name;
  document.getElementById("buy-text").textContent = text;
  const buyButton = document.getElementById("buy-ok");
  buyButton.innerHTML = `<span>Comprar <span class="buy-price">${icon("coin")} ${item.unlock.cost}</span></span>`;
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("buy-modal"));
  buyButton.onclick = () => {
    buyButton.disabled = true; // trava na hora: dois cliques rápidos não compram duas vezes
    modal.hide();
    onConfirm();
  };

  // Contagem: trava o botão e começa a barrinha do zero (tirar e pôr a classe
  // de novo faz a animação recomeçar, mesmo abrindo a janela várias vezes).
  clearTimeout(buyCountdown);
  buyButton.disabled = true;
  buyButton.classList.remove("is-waiting");
  void buyButton.offsetWidth;
  buyButton.classList.add("is-waiting");
  buyCountdown = setTimeout(() => {
    buyButton.disabled = false;
    buyButton.classList.remove("is-waiting");
  }, BUY_WAIT_MS);

  modal.show();
}

// Veste o item (já comprado) no mascote. O servidor confere se o item é do aluno.
async function wearMascotItem(slot, id) {
  const changed = state.mascot[slot] !== id;
  try {
    applyServerState(await api("PUT", "/mascote", { parte: MASCOT_SLOT_NAMES[slot], id_item: id }));
  } catch (error) {
    showApiError(error);
    return;
  }
  render();
  if (changed) playMascotReaction(); // roupa nova: "tive uma ideia!"
}

function chooseMascotTab(slot) {
  state.mascotTab = slot;
  render();
}

// Volta para o visual da logo (os itens comprados continuam do aluno).
async function resetMascotLook() {
  try {
    // Uma parte de cada vez (o servidor guarda uma peça por parte).
    for (const [slot, id] of Object.entries(DEFAULT_LOOK)) {
      applyServerState(await api("PUT", "/mascote", { parte: MASCOT_SLOT_NAMES[slot], id_item: id }));
    }
  } catch (error) {
    showApiError(error);
  }
  render();
  showToast("Visual da logo restaurado. Seus itens continuam guardados.");
}

// ----- Tela do editor -----

function renderMascotOption(item, slotInfo) {
  const isEquipped = state.mascot[item.slot] === item.id;
  const isOwned = isMascotItemOwned(item);

  // Etiqueta embaixo do nome: o que acontece ao tocar
  let status = `<small class="mascot-option-status">Usar</small>`;
  if (isEquipped) status = `<small class="mascot-option-status is-equipped">Em uso</small>`;
  else if (!isOwned && item.unlock.type !== "coins") status = `<small class="mascot-option-status">${icon("lock-fill")} ${unlockLabel(item)}</small>`;
  else if (!isOwned && !isInDailyShop(item)) status = `<small class="mascot-option-status">Fora da loja hoje</small>`;
  else if (!isOwned) status = `<small class="mascot-option-status is-price">${unlockLabel(item)}</small>`;

  // Miniatura: o mascote atual vestindo este item, sobre o fundo escolhido.
  const look = lookWith(item.slot, item.id);
  const preview = `<span class="mascot-option-art ${slotInfo.crop === "head" ? "is-head" : ""} ${backdropClass(look)}">${mascotSvg(look, slotInfo.crop, "")}</span>`;
  const check = isEquipped ? `<span class="mascot-option-check">${icon("check-lg")}</span>` : "";

  const classes = ["mascot-option"];
  if (isEquipped) classes.push("is-equipped");
  if (!isOwned) classes.push("is-locked");
  return `<button class="${classes.join(" ")}" type="button" data-action="mascot-item" data-slot="${item.slot}" data-item="${item.id}" aria-pressed="${isEquipped}">${check}${preview}<strong>${item.name}</strong>${status}</button>`;
}

function renderMascotEditor() {
  const slotInfo = MASCOT_SLOTS.find((slot) => slot.id === state.mascotTab);
  const tabs = MASCOT_SLOTS.map((slot) => {
    const isActive = slot.id === state.mascotTab;
    return `<button class="category-chip${isActive ? " is-active" : ""}" type="button" data-action="mascot-tab" data-slot="${slot.id}" aria-pressed="${isActive}">${slot.label}</button>`;
  }).join("");
  const options = MASCOT_ITEMS.filter((item) => item.slot === slotInfo.id).map((item) => renderMascotOption(item, slotInfo)).join("");
  const items = mascotItemsCount();

  return `
    <div class="wardrobe-heading">
      <button class="wardrobe-back" type="button" data-screen="profile" aria-label="Voltar para o Perfil" title="Voltar para o Perfil">${icon("arrow-left")}</button>
      <div><small>SEU PERSONAGEM</small><h2>Guarda-roupa</h2></div>
    </div>
    <div class="mascot-editor">
      <aside class="wardrobe-stage">
        <button class="wardrobe-stage-art ${backdropClass()}" type="button" data-action="mascot-react" aria-label="Tocar no mascote de ${escapeHtml(state.name)}">${mascotSvg(state.mascot, "full", "", { animated: true })}</button>
        <div class="wardrobe-stage-info">
          <strong>${escapeHtml(state.name)}</strong>
          <div class="wardrobe-progress">${progressBarHtml(items.owned, items.total, "Itens liberados")}<small>${items.owned} de ${items.total} itens</small></div>
          <span class="wardrobe-coins">${icon("coin")} ${state.coins} moedas</span>
          <button class="text-button" type="button" data-action="mascot-reset">${icon("arrow-counterclockwise")} Visual da logo</button>
        </div>
      </aside>
      <section class="mascot-wardrobe" aria-label="Guarda-roupa">
        <div class="dictionary-categories" role="group" aria-label="Partes do mascote">${tabs}</div>
        <div class="mascot-options">${options}</div>
        <p class="wardrobe-hint">${icon("bag-heart-fill")} Itens com preço só podem ser comprados no dia em que estão na <button class="text-button" type="button" data-screen="shop">vitrine da Lojinha</button>. Os com cadeado vêm de conquistas do Perfil.</p>
      </section>
    </div>
    <p class="demo-disclaimer">As moedas são do jogo: não há compras com dinheiro real.</p>`;
}
