// DESENHO DO MASCOTE
// O personagem da logo redesenhado em SVG, por partes, para poder trocar
// roupa e acessórios. Este arquivo só desenha: a lista de itens e as regras
// (o que é grátis, o que custa moedas) ficam em telas-mascote.js.
//
// Estilo da logo: personagem branco, sem contorno, com uma sombra azul
// escura deslocada para baixo e para a esquerda, sobre um fundo colorido.
// Coordenadas: a cabeça é um círculo com centro em (96, 46) e raio 41.

const MASCOT_INK = {
  skin: "#ffffff",
  shade: "#cfe0fb",   // sombreado azul-claro (roupa, braço, pescoço)
  shadow: "#0a2f86",  // sombra deslocada (usada com transparência)
  eye: "#0b3fae",
  mouth: "#0b4fc4",
  tongue: "#3b8cff",
  spark: "#f7c933",
  collar: "#1652c7",
};

const SHADOW_OFFSET = "translate(-4 5)";

const MASCOT_VIEWBOX = {
  full: "-14 -30 204 204", // corpo inteiro (com espaço para chapéus)
  head: "34 -20 124 112", // só a cabeça (miniaturas de chapéu e óculos)
  avatar: "24 -14 144 144", // cabeça e peito no centro (foto de perfil redonda)
};

// Cada SVG precisa de ids únicos (por causa da camiseta listrada).
let mascotDrawCount = 0;

// Desenha a sombra de uma parte: a mesma forma, toda escura e deslocada.
function withShadow(drawPart) {
  return `<g transform="${SHADOW_OFFSET}" opacity="0.32">${drawPart(MASCOT_INK.shadow, MASCOT_INK.shadow)}</g>${drawPart()}`;
}

// ----- Partes do corpo -----
// Cada parte recebe (cor, cor do sombreado). Sem cores, usa as cores normais.

function bodyShape(shirt, uid) {
  return (fill, shade) => {
    const isShadow = Boolean(fill);
    let bodyFill = fill || shirt.fill;
    let defs = "";
    if (!isShadow && shirt.design === "stripes") {
      defs = `<defs><pattern id="listras-${uid}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${shirt.fill}"/><rect width="12" height="5" fill="${shirt.stripe}"/></pattern></defs>`;
      bodyFill = `url(#listras-${uid})`;
    }
    // formato da logo, com a barriga do lado direito um pouco menos estufada
    const body = `<path d="M58 168 L57 114 Q59 99 76 94 Q98 88 120 94 Q141 100 148 116 Q153 135 154 168 Z" fill="${bodyFill}"/>`;
    if (isShadow) return body;
    // dobras de sombreado nas laterais, como na logo
    const folds = `<path d="M138 110 Q148 130 148 168 L140 168 Q139 136 133 116 Z" fill="${shade || MASCOT_INK.shade}" opacity="${shirt.fill === "#ffffff" ? 1 : 0.35}"/>
      <path d="M66 120 Q70 146 72 168 L62 168 L61 124 Z" fill="${shade || MASCOT_INK.shade}" opacity="${shirt.fill === "#ffffff" ? 1 : 0.35}"/>`;
    return defs + body + folds;
  };
}

function drawShirtDetails(shirt) {
  let hood = "";
  let extra = "";
  if (shirt.design === "hoodie") {
    hood = `<path d="M70 97 Q98 82 126 97 Q120 107 98 107 Q76 107 70 97 Z" fill="${shirt.trim}"/>`;
    extra = `<path d="M90 103 L88 124 M106 103 L108 124" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M80 168 L82 150 Q98 144 114 150 L116 168 Z" fill="${shirt.trim}" opacity="0.6"/>
      <text x="98" y="140" text-anchor="middle" font-family="Manrope, sans-serif" font-size="11" font-weight="800" fill="#ffffff">E</text>`;
  }
  if (shirt.design === "champion") {
    extra = `<text x="99" y="146" text-anchor="middle" font-family="Manrope, sans-serif" font-size="28" font-weight="800" fill="#ffffff">1</text>`;
  }
  const neck = `<path d="M82 94 Q98 105 114 94 Q98 87 82 94 Z" fill="${MASCOT_INK.shade}"/>`;
  const collar = `<path d="M80 93 Q98 110 116 93" fill="none" stroke="${shirt.design === "plain" && shirt.fill === "#ffffff" ? MASCOT_INK.collar : shirt.trim}" stroke-width="5.5" stroke-linecap="round"/>`;
  return hood + neck + collar + extra;
}

// Braço em duas partes: braço (ombro → cotovelo) e antebraço com a mão
// (cotovelo → mão), para o antebraço poder se mexer sozinho na "cutucada".
// Pose da logo: ombro (66,108) → cotovelo (28,132) → mão perto do rosto (48,72).
const ELBOW = "28 132";

function upperArmShape(shirt) {
  return (fill, shade) => {
    const skin = fill || MASCOT_INK.skin;
    const edge = shade || MASCOT_INK.shade;
    const sleeveColor = fill || (shirt.fill === "#ffffff" ? MASCOT_INK.skin : shirt.fill);
    return `<path d="M66 108 L28 132" fill="none" stroke="${edge}" stroke-width="24" stroke-linecap="round"/>
      <path d="M66 108 L28 132" fill="none" stroke="${skin}" stroke-width="19" stroke-linecap="round"/>
      <path d="M66 108 L47 120" fill="none" stroke="${edge}" stroke-width="24" stroke-linecap="round"/>
      <path d="M66 108 L47 120" fill="none" stroke="${sleeveColor}" stroke-width="19" stroke-linecap="round"/>`;
  };
}

function forearmShape(fill, shade) {
  const skin = fill || MASCOT_INK.skin;
  const edge = shade || MASCOT_INK.shade;
  return `<path d="M28 132 L48 72" fill="none" stroke="${edge}" stroke-width="24" stroke-linecap="round"/>
    <path d="M28 132 L48 72" fill="none" stroke="${skin}" stroke-width="19" stroke-linecap="round"/>`;
}

function headShape(fill) {
  return `<circle cx="96" cy="46" r="41" fill="${fill || MASCOT_INK.skin}"/>`;
}

function drawFace() {
  return `<ellipse cx="82" cy="43" rx="6" ry="7.4" fill="${MASCOT_INK.eye}"/>
    <ellipse cx="112" cy="42" rx="6" ry="7.4" fill="${MASCOT_INK.eye}"/>
    <circle cx="84" cy="39.6" r="2.1" fill="#ffffff"/>
    <circle cx="114" cy="38.6" r="2.1" fill="#ffffff"/>
    <path d="M82 58 Q98 64 114 55 Q112 74 98 75 Q84 75 82 58 Z" fill="${MASCOT_INK.mouth}"/>
    <path d="M89 70 Q98 64 107 69 Q103 75 98 75 Q93 75 89 70 Z" fill="${MASCOT_INK.tongue}"/>`;
}

// Mão fechada com o indicador apontando para a têmpora.
function fingerShape(fill, shade) {
  const skin = fill || MASCOT_INK.skin;
  const edge = shade || MASCOT_INK.shade;
  return `<path d="M52 62 L65 45" stroke="${edge}" stroke-width="10" stroke-linecap="round"/>
    <path d="M52 62 L65 45" stroke="${skin}" stroke-width="6.5" stroke-linecap="round"/>`;
}

function handShape(fill, shade) {
  const skin = fill || MASCOT_INK.skin;
  const edge = shade || MASCOT_INK.shade;
  return `<circle cx="47" cy="68" r="10.5" fill="${edge}"/>
    <circle cx="47.5" cy="67.5" r="8.8" fill="${skin}"/>
    ${fill ? "" : `<path d="M41 69 Q46 72 52 69" fill="none" stroke="${edge}" stroke-width="2" stroke-linecap="round"/>`}`;
}

function drawSparks() {
  return `<g stroke="${MASCOT_INK.spark}" stroke-width="5.5" stroke-linecap="round">
    <path d="M144 23 L155 12"/><path d="M148 37 L163 34"/><path d="M145 52 L158 58"/></g>`;
}

// ----- Acessórios (cores chapadas, sem contorno, como o resto) -----

// Cabeça: o topo da cabeça fica em y = 5.
function drawHeadItem(id) {
  if (id === "bone") {
    return `<path d="M57 32 Q57 -1 96 -2 Q135 -1 135 32 Q96 24 57 32 Z" fill="#1f6fb8"/>
      <path d="M70 12 Q96 2 122 12" fill="none" stroke="#3d8bfd" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <path d="M124 27 Q153 22 163 32 Q146 38 125 35 Z" fill="#14548e"/>
      <circle cx="96" cy="-1" r="3.6" fill="#14548e"/>`;
  }
  if (id === "laco") {
    return `<path d="M120 12 L102 0 L104 26 Z M120 12 L138 0 L136 26 Z" fill="#f07a68"/>
      <path d="M120 12 L106 5 L107 20 Z M120 12 L134 5 L133 20 Z" fill="#f59a8b"/>
      <circle cx="120" cy="13" r="5" fill="#d9604e"/>`;
  }
  if (id === "chapeu-festa") {
    return `<path d="M78 14 L100 -18 L117 10 Z" fill="#f7cd4d"/>
      <path d="M84 5 L110 -2 M91 -6 L105 -10" stroke="#f07a68" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="100" cy="-19" r="5" fill="#f07a68"/>`;
  }
  if (id === "tiara-flores") {
    const colors = ["#f07a68", "#2bbbb3", "#f7cd4d", "#f07a68", "#2bbbb3"];
    return [-150, -120, -90, -60, -30].map((angle, index) => {
      const x = 96 + 40 * Math.cos((angle * Math.PI) / 180);
      const y = 46 + 40 * Math.sin((angle * Math.PI) / 180);
      const petals = [0, 72, 144, 216, 288].map((petal) => {
        const px = x + 4.2 * Math.cos((petal * Math.PI) / 180);
        const py = y + 4.2 * Math.sin((petal * Math.PI) / 180);
        return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${colors[index]}"/>`;
      }).join("");
      return `${petals}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.5" fill="#ffffff"/>`;
    }).join("");
  }
  if (id === "coroa") {
    return `<path d="M71 15 L75 -11 L87 3 L96 -16 L105 3 L117 -11 L121 15 Q96 8 71 15 Z" fill="#f2c230"/>
      <path d="M73 12 Q96 6 119 12" fill="none" stroke="#d9a20f" stroke-width="3"/>
      <circle cx="96" cy="5" r="3.2" fill="#f07a68"/><circle cx="82" cy="8" r="2.4" fill="#2bbbb3"/><circle cx="110" cy="8" r="2.4" fill="#2bbbb3"/>`;
  }
  return "";
}

// Rosto: os olhos ficam em (82, 43) e (112, 42).
function drawFaceItem(id) {
  if (id === "oculos-redondos") {
    return `<g fill="none" stroke="#1d2f45" stroke-width="3" stroke-linecap="round">
      <circle cx="82" cy="43" r="11" fill="#ffffff" fill-opacity="0.2"/><circle cx="112" cy="42" r="11" fill="#ffffff" fill-opacity="0.2"/>
      <path d="M93 43 Q97 39 101 42"/><path d="M71 42 L57 38"/><path d="M123 41 L136 37"/></g>`;
  }
  if (id === "oculos-sol") {
    return `<g stroke="#1d2f45" stroke-width="2.5" stroke-linecap="round">
      <rect x="69" y="35" width="25" height="15" rx="6" fill="#1d2f45"/><rect x="100" y="34" width="25" height="15" rx="6" fill="#1d2f45"/>
      <path d="M94 41 Q97 38 100 40" fill="none"/><path d="M69 40 L57 37"/><path d="M125 39 L136 36"/></g>
      <path d="M73 39 L79 39 M104 38 L110 38" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`;
  }
  if (id === "bochechas") {
    return '<ellipse cx="72" cy="56" rx="7" ry="4" fill="#ff8fa3" opacity="0.65"/><ellipse cx="122" cy="54" rx="7" ry="4" fill="#ff8fa3" opacity="0.65"/>';
  }
  return "";
}

// Broche no peito, do lado direito da camiseta.
function drawChestItem(id) {
  if (!id) return "";
  const x = 125;
  const y = 125;
  let icon = "";
  if (id === "broche-sinal") icon = `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12">🤟</text>`;
  if (id === "estrela-coral") icon = `<path d="M${x} ${y - 7} L${x + 2.2} ${y - 2} L${x + 7} ${y - 1.8} L${x + 3.2} ${y + 1.8} L${x + 4.5} ${y + 7} L${x} ${y + 4.2} L${x - 4.5} ${y + 7} L${x - 3.2} ${y + 1.8} L${x - 7} ${y - 1.8} L${x - 2.2} ${y - 2} Z" fill="#f07a68"/>`;
  if (id === "flor-amarela") icon = [0, 72, 144, 216, 288].map((petal) => `<circle cx="${(x + 3.6 * Math.cos((petal * Math.PI) / 180)).toFixed(1)}" cy="${(y + 3.6 * Math.sin((petal * Math.PI) / 180)).toFixed(1)}" r="3" fill="#f7cd4d"/>`).join("") + `<circle cx="${x}" cy="${y}" r="2.2" fill="#f07a68"/>`;
  if (id === "folha-azul") icon = `<path d="M${x - 6} ${y + 5} Q${x - 6} ${y - 6} ${x + 6} ${y - 6} Q${x + 6} ${y + 5} ${x - 6} ${y + 5} Z" fill="#1f6fb8"/><path d="M${x - 5} ${y + 4} L${x + 4} ${y - 4}" stroke="#ffffff" stroke-width="1.2"/>`;
  return `<circle cx="${x - 1.5}" cy="${y + 2}" r="10.5" fill="${MASCOT_INK.shadow}" opacity="0.25"/><circle cx="${x}" cy="${y}" r="10.5" fill="#ffffff"/>${icon}`;
}

// ----- Item sozinho (vitrine da Lojinha) -----
// Cada peça desenhada sem o mascote, como um adesivo. O viewBox é o quadrado
// em volta da peça (nas coordenadas do mascote).
const ITEM_VIEWBOX = {
  "chapeu-festa": "72 -31 52 52",
  "tiara-flores": "50 -30 92 92",
  "oculos-sol": "46 -8 100 100",
};
const CHEST_ITEM_VIEWBOX = "109 109 32 32"; // o broche fica em (125, 125)

// Camiseta como ícone (num quadrado de 0 a 100), com a mesma sombra do mascote.
function shirtIconSvg(shirt) {
  mascotDrawCount += 1;
  const shape = (fill) => `<path d="M32 20 L44 14 Q50 22 56 14 L68 20 L84 36 L73 47 L66 41 L66 86 L34 86 L34 41 L27 47 L16 36 Z" fill="${fill}"/>`;
  let fill = shirt.fill;
  let defs = "";
  if (shirt.design === "stripes") {
    defs = `<defs><pattern id="listras-${mascotDrawCount}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${shirt.fill}"/><rect width="10" height="4" fill="${shirt.stripe}"/></pattern></defs>`;
    fill = `url(#listras-${mascotDrawCount})`;
  }
  return `<svg class="mascot-svg" viewBox="0 2 100 100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${defs}
    <g transform="${SHADOW_OFFSET}" opacity="0.32">${shape(MASCOT_INK.shadow)}</g>${shape(fill)}
    <path d="M44 14 Q50 22 56 14" fill="none" stroke="${shirt.trim}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

// Desenho de um item da loja sozinho. Fundo não tem desenho: a própria moldura mostra a cor.
function mascotItemSvg(item) {
  if (item.slot === "shirt") return shirtIconSvg(item);
  const drawings = { head: drawHeadItem, face: drawFaceItem, chest: drawChestItem };
  if (!drawings[item.slot]) return "";
  const viewBox = item.slot === "chest" ? CHEST_ITEM_VIEWBOX : ITEM_VIEWBOX[item.id] || MASCOT_VIEWBOX.head;
  return `<svg class="mascot-svg" viewBox="${viewBox}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${drawings[item.slot](item.id)}</svg>`;
}

// ----- Animação -----
// Feita com as animações do próprio SVG (<animateTransform>), sem biblioteca.
// O boneco fica sempre na pose da logo, "respirando" de leve. Ao vestir roupa
// nova (ou tocar no boneco do guarda-roupa) ele dá duas cutucadas na cabeça e
// os risquinhos amarelos "estalam". Só os mascotes grandes animam; com
// "animações reduzidas" ele fica parado.

const POKE = 'dur="0.8s" begin="indefinite" keyTimes="0;0.25;0.5;0.75;1" data-reaction="true"';

function isMotionAllowed() {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return state.motion !== "reduced" && !prefersReduced;
}

// Toca a cutucada em todos os mascotes animados da tela.
function playMascotReaction() {
  document.querySelectorAll('.mascot-svg [data-reaction="true"]').forEach((animation) => {
    if (typeof animation.beginElement === "function") animation.beginElement();
  });
}

// Braço na pose da logo. Na cutucada, o antebraço afasta a mão da cabeça e volta, duas vezes.
function drawArm(shirt, animated) {
  const poke = animated
    ? `<animateTransform attributeName="transform" type="rotate" values="0 ${ELBOW};-14 ${ELBOW};0 ${ELBOW};-14 ${ELBOW};0 ${ELBOW}" ${POKE}/>`
    : "";
  return `<g>
      ${withShadow(upperArmShape(shirt))}
      <g>${poke}
        ${withShadow(forearmShape)}
        ${withShadow(fingerShape)}
        ${withShadow(handShape)}
      </g>
    </g>`;
}

// Risquinhos amarelos: crescem a cada cutucada (em volta do meio deles).
function drawAnimatedSparks(animated) {
  const pop = animated
    ? `<animateTransform attributeName="transform" type="scale" values="1;1.35;1;1.35;1" ${POKE}/>`
    : "";
  return `<g transform="translate(152 35)"><g>${pop}<g transform="translate(-152 -35)">${drawSparks()}</g></g></g>`;
}

// ----- Montagem -----

// look = { shirt, head, face, chest } com os ids dos itens escolhidos.
// crop = "full" (corpo inteiro), "head" (só a cabeça) ou "avatar" (foto de perfil).
// options.animated: respira e dá a cutucada (só nos mascotes grandes).
function mascotSvg(look, crop = "full", label = "Mascote do EduSinal", options = {}) {
  const animated = Boolean(options.animated) && isMotionAllowed();
  mascotDrawCount += 1;
  const shirt = MASCOT_ITEMS.find((item) => item.id === look.shirt) || MASCOT_ITEMS.find((item) => item.id === DEFAULT_LOOK.shirt);
  const ariaLabel = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"';
  const breathe = animated ? '<animateTransform attributeName="transform" type="translate" values="0 0;0 1.6;0 0" dur="3.2s" repeatCount="indefinite"/>' : "";
  return `<svg class="mascot-svg" viewBox="${MASCOT_VIEWBOX[crop]}" ${ariaLabel} xmlns="http://www.w3.org/2000/svg"${animated ? ' data-animated="true"' : ""}>
    <g>${breathe}
      ${withShadow(bodyShape(shirt, mascotDrawCount))}
      ${drawShirtDetails(shirt)}
      ${drawChestItem(look.chest)}
      ${withShadow(headShape)}
      ${drawFace()}
      ${drawFaceItem(look.face)}
      ${drawHeadItem(look.head)}
      ${drawArm(shirt, animated)}
      ${drawAnimatedSparks(animated)}
    </g>
  </svg>`;
}
