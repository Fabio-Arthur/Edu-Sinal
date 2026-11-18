// DESENHO DO MASCOTE (Eduzinho 2.0)
// O Eduzinho em SVG, por partes, para poder trocar roupa e acessórios e fazer
// poses. Este arquivo só desenha: a lista de itens e as regras (o que é
// grátis, o que custa moedas) ficam em telas-mascote.js.
//
// Estilo: personagem branco com borda azul-clarinha e uma sombra azul escura
// deslocada para baixo e para a esquerda, sobre um fundo colorido.
// Coordenadas (desenho de 200 x 210): a cabeça é um círculo com centro em
// (100, 72) e raio 44, e o corpo vai até embaixo (y = 212).
//
// Poses: cada pose é uma classe no <svg>. O CSS (mascote.css) troca o rosto e
// os braços e faz o movimento.

const MASCOT_INK = {
  skin: "#ffffff",
  shade: "#cfe0fb",   // borda azul-clarinha (corpo, braços, mãos)
  shadow: "#0a2f86",  // sombra deslocada (usada com transparência)
  eye: "#0b3fae",
  mouth: "#0b4fc4",
  tongue: "#3b8cff",
  spark: "#f7c933",
  collar: "#1652c7",
};

const SHADOW_OFFSET = "translate(-4 5)";

const MASCOT_VIEWBOX = {
  full: "0 0 200 200",    // corpo inteiro (com espaço para chapéus)
  head: "34 -4 132 132",  // só a cabeça (miniaturas de chapéu e óculos)
  avatar: "23 8 154 154", // cabeça e ombros (foto de perfil redonda)
};

// [classe no <svg>, quanto tempo dura quando é uma reação]
const MASCOT_POSES = {
  waving: ["is-waving", 2100],                 // acenar: tocar no mascote, roupa nova, "me lembrei!"
  celebrating: ["is-celebrating", 1700],       // comemorar, com os risquinhos amarelos: acertou!
  sad: ["is-sad", 1800],                       // errou: sobrancelhas tristes, gotinha e o braço caído
  thinking: ["is-thinking", 4500],             // cutucando a cabeça: abrindo o app, esperando o servidor
  "thinking-chin": ["is-thinking-chin", 4500], // mão no queixo: login ("deixa eu ver se eu lembro de você")
};

// Cada SVG precisa de ids únicos (degradês, listras), senão um desenho
// pega emprestado o do outro.
let mascotDrawCount = 0;

// Desenha uma parte duas vezes: a sombra (escura e deslocada) e a parte normal.
function withShadow(drawPart) {
  return `<g transform="${SHADOW_OFFSET}" opacity="0.28">${drawPart(MASCOT_INK.shadow, MASCOT_INK.shadow)}</g>${drawPart()}`;
}

// ----- Braços e mãos -----

// Traço grosso com borda (braço, antebraço, manga).
function limb(x1, y1, x2, y2, fill, edge, width) {
  const d = `M${x1} ${y1} L${x2} ${y2}`;
  return `<path d="${d}" stroke="${edge}" stroke-width="${width + 5}" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${fill}" stroke-width="${width}" stroke-linecap="round"/>`;
}

// Mão aberta em leque, acenando: os dedos saem da palma redonda. Primeiro
// todas as bordas (dedos e palma), depois todo o branco por cima: assim a
// borda da palma e a dos dedos viram um contorno só.
function openHand(cx, cy, fill, edge) {
  const skin = fill || MASCOT_INK.skin;
  const border = edge || MASCOT_INK.shade;
  const point = (angle, size) => {
    const radians = (angle * Math.PI) / 180;
    return `${(cx + size * Math.sin(radians)).toFixed(1)} ${(cy - size * Math.cos(radians)).toFixed(1)}`;
  };
  // [ângulo, tamanho]: polegar, mínimo, anelar, médio (o maior), indicador
  const fingers = [[-100, 16], [52, 18], [22, 21.5], [-6, 23], [-34, 21.5]];
  const layer = (color, width, radius) => fingers.map(([angle, size]) =>
    `<path d="M${point(angle, 4)} L${point(angle, size)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`).join("") +
    `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
  return layer(border, 8.8, 11.2) + layer(skin, 5.8, 9.2);
}

// Mão apontando para a cabeça (o sinal de ENTENDER), no estilo do emoji 👈:
// palma, os três dedos dobrados empilhados, o polegar por cima deles e o
// indicador esticado. Bordas primeiro e o branco por cima (contorno só).
function pointingHand(fill, edge) {
  const skin = fill || MASCOT_INK.skin;
  const border = edge || MASCOT_INK.shade;
  const pieces = [ // [x, y, largura, altura]
    [-8, -8, 18, 21],                                       // palma
    [-13, 0, 11, 6], [-13, 5.5, 11, 6], [-12, 11, 10, 5.5], // dedos dobrados
    [-11, -2, 15, 5.5],                                     // polegar
    [-23, -8, 22, 7],                                       // indicador
  ];
  const layer = (color, stroke) => pieces.map(([x, y, width, height]) =>
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(width, height) / 2}" fill="${color}"${stroke ? ` stroke="${color}" stroke-width="4.4"` : ""}/>`).join("");
  const creases = fill ? "" : `<path d="M-9 3.6 L2 3.6 M-12 5.6 L-7 5.6 M-11.5 11.1 L-7 11.1" stroke="${border}" stroke-width="1.6" stroke-linecap="round"/>`;
  return `<g transform="translate(157 84) rotate(20)">${layer(border, true)}${layer(skin, false)}${creases}</g>`;
}

// Mão fechada com os dedinhos dobrados (pose da mão no queixo).
function fist(cx, cy, fill, edge) {
  const fingers = fill ? "" : `<path d="M${cx + 3} ${cy - 6} Q${cx + 7} ${cy - 4} ${cx + 4} ${cy - 1} M${cx + 4} ${cy} Q${cx + 8} ${cy + 2} ${cx + 4} ${cy + 5}" fill="none" stroke="${MASCOT_INK.shade}" stroke-width="1.8" stroke-linecap="round"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="11" fill="${edge || MASCOT_INK.shade}"/><circle cx="${cx}" cy="${cy}" r="9" fill="${fill || MASCOT_INK.skin}"/>${fingers}`;
}

// Os braços. O braço parado fica junto do corpo, atrás dele; o outro acena.
// withPoses: desenha também os braços das poses de pensar (só nos mascotes
// grandes; as miniaturas não precisam).
function drawArms(shirt, withPoses) {
  const isTank = shirt.design === "tank";
  const sleeve = shirt.fill === MASCOT_INK.skin || isTank ? MASCOT_INK.skin : shirt.fill;
  const sleeveEdge = sleeve === MASCOT_INK.skin ? MASCOT_INK.shade : shirt.trim;
  const arm = (x1, y1, x2, y2, width) => (fill, edge) => limb(x1, y1, x2, y2, fill || MASCOT_INK.skin, edge || MASCOT_INK.shade, width);
  // Braço com manga e a barrinha da manga (cuff). A regata não tem manga.
  const armWithSleeve = (x1, y1, x2, y2, sleeveEnd, cuff) => (fill, edge) => {
    const bare = arm(x1, y1, x2, y2, 18)(fill, edge);
    if (isTank) return bare;
    const cuffLine = fill ? "" : `<path d="${cuff}" stroke="${sleeveEdge}" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>`;
    return bare + limb(x1, y1, sleeveEnd[0], sleeveEnd[1], fill || sleeve, edge || sleeveEdge, 19) + cuffLine;
  };

  const restingArm = armWithSleeve(64, 140, 58, 206, [62, 160], "M54.3 156.2 L70.3 157.8");
  // Braço que acena: a parte de cima (com manga) fica parada; o antebraço e a mão balançam.
  const upperArm = armWithSleeve(132, 137, 160, 150, [146, 143], "M140 149.2 L146.4 134.4");
  const forearm = (fill, edge) => arm(161, 150, 167, 106, 16)(fill, edge) + openHand(168, 96, fill, edge);
  const resting = `<g class="arm-rest">${withShadow(restingArm)}</g>`;
  let waving = `${withShadow(upperArm)}<g class="arm-wave">${withShadow(forearm)}</g>`;
  if (!withPoses) return { resting, waving: `<g class="arm-upper">${waving}</g>`, chin: "" };

  // "Pensar": o antebraço sobe até a cabeça e o indicador aponta para ela.
  const thinkingForearm = (fill, edge) => arm(161, 150, 157, 92, 16)(fill, edge) + pointingHand(fill, edge);
  waving += `<g class="arm-think">${withShadow(thinkingForearm)}</g>`;
  // "Pensar (queixo)": o braço desce pela lateral do corpo e só o antebraço
  // sobe pela frente; a mão fechada segura o queixo, com o indicador por baixo.
  const chinArm = armWithSleeve(132, 137, 138, 166, [135, 151.7], "M126.6 150.4 L142.2 147.2");
  const chinForearm = (fill, edge) => arm(138, 166, 124, 127, 16)(fill, edge) +
    `<path d="M113 118 L102 117" stroke="${edge || MASCOT_INK.shade}" stroke-width="9" stroke-linecap="round"/>` +
    fist(119, 122, fill, edge) +
    `<path d="M113 118 L102 117" stroke="${fill || MASCOT_INK.skin}" stroke-width="6" stroke-linecap="round"/>`;
  const chin = `<g class="arm-chin">${withShadow(chinArm)}<g class="chin-forearm">${withShadow(chinForearm)}</g></g>`;
  return { resting, waving: `<g class="arm-upper">${waving}</g>`, chin };
}

// ----- Corpo e camiseta -----

const BODY = "M58 212 L59 152 Q61 128 82 122 Q100 117 118 122 Q139 128 141 152 L142 212 Z";

function bodyShape(shirt, uid) {
  return (fill) => {
    if (fill) return `<path d="${BODY}" fill="${fill}"/>`;
    let paint = shirt.fill;
    let defs = "";
    if (shirt.stripe) {
      defs = `<defs><pattern id="listras-${uid}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${shirt.fill}"/><rect width="12" height="5" fill="${shirt.stripe}"/></pattern></defs>`;
      paint = `url(#listras-${uid})`;
    }
    // Borda do tronco: a mesma dos braços (azul-clarinho na roupa branca, a
    // cor da gola nas coloridas). Só nas laterais e nos ombros: no pescoço
    // quem fecha é a gola, senão aparece uma linha dupla.
    const border = shirt.fill === MASCOT_INK.skin && !shirt.stripe ? MASCOT_INK.shade : shirt.trim;
    const sides = "M58 212 L59 152 Q61 128 82 122 M118 122 Q139 128 141 152 L142 212";
    return `${defs}<path d="${BODY}" fill="${paint}"/>
      <path d="${sides}" fill="none" stroke="${border}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${shirtPrint(shirt.id)}`;
  };
}

// Estampas: cada camiseta tem a sua, num lugar diferente, com costura
// pontilhada. O broche fica no alto do peito, do lado do braço que acena; as
// estampas não encostam nele.
function shirtPrint(id) {
  const stitch = 'fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.4 2.2" stroke-linecap="round" opacity="0.75"';
  if (id === "camiseta-azul") {
    // Patch costurado no peito (como escudo de uniforme), com a mãozinha aberta.
    const cx = 83;
    const cy = 160;
    const fingers = [[-100, 7], [-44, 8.2], [-14, 9.4], [16, 9], [46, 7.4]];
    const layer = (color, width, radius) => fingers.map(([angle, size]) => {
      const r = (angle * Math.PI) / 180;
      return `<path d="M${cx} ${cy} L${(cx + size * Math.sin(r)).toFixed(1)} ${(cy - size * Math.cos(r)).toFixed(1)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
    }).join("") + `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${color}"/>`;
    return `<rect x="70" y="144" width="26" height="26" rx="7.5" fill="#2a63c9" stroke="#1652c7" stroke-width="1.6"/>
      <rect x="72.6" y="146.6" width="20.8" height="20.8" rx="5.5" ${stitch}/>
      ${layer("#1652c7", 4.8, 5.2)}${layer("#fff", 2.8, 4)}`;
  }
  if (id === "camiseta-turquesa") {
    // Faixa de mar na barra, com ondinhas e bolhinhas subindo.
    return `<path d="M61 192 q6.5 -5 13 0 t13 0 t13 0 t13 0 t13 0 t13 0 L140 212 L61 212 Z" fill="#1f9a93"/>
      <path d="M61 192 q6.5 -5 13 0 t13 0 t13 0 t13 0 t13 0 t13 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M66 202 q6.5 -4 13 0 t13 0 t13 0 t13 0 t13 0 t13 0" fill="none" stroke="#7fdcd5" stroke-width="1.8" stroke-linecap="round"/>
      <g fill="none" stroke="#fff" stroke-width="1.3"><circle cx="82" cy="181" r="2.4"/><circle cx="88" cy="174" r="1.6"/><circle cx="118" cy="179" r="2"/><circle cx="112" cy="172" r="1.3"/></g>`;
  }
  if (id === "camiseta-coral") {
    // Bolsinho no peito (do lado do braço parado) com um coração espiando.
    const x = 81;
    const y = 150;
    const heart = `<path d="M${x} ${y + 6} C${x - 8} ${y + 1} ${x - 9} ${y - 5} ${x - 4.5} ${y - 7} C${x - 2} ${y - 8} ${x} ${y - 6} ${x} ${y - 4} C${x} ${y - 6} ${x + 2} ${y - 8} ${x + 4.5} ${y - 7} C${x + 9} ${y - 5} ${x + 8} ${y + 1} ${x} ${y + 6} Z" fill="#fff" stroke="#b84a3a" stroke-width="1.3" stroke-linejoin="round"/>`;
    return `${heart}
      <path d="M69 152 L93 152 L93 168 Q93 175 86 175 L76 175 Q69 175 69 168 Z" fill="#e2614e" stroke="#b84a3a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M72 156 L90 156 L90 167 Q90 172 85 172 L77 172 Q72 172 72 167 Z" ${stitch}/>`;
  }
  if (id === "camiseta-amarela") {
    // Solzinho sorridente no meio do peito, com raios grandes e pequenos.
    const x = 100;
    const y = 182;
    const rays = Array.from({ length: 12 }, (_, index) => {
      const r = ((index * 30 - 90) * Math.PI) / 180;
      const point = (radius) => `${(x + radius * Math.cos(r)).toFixed(1)} ${(y + radius * Math.sin(r)).toFixed(1)}`;
      return `M${point(12.5)} L${point(index % 2 ? 15.5 : 18)}`;
    }).join(" ");
    return `<path d="${rays}" stroke="#e08a12" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="${x}" cy="${y}" r="10" fill="#f39c1f" stroke="#c4740c" stroke-width="1.6"/>
      <circle cx="${x - 3.5}" cy="${y - 1.5}" r="1.2" fill="#7a4306"/><circle cx="${x + 3.5}" cy="${y - 1.5}" r="1.2" fill="#7a4306"/>
      <path d="M${x - 3.5} ${y + 2.5} Q${x} ${y + 5.5} ${x + 3.5} ${y + 2.5}" fill="none" stroke="#7a4306" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="${x - 6}" cy="${y + 2.5}" rx="1.8" ry="1.1" fill="#ff8f6b" opacity="0.7"/><ellipse cx="${x + 6}" cy="${y + 2.5}" rx="1.8" ry="1.1" fill="#ff8f6b" opacity="0.7"/>`;
  }
  return "";
}

// Pescoço, gola e os detalhes do moletom e da camisa de campeão.
function drawShirtDetails(shirt) {
  const neck = `<path d="M84 122 Q100 132 116 122 Q100 116 84 122 Z" fill="${MASCOT_INK.shade}"/>`;
  const collarColor = shirt.design === "plain" && shirt.fill === MASCOT_INK.skin ? MASCOT_INK.collar : shirt.trim;
  const collar = `<path d="M83 121 Q100 136 117 121" fill="none" stroke="${collarColor}" stroke-width="5.5" stroke-linecap="round"/>`;
  if (shirt.design === "hoodie") {
    // Capuz caído atrás do pescoço, cordões com ponteira, bolso canguru com
    // costura pontilhada e o "E" num selo.
    return `<path d="M72 125 Q100 106 128 125 Q119 136 100 136 Q81 136 72 125 Z" fill="${shirt.trim}" stroke="#0f2340" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M93 134 L91 157 M107 134 L109 157" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="88.6" y="156" width="4.8" height="6" rx="1.6" fill="#d9e4f2"/><rect x="106.6" y="156" width="4.8" height="6" rx="1.6" fill="#d9e4f2"/>
      <path d="M78 212 L82 190 Q100 184 118 190 L122 212 Z" fill="${shirt.trim}" opacity="0.55"/>
      <path d="M84.5 192.5 Q100 187.5 115.5 192.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.5 2.5" opacity="0.45"/>
      <rect x="90" y="164" width="20" height="18" rx="5" fill="#fff" fill-opacity="0.14" stroke="#fff" stroke-opacity="0.5" stroke-width="1.2"/>
      <text x="100" y="178" text-anchor="middle" font-family="Manrope, sans-serif" font-size="13" font-weight="800" fill="#fff">E</text>
      ${neck}${collar}`;
  }
  if (shirt.design === "champion") {
    // Camisa de time: faixas nas laterais, estrela e o número com contorno.
    const star = Array.from({ length: 10 }, (_, index) => {
      const r = ((-90 + index * 36) * Math.PI) / 180;
      const size = index % 2 ? 2.4 : 5.6;
      return `${(100 + size * Math.cos(r)).toFixed(1)} ${(152 + size * Math.sin(r)).toFixed(1)}`;
    }).join(" L");
    return `${neck}${collar}
      <path d="M67 140 L65 212 M133 140 L135 212" stroke="${shirt.trim}" stroke-width="3" opacity="0.5"/>
      <path d="M${star} Z" fill="#fff" stroke="${shirt.trim}" stroke-width="1.2" stroke-linejoin="round"/>
      <text x="100" y="190" text-anchor="middle" font-family="Manrope, sans-serif" font-size="34" font-weight="800" fill="#fff" stroke="${shirt.trim}" stroke-width="2" paint-order="stroke">1</text>`;
  }
  return neck + collar;
}

// ----- Rosto -----
// Cada pose mostra uma expressão: o CSS escolhe quais peças aparecem.
function drawFace() {
  const eye = MASCOT_INK.eye;
  return `<path class="brows-normal" d="M76 55 Q84 50 92 54 M108 54 Q116 50 124 55" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>
    <path class="brows-sad" d="M76 56 Q84 55 91 49 M109 49 Q116 55 124 56" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>
    <path class="brows-think" d="M76 55 Q84 50 92 54 M108 50 Q116 43 124 48" fill="none" stroke="${eye}" stroke-width="3" stroke-linecap="round"/>
    <g class="eyes">
      <g class="eye-l"><ellipse cx="84" cy="68" rx="7.2" ry="8.8" fill="${eye}"/><circle cx="86.6" cy="64.4" r="2.7" fill="#fff"/></g>
      <g class="eye-r"><ellipse cx="116" cy="68" rx="7.2" ry="8.8" fill="${eye}"/><circle cx="118.6" cy="64.4" r="2.7" fill="#fff"/></g>
    </g>
    <path class="wink-r" d="M109 70 Q116 62 123 70" fill="none" stroke="${eye}" stroke-width="4" stroke-linecap="round"/>
    <path class="eyes-happy" d="M77 70 Q84 61 91 70 M109 70 Q116 61 123 70" fill="none" stroke="${eye}" stroke-width="4" stroke-linecap="round"/>
    <g class="mouth-happy">
      <path d="M86 86 Q100 92 114 86 Q112 102 100 103 Q88 103 86 86 Z" fill="${MASCOT_INK.mouth}"/>
      <path d="M92 98 Q100 93 108 98 Q104 103 100 103 Q96 103 92 98 Z" fill="${MASCOT_INK.tongue}"/>
    </g>
    <g class="mouth-grin">
      <path d="M81 84 Q100 92 119 84 Q117 107 100 108 Q83 107 81 84 Z" fill="${MASCOT_INK.mouth}"/>
      <path d="M89 101 Q100 94 111 101 Q106 108 100 108 Q94 108 89 101 Z" fill="${MASCOT_INK.tongue}"/>
    </g>
    <path class="mouth-sad" d="M89 97 Q100 89 111 97" fill="none" stroke="${MASCOT_INK.mouth}" stroke-width="4" stroke-linecap="round"/>
    <path class="mouth-hmm" d="M92 93 Q97 89.5 102 93 Q107 96.5 112 93" fill="none" stroke="${MASCOT_INK.mouth}" stroke-width="4" stroke-linecap="round"/>`;
}

// Gotinha de suor do "errou". Desenhada depois dos óculos e dos chapéus,
// para ficar por cima de qualquer item.
function drawSweatDrop() {
  return `<g class="drop">
    <path d="M138 43 C138 43 129 55 129 60 A9 9 0 0 0 147 60 C147 55 138 43 138 43 Z" fill="#7cc3ff" stroke="#1f6fb8" stroke-width="2.2" stroke-linejoin="round"/>
    <ellipse cx="134.5" cy="60" rx="1.8" ry="3" fill="#fff" opacity="0.85"/></g>`;
}

// Risquinhos amarelos da logo: são a recompensa, só aparecem quando ele comemora.
function drawSparks() {
  return `<g class="sparks" stroke="${MASCOT_INK.spark}" stroke-width="5.5" stroke-linecap="round">
    <path d="M48 42 L38 32"/><path d="M44 57 L30 55"/><path d="M47 71 L35 77"/></g>`;
}

function drawConfetti() {
  const pieces = [
    [40, 30, "#f7c933", 0], [70, 18, "#ee7967", 0.1], [130, 20, "#19a7a1", 0.05], [160, 34, "#f7c933", 0.15],
    [100, 12, "#ee7967", 0.2], [55, 55, "#19a7a1", 0.25], [150, 60, "#ffffff", 0.3], [115, 40, "#f7c933", 0.35],
  ];
  return `<g class="confetti">${pieces.map(([x, y, color, delay], index) => index % 2
    ? `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}" style="--d:${delay}s"/>`
    : `<rect x="${x}" y="${y}" width="6" height="9" rx="1.5" fill="${color}" style="--d:${delay}s"/>`).join("")}</g>`;
}

// ----- Acessórios (cada um com borda, no mesmo estilo do corpo) -----

// Cabeça: o topo da cabeça fica em y = 28.
function drawHeadItem(id, uid) {
  const line = 'stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
  if (id === "bone") {
    // Boné de lado: a aba fininha sai reta pro lado, atrás da copa.
    return `<path d="M138 51 L157 51 Q165 51.5 165 55 Q164.5 58.5 157 58.5 L143 58 Z" fill="#14548e" stroke="#0d3a66" ${line}/>
      <path d="M147 54.5 L158 54.5" fill="none" stroke="#3d8bfd" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      <path d="M57 58 C57 31 76 21 100 21 C124 21 143 31 143 58 Q100 38 57 58 Z" fill="#1f6fb8" stroke="#14548e" ${line}/>
      <path d="M100 22 L100 43 M80 26 Q75 38 76 50 M120 26 Q125 38 124 50" fill="none" stroke="#3d8bfd" stroke-width="2" stroke-linecap="round"/>
      <path d="M70 34 Q80 26 92 25" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.35"/>
      <circle cx="100" cy="21" r="3.8" fill="#14548e" stroke="#0d3a66" stroke-width="1.6"/>`;
  }
  if (id === "laco") {
    return `<g transform="rotate(28 124 33)">
      <path d="M124 33 C114 20 101 22 103 33 C101 44 114 46 124 33 Z" fill="#f07a68" stroke="#b84a3a" ${line}/>
      <path d="M124 33 C134 20 147 22 145 33 C147 44 134 46 124 33 Z" fill="#f07a68" stroke="#b84a3a" ${line}/>
      <path d="M109 30 Q114 33 119 33 M139 30 Q134 33 129 33" fill="none" stroke="#f59a8b" stroke-width="2" stroke-linecap="round"/>
      <circle cx="124" cy="33" r="5.2" fill="#e8604c" stroke="#b84a3a" stroke-width="2.2"/></g>`;
  }
  if (id === "chapeu-festa") {
    const cone = "M83 33 Q100 37 119 31 L105 8 Z";
    return `<defs><clipPath id="cone-${uid}"><path d="${cone}"/></clipPath></defs>
      <path d="${cone}" fill="#f7cd4d"/>
      <g clip-path="url(#cone-${uid})" stroke-width="4.5"><path d="M80 26 L124 18" stroke="#f07a68"/><path d="M84 18 L124 10" stroke="#2bbbb3"/></g>
      <path d="${cone}" fill="none" stroke="#b58a12" ${line}/>
      <circle cx="105" cy="7" r="4.6" fill="#f07a68" stroke="#b84a3a" stroke-width="2"/>`;
  }
  if (id === "tiara-flores") {
    const colors = [["#f07a68", "#b84a3a"], ["#f7cd4d", "#b58a12"], ["#2bbbb3", "#137a75"], ["#f7cd4d", "#b58a12"], ["#f07a68", "#b84a3a"]];
    const flowers = [-150, -120, -90, -60, -30].map((angle, index) => {
      const radians = (angle * Math.PI) / 180;
      const x = 100 + 43 * Math.cos(radians);
      const y = 72 + 43 * Math.sin(radians);
      const [fill, edge] = colors[index];
      const petals = [0, 72, 144, 216, 288].map((petal) => {
        const r = ((petal + angle) * Math.PI) / 180;
        return `<circle cx="${(x + 4.4 * Math.cos(r)).toFixed(1)}" cy="${(y + 4.4 * Math.sin(r)).toFixed(1)}" r="3.6" fill="${fill}" stroke="${edge}" stroke-width="1.4"/>`;
      }).join("");
      return `${petals}<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#fff" stroke="${edge}" stroke-width="1.2"/>`;
    }).join("");
    return `<path d="M60 50 A44 44 0 0 1 140 50" fill="none" stroke="#137a75" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M60 50 A44 44 0 0 1 140 50" fill="none" stroke="#2bbbb3" stroke-width="2.6" stroke-linecap="round"/>${flowers}`;
  }
  if (id === "coroa") {
    return `<path d="M73 37 L71 11 L86 23 L100 5 L114 23 L129 11 L127 37 Q100 29 73 37 Z" fill="#f2c230" stroke="#b8860b" ${line}/>
      <path d="M74 31 Q100 24 126 31" fill="none" stroke="#d9a20f" stroke-width="3"/>
      <path d="M78 22 L80 30" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
      <circle cx="71" cy="11" r="3" fill="#2bbbb3" stroke="#137a75" stroke-width="1.4"/>
      <circle cx="100" cy="5" r="3.4" fill="#f07a68" stroke="#b84a3a" stroke-width="1.4"/>
      <circle cx="129" cy="11" r="3" fill="#2bbbb3" stroke="#137a75" stroke-width="1.4"/>
      <circle cx="100" cy="27" r="3.4" fill="#f07a68" stroke="#b84a3a" stroke-width="1.4"/>
      <circle cx="86" cy="29" r="2.5" fill="#2bbbb3" stroke="#137a75" stroke-width="1.2"/>
      <circle cx="114" cy="29" r="2.5" fill="#2bbbb3" stroke="#137a75" stroke-width="1.2"/>`;
  }
  return "";
}

// Rosto: os olhos ficam em (84, 68) e (116, 68).
function drawFaceItem(id, uid) {
  if (id === "oculos-redondos") {
    const lens = (x) => `<circle cx="${x}" cy="68" r="12.5" fill="#fff" fill-opacity="0.18" stroke="#1d2f45" stroke-width="3"/>
      <circle cx="${x}" cy="68" r="10.6" fill="none" stroke="#4f6b8f" stroke-width="1" opacity="0.6"/>
      <path d="M${x - 7} 64 L${x - 3} 60" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity="0.85"/>
      <circle cx="${x - 1.5}" cy="58.5" r="1" fill="#fff" opacity="0.85"/>`;
    return `${lens(84)}${lens(116)}
      <path d="M96.5 66 Q100 62.5 103.5 66" fill="none" stroke="#1d2f45" stroke-width="3" stroke-linecap="round"/>
      <path d="M71.5 65 L57 61 M128.5 65 L143 61" stroke="#1d2f45" stroke-width="3" stroke-linecap="round"/>
      <circle cx="71.8" cy="64.6" r="1.8" fill="#f2c230" stroke="#b8860b" stroke-width="0.8"/>
      <circle cx="128.2" cy="64.6" r="1.8" fill="#f2c230" stroke="#b8860b" stroke-width="0.8"/>`;
  }
  if (id === "oculos-sol") {
    const left = "M70 61 Q70 58 74 58 L94 58 Q98 58 97 62 L95 72 Q94 78 87 78 L79 78 Q71 78 70 71 Z";
    const right = "M130 61 Q130 58 126 58 L106 58 Q102 58 103 62 L105 72 Q106 78 113 78 L121 78 Q129 78 130 71 Z";
    return `<defs><linearGradient id="lente-sol-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#22355c"/><stop offset="1" stop-color="#6a4f9e"/></linearGradient></defs>
      <path d="M70 62 L57 60 M130 62 L143 60" stroke="#0f1c2b" stroke-width="2.8" stroke-linecap="round"/>
      <path d="${left}" fill="url(#lente-sol-${uid})" stroke="#0f1c2b" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="${right}" fill="url(#lente-sol-${uid})" stroke="#0f1c2b" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M97 61 Q100 58.5 103 61" fill="none" stroke="#0f1c2b" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M74 62 L80 72 M79 61 L82 66 M106 62 L112 72 M111 61 L114 66" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <path d="M73 58.6 L92 58.6 M108 58.6 L127 58.6" stroke="#f2c230" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  if (id === "bochechas") {
    // Bochechas rosadas com sardinhas (o rosado no rosto é só deste item).
    const cheek = (x) => `<ellipse cx="${x}" cy="84" rx="8" ry="4.8" fill="#ff8fa3" opacity="0.55"/>
      <g fill="#c9706a"><circle cx="${x - 4}" cy="82.5" r="1.2" opacity="0.85"/><circle cx="${x}" cy="81" r="1.2" opacity="0.85"/><circle cx="${x + 4}" cy="82.5" r="1.2" opacity="0.85"/>
      <circle cx="${x - 2}" cy="85.5" r="1" opacity="0.7"/><circle cx="${x + 2.5}" cy="85.5" r="1" opacity="0.7"/></g>`;
    return cheek(71) + cheek(129);
  }
  return "";
}

// Broches: no alto do peito, do lado do braço que acena, sem encostar nele
// nem quando ele baixa. Desenhados em (x, y) e depois diminuídos.
const CHEST_SPOT = { x: 118, y: 156 };
const CHEST_SCALE = 0.68;

function drawChestItem(id) {
  if (!id) return "";
  const { x, y } = CHEST_SPOT;
  return `<g transform="translate(${x} ${y}) scale(${CHEST_SCALE}) translate(${-x} ${-y})">${chestDrawing(id, x, y)}</g>`;
}

function chestDrawing(id, x, y) {
  const line = 'stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  const at = (angle, radius) => {
    const r = (angle * Math.PI) / 180;
    return [(x + radius * Math.cos(r)).toFixed(1), (y + radius * Math.sin(r)).toFixed(1)];
  };
  if (id === "broche-sinal") {
    // Botton azul com uma mãozinha aberta (a cara do EduSinal).
    const fingers = [[-100, 6.2], [-48, 7.5], [-16, 8.2], [16, 8], [48, 7]].map(([angle, size]) => {
      const r = (angle * Math.PI) / 180;
      return `<path d="M${x} ${y + 2} L${(x + size * Math.sin(r)).toFixed(1)} ${(y + 2 - size * Math.cos(r)).toFixed(1)}" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`;
    }).join("");
    return `<circle cx="${x}" cy="${y}" r="11" fill="#1f6fb8" stroke="#14548e" ${line}/>
      ${fingers}<circle cx="${x}" cy="${y + 3}" r="3.4" fill="#fff"/>
      <path d="M${x - 7} ${y - 4} Q${x - 6} ${y - 7} ${x - 3} ${y - 8}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.5"/>`;
  }
  if (id === "estrela-coral") {
    const points = Array.from({ length: 10 }, (_, index) => at(-90 + index * 36, index % 2 ? 5.2 : 11.5).join(" ")).join(" L");
    return `<path d="M${points} Z" fill="#f07a68" stroke="#b84a3a" ${line}/>
      <path d="M${x - 2} ${y - 5} L${x - 0.5} ${y - 8}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>`;
  }
  if (id === "flor-amarela") {
    const petals = [-90, -18, 54, 126, 198].map((angle) => {
      const [px, py] = at(angle, 5.6);
      return `<circle cx="${px}" cy="${py}" r="4.6" fill="#f7cd4d" stroke="#b58a12" stroke-width="1.8"/>`;
    }).join("");
    return `${petals}<circle cx="${x}" cy="${y}" r="3.6" fill="#f07a68" stroke="#b84a3a" stroke-width="1.6"/>
      <circle cx="${x - 1.2}" cy="${y - 1.2}" r="0.9" fill="#fff" opacity="0.8"/>`;
  }
  if (id === "folha-azul") {
    return `<path d="M${x - 9} ${y + 9} L${x - 11} ${y + 11.5}" stroke="#14548e" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M${x - 9} ${y + 9} C${x - 9} ${y - 3} ${x - 2} ${y - 9} ${x + 10} ${y - 9} C${x + 10} ${y + 3} ${x + 3} ${y + 9} ${x - 9} ${y + 9} Z" fill="#1f6fb8" stroke="#14548e" ${line}/>
      <path d="M${x - 7} ${y + 7} L${x + 7} ${y - 7} M${x - 1} ${y + 1} L${x - 1} ${y - 4} M${x + 2} ${y - 2} L${x + 6} ${y - 2}" stroke="#7fb3ec" stroke-width="1.4" stroke-linecap="round"/>`;
  }
  return "";
}

// ----- Fundos desenhados -----
// Só nos mascotes grandes: ficam atrás dele, dentro do próprio desenho, e
// passam da borda (o quadro em volta corta). Nas miniaturas (ranking,
// guarda-roupa) o fundo é só a cor, feita no CSS (mascote.css).
function drawBackground(id, uid) {
  if (id === "fundo-ceu") return skyClouds(uid);
  if (id === "fundo-mar") return seaWaves(uid);
  if (id === "fundo-por-do-sol") return autumnForest(uid);
  if (id === "fundo-sol") return morningSun(uid);
  return signsPattern(uid); // "Azul da logo"
}

// Azul da logo: o azul de sempre com formas de mão de Libras espalhadas,
// bem clarinhas. Cada dedo é [ângulo, tamanho]; tamanho 3 = dedo dobrado.
// (O fundo das telas do app usa as mesmas mãos: assets/images/fundo-sinais.svg.)
const HANDSHAPES = {
  aberta: { fingers: [[-14, 13], [-4, 15], [6, 14], [16, 11]], thumb: [-72, 10] },
  v: { fingers: [[-16, 14], [10, 14], [0, 3], [0, 3]], thumb: null },
  l: { fingers: [[0, 14], [0, 3], [0, 3], [0, 3]], thumb: [-82, 11] },
  y: { fingers: [[0, 3], [0, 3], [0, 3], [26, 11]], thumb: [-76, 11] },
  euTeAmo: { fingers: [[-6, 14], [0, 3], [0, 3], [22, 11]], thumb: [-76, 11] },
  indicador: { fingers: [[0, 14], [0, 3], [0, 3], [0, 3]], thumb: null },
  fechada: { fingers: [[0, 3], [0, 3], [0, 3], [0, 3]], thumb: [-8, 7] },
};

function handshape(name, color) {
  const { fingers, thumb } = HANDSHAPES[name];
  const stroke = (x, y, angle, size) => {
    const r = (angle * Math.PI) / 180;
    return `<path d="M${x} ${y} L${(x + size * Math.sin(r)).toFixed(1)} ${(y - size * Math.cos(r)).toFixed(1)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
  };
  const bases = [-5, -1.7, 1.7, 5]; // do indicador ao mínimo, no alto da palma
  return fingers.map(([angle, size], index) => stroke(bases[index], -5, angle, size)).join("") +
    (thumb ? stroke(-6.5, 1, thumb[0], thumb[1]) : "") +
    `<rect x="-7.5" y="-7" width="15" height="15" rx="5.5" fill="${color}"/>`;
}

function signsPattern(uid) {
  const names = Object.keys(HANDSHAPES);
  let hands = "";
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const place = `translate(${col * 44 - 12 + (row % 2) * 22} ${row * 36 + 6}) rotate(${(((row * 5 + col * 7) % 5) - 2) * 14}) scale(${0.85 + ((row + col) % 3) * 0.1})`;
      hands += `<g transform="${place}">${handshape(names[(row * 3 + col) % names.length], "#fff")}</g>`;
    }
  }
  return `<defs><linearGradient id="azul-logo-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3a8dff"/><stop offset="1" stop-color="#1767e6"/></linearGradient></defs>
    <rect x="-30" y="-30" width="260" height="270" fill="url(#azul-logo-${uid})"/>
    <g opacity="0.13">${hands}</g>`;
}

// Céu azul: nuvens fofinhas (bolinhas com contorno, a parte de baixo
// sombreada e o branco puxado pro alto) flutuando devagar, cada uma no seu tempo.
function skyClouds(uid) {
  const puffs = [[-16, 2, 10], [-4, -6, 13], [11, -3, 11], [22, 4, 8]]; // [x, y, raio]
  const layer = (color, grow, dx, dy) =>
    puffs.map(([x, y, r]) => `<circle cx="${x + dx}" cy="${y + dy}" r="${r + grow}" fill="${color}"/>`).join("") +
    `<rect x="${-26 - grow + dx}" y="${0 - grow + dy}" width="${56 + 2 * grow}" height="${12 + 2 * grow}" rx="${6 + grow}" fill="${color}"/>`;
  const cloud = (x, y, size, index) => `<g class="cloud-drift" style="animation-delay:${-index * 1.7}s; animation-duration:${7 + (index % 3) * 2}s">
    <g transform="translate(${x} ${y}) scale(${size})">
      ${layer("#8fc0ea", 1.8, 0, 0)}${layer("#d3e7f8", 0, 0, 0)}${layer("#ffffff", -1.6, -1, -2)}
      <path d="M-10 -12 Q-4 -17 3 -16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
    </g></g>`;
  const spots = [ // [x, y, tamanho]
    [28, 26, 0.85], [142, 18, 0.75], [96, 66, 0.95], [-4, 96, 0.8], [186, 96, 0.9],
    [52, 136, 0.95], [150, 158, 1], [14, 192, 0.85], [112, 204, 0.9], [196, 214, 0.85],
  ];
  return `<defs><linearGradient id="ceu-azul-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b9def7"/><stop offset="1" stop-color="#86c2ef"/></linearGradient></defs>
    <rect x="-30" y="-30" width="260" height="270" fill="url(#ceu-azul-${uid})"/>
    ${spots.map(([x, y, size], index) => cloud(x, y, size, index)).join("")}`;
}

// Mar turquesa: ondas quebrando. A crista branca enrola pra direita; as de
// cima (longe) são menores e clarinhas, as de baixo maiores e escuras. Cada
// fileira sobe e desce de leve, desencontrada das outras.
function seaWaves(uid) {
  const waveShape = "M0 0 C14 -4 26 -24 44 -32 C54 -37 66 -34 66 -26 C66 -20 59 -18 57 -22 C49 -12 56 -4 68 0";
  const rows = [ // [linha de base, tamanho, deslocamento, cor da onda, cor do contorno, cor das listras]
    [66, 1.05, -20, "#7fe0d8", "#4fc3ba", "#b5efea"],
    [118, 1.3, -58, "#4fc8c0", "#26a59e", "#8fe3dc"],
    [176, 1.55, -30, "#25a8a1", "#13827c", "#5ccfc6"],
    [244, 1.8, -80, "#0f8a84", "#085a56", "#2fb2ab"],
  ];
  const wave = (x, y, size, fill, edge, stripe) => `<g transform="translate(${x} ${y}) scale(${size})">
    <path d="${waveShape} Z" fill="${fill}"/>
    <path d="M8 -2 C18 -7 28 -19 40 -25 M18 -1 C26 -5 34 -13 45 -17" fill="none" stroke="${stripe}" stroke-width="2" stroke-linecap="round"/>
    <path d="${waveShape}" fill="none" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M31 -25 C39 -32 50 -36 58 -34 C64 -32 66 -27 62 -23" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
    <circle cx="27" cy="-21" r="2" fill="#fff"/><circle cx="21" cy="-16.5" r="1.4" fill="#fff"/>
    <circle cx="53" cy="-40" r="1.5" fill="#fff"/><circle cx="61" cy="-40" r="1.1" fill="#fff"/></g>`;
  let art = `<defs><linearGradient id="ceu-mar-${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e3fbf8"/><stop offset="1" stop-color="#b6ece7"/></linearGradient></defs>
    <rect x="-30" y="-30" width="260" height="270" fill="url(#ceu-mar-${uid})"/>`;
  rows.forEach(([y, size, shift, fill, edge, stripe], index) => {
    // A água de cada fileira tem a beirada ondulada (superfície do mar).
    let ripple = `M-30 ${y}`;
    for (let x = -30; x < 230; x += 20) ripple += " q5 -3 10 0 t10 0";
    let row = `<path d="${ripple} L230 ${y + 90} L-30 ${y + 90} Z" fill="${fill}"/>
      <path d="${ripple}" fill="none" stroke="${edge}" stroke-width="1.2" opacity="0.6"/>`;
    const step = 60 * size;
    for (let x = shift - step; x < 230; x += step) row += wave(x.toFixed(1), y, size, fill, edge, stripe);
    art += `<g class="wave-row" style="animation-delay:${-index * 0.6}s">${row}</g>`;
  });
  return art;
}

// Pôr do sol: floresta de outono com a luz dourada no meio, árvores dos dois
// lados e um caminho iluminado. Desfocada, como o fundo de uma foto, para o
// Eduzinho ficar em destaque; por cima, bolinhas de luz piscando.
function autumnForest(uid) {
  const puffs = [[-14, 4, 11], [0, -6, 14], [14, 2, 11], [-4, 10, 10], [8, 10, 10]]; // [x, y, raio]
  const crown = (x, y, size, fill, light, edge) => {
    const layer = (color, grow, dx, dy) => puffs.map(([px, py, r]) =>
      `<circle cx="${px + dx}" cy="${py + dy}" r="${r + grow}" fill="${color}"/>`).join("");
    return `<g transform="translate(${x} ${y}) scale(${size})">${layer(edge, 1.8, 0, 0)}${layer(fill, 0, 0, 0)}${layer(light, -4, 2, -3)}</g>`;
  };
  const near = ["#e2552b", "#f58a3c", "#9e2f1c"];
  const far = ["#f39a45", "#ffc06a", "#d06a2c"];
  const trunk = (x, top, width, color) =>
    `<path d="M${x - width / 2} ${top} L${x - width / 2 - 3} 215 L${x + width / 2 + 3} 215 L${x + width / 2} ${top} Z" fill="${color}"/>`;
  return `<defs>
      <radialGradient id="luz-tarde-${uid}" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stop-color="#fff6d2"/><stop offset="0.25" stop-color="#ffd27a"/>
        <stop offset="0.6" stop-color="#f2873f"/><stop offset="1" stop-color="#b8402a"/></radialGradient>
      <filter id="desfoque-tarde-${uid}" x="-40" y="-40" width="280" height="290" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="1.8"/></filter>
      <linearGradient id="caminho-${uid}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#f6a43f"/><stop offset="1" stop-color="#ffe3a0"/></linearGradient>
    </defs>
    <g filter="url(#desfoque-tarde-${uid})">
      <rect x="-30" y="-30" width="260" height="270" fill="url(#luz-tarde-${uid})"/>
      <g fill="#fff" opacity="0.16">
        <path d="M100 95 L60 -20 L84 -20 Z"/><path d="M100 95 L120 -20 L146 -20 Z"/><path d="M100 95 L-20 30 L-20 58 Z"/><path d="M100 95 L220 40 L220 66 Z"/>
      </g>
      ${trunk(72, 60, 8, "#a65430")}${trunk(128, 60, 8, "#a65430")}${trunk(56, 50, 11, "#8c4026")}${trunk(144, 50, 11, "#8c4026")}
      ${crown(70, 46, 0.75, ...far)}${crown(130, 46, 0.75, ...far)}${crown(56, 30, 0.85, ...far)}${crown(144, 30, 0.85, ...far)}
      <path d="M-30 240 L-30 172 Q40 150 92 114 L108 114 Q160 150 230 172 L230 240 Z" fill="#a8461f"/>
      <path d="M52 240 Q88 160 96 114 L104 114 Q112 160 148 240 Z" fill="url(#caminho-${uid})"/>
      ${trunk(12, 20, 22, "#4a2418")}${trunk(40, 30, 15, "#5e2c1b")}${trunk(188, 20, 22, "#4a2418")}${trunk(160, 30, 15, "#5e2c1b")}
      ${crown(8, 16, 1.4, ...near)}${crown(42, 4, 1.15, ...near)}${crown(28, 44, 1.05, ...near)}
      ${crown(192, 16, 1.4, ...near)}${crown(158, 4, 1.15, ...near)}${crown(172, 44, 1.05, ...near)}
      ${crown(4, 196, 1.1, ...near)}${crown(196, 196, 1.1, ...near)}
    </g>
    <g fill="#fff6d2" class="bokeh">
      <circle cx="64" cy="88" r="7" opacity="0.35"/><circle cx="140" cy="76" r="5" opacity="0.4"/>
      <circle cx="34" cy="150" r="9" opacity="0.22"/><circle cx="170" cy="140" r="8" opacity="0.25"/>
      <circle cx="118" cy="40" r="4" opacity="0.4"/><circle cx="84" cy="30" r="6" opacity="0.28"/>
    </g>`;
}

// Sol da manhã: amanhecer no campo. O sol nasce bem atrás do Eduzinho (como
// uma auréola), com os raios girando devagar; morrinhos e passarinhos.
function morningSun(uid) {
  const rays = Array.from({ length: 14 }, (_, index) => {
    const r = ((index * 360) / 14) * (Math.PI / 180);
    const point = (radius) => `${(100 + radius * Math.cos(r)).toFixed(1)} ${(100 + radius * Math.sin(r)).toFixed(1)}`;
    return `M${point(60)} L${point(index % 2 ? 76 : 86)}`;
  }).join(" ");
  const hill = (d, fill, edge) => `<path d="${d} L230 240 L-30 240 Z" fill="${fill}"/><path d="${d}" fill="none" stroke="${edge}" stroke-width="2"/>`;
  const bird = (x, y, size) => `<path transform="translate(${x} ${y}) scale(${size})" d="M-6 0 Q-3 -4 0 0 Q3 -4 6 0" fill="none" stroke="#b0702a" stroke-width="1.8" stroke-linecap="round"/>`;
  return `<defs>
      <linearGradient id="ceu-manha-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe78f"/><stop offset="1" stop-color="#fff6d6"/></linearGradient>
      <radialGradient id="sol-manha-${uid}" cx="0.45" cy="0.4" r="0.6">
        <stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ffb627"/></radialGradient>
    </defs>
    <rect x="-30" y="-30" width="260" height="270" fill="url(#ceu-manha-${uid})"/>
    <path class="sun-rays" d="${rays}" stroke="#ffcf4a" stroke-width="7" stroke-linecap="round" opacity="0.85"/>
    <circle cx="100" cy="100" r="66" fill="#fff1b0" opacity="0.6"/>
    <circle cx="100" cy="100" r="54" fill="url(#sol-manha-${uid})" stroke="#f0a020" stroke-width="2.4"/>
    ${bird(30, 22, 1)}${bird(46, 30, 0.75)}${bird(168, 16, 0.9)}
    ${hill("M-30 150 Q20 128 70 142 Q120 156 160 136 Q190 122 230 138", "#d4e98a", "#a9c95a")}
    ${hill("M-30 172 Q30 150 90 166 Q140 180 230 156", "#b2d86c", "#86b648")}
    ${hill("M-30 196 Q50 176 120 192 Q170 202 230 184", "#8cc458", "#62a03a")}
    <g fill="#fff"><circle cx="30" cy="198" r="1.6"/><circle cx="160" cy="200" r="1.6"/><circle cx="182" cy="192" r="1.3"/><circle cx="12" cy="206" r="1.3"/></g>
    <g fill="#ffd34d"><circle cx="36" cy="203" r="1.4"/><circle cx="170" cy="205" r="1.4"/></g>`;
}

// ----- Item sozinho (vitrine da Lojinha) -----
// Cada peça desenhada sem o mascote, como um adesivo. O viewBox é o quadrado
// em volta da peça (nas coordenadas do mascote).
const ITEM_VIEWBOX = {
  bone: "49 -24 124 124",
  laco: "91 0 66 66",
  "chapeu-festa": "72 -9 58 58",
  "tiara-flores": "45 -15 110 110",
  coroa: "58 -22 84 84",
  "oculos-redondos": "50 18 100 100",
  "oculos-sol": "50 18 100 100",
  bochechas: "58 42 84 84",
};
const CHEST_ITEM_VIEWBOX = "103 141 30 30"; // o broche fica em (118, 156)

// Camiseta como ícone (num quadrado de 0 a 100), com a mesma sombra do mascote.
function shirtIconSvg(shirt) {
  mascotDrawCount += 1;
  const isTank = shirt.design === "tank";
  const outline = isTank
    ? "M36 14 L44 14 Q50 26 56 14 L64 14 Q64 32 70 40 L70 86 L30 86 L30 40 Q36 32 36 14 Z"
    : "M32 20 L44 14 Q50 22 56 14 L68 20 L84 36 L73 47 L66 41 L66 86 L34 86 L34 41 L27 47 L16 36 Z";
  const collar = isTank ? "M44 14 Q50 26 56 14" : "M44 14 Q50 22 56 14";
  const shape = (fill) => `<path d="${outline}" fill="${fill}"/>`;
  let fill = shirt.fill;
  let defs = "";
  if (shirt.stripe) {
    defs = `<defs><pattern id="listras-${mascotDrawCount}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${shirt.fill}"/><rect width="10" height="4" fill="${shirt.stripe}"/></pattern></defs>`;
    fill = `url(#listras-${mascotDrawCount})`;
  }
  return `<svg class="mascot-svg" viewBox="0 2 100 100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${defs}
    <g transform="${SHADOW_OFFSET}" opacity="0.28">${shape(MASCOT_INK.shadow)}</g>${shape(fill)}
    <path d="${collar}" fill="none" stroke="${shirt.trim}" stroke-width="4" stroke-linecap="round"/>
  </svg>`;
}

// Desenho de um item da loja sozinho. O fundo aparece desenhado (parado).
function mascotItemSvg(item) {
  if (item.slot === "shirt") return shirtIconSvg(item);
  mascotDrawCount += 1;
  const uid = mascotDrawCount;
  if (item.slot === "background") {
    return `<svg class="mascot-svg has-scene" viewBox="0 5 200 200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${drawBackground(item.id, uid)}</svg>`;
  }
  let art = "";
  if (item.slot === "head") art = drawHeadItem(item.id, uid);
  if (item.slot === "face") art = drawFaceItem(item.id, uid);
  if (item.slot === "chest") art = drawChestItem(item.id);
  if (!art) return "";
  const viewBox = item.slot === "chest" ? CHEST_ITEM_VIEWBOX : ITEM_VIEWBOX[item.id] || MASCOT_VIEWBOX.head;
  return `<svg class="mascot-svg" viewBox="${viewBox}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">${art}</svg>`;
}

// ----- Animação -----
// Feita com CSS (mascote.css). Só os mascotes grandes se mexem: respiram,
// piscam e balançam a mão de leve. Com "animações reduzidas" eles ficam
// parados (mas ainda trocam de expressão).

function isMotionAllowed() {
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return state.motion !== "reduced" && !prefersReduced;
}

// Faz os mascotes grandes da tela reagirem (por padrão, acenam).
const mascotPoseTimers = new WeakMap();
function playMascotReaction(pose = "waving") {
  const [className, ms] = MASCOT_POSES[pose];
  document.querySelectorAll(".mascot-svg.is-live").forEach((svg) => {
    Object.values(MASCOT_POSES).forEach(([name]) => svg.classList.remove(name));
    svg.getBoundingClientRect(); // tirar e pôr a classe de novo faz a animação recomeçar
    svg.classList.add(className);
    clearTimeout(mascotPoseTimers.get(svg));
    mascotPoseTimers.set(svg, setTimeout(() => svg.classList.remove(className), ms));
  });
}

// ----- Montagem -----

// look = { shirt, head, face, chest, background } com os ids dos itens escolhidos.
// crop = "full" (corpo inteiro), "head" (só a cabeça) ou "avatar" (foto de perfil).
// options:
//   animated  mascote grande: se mexe, reage (playMascotReaction) e mostra o fundo desenhado
//   scene     mostra o fundo desenhado (já vem ligado com animated)
//   pose      fica parado numa pose (uma das MASCOT_POSES), ex.: "thinking-chin" no login
function mascotSvg(look, crop = "full", label = "Mascote do EduSinal", options = {}) {
  mascotDrawCount += 1;
  const uid = mascotDrawCount;
  const shirt = MASCOT_ITEMS.find((item) => item.id === look.shirt) || MASCOT_ITEMS.find((item) => item.id === DEFAULT_LOOK.shirt);
  const pose = MASCOT_POSES[options.pose];
  const isBig = Boolean(options.animated || pose); // tem as outras poses e pode se mexer
  const scene = options.scene ?? Boolean(options.animated);
  const classes = ["mascot-svg"];
  if (options.animated && !pose) classes.push("is-live");
  if (pose) classes.push(pose[0]);
  if (scene) classes.push("has-scene");
  const motion = isBig && isMotionAllowed() ? ' data-motion="on"' : "";
  const ariaLabel = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"';
  const arms = drawArms(shirt, isBig);
  return `<svg class="${classes.join(" ")}" viewBox="${MASCOT_VIEWBOX[crop]}" ${ariaLabel}${motion} xmlns="http://www.w3.org/2000/svg">
    ${scene ? drawBackground(look.background, uid) : ""}
    <g class="figure"><g class="breath">
      ${arms.resting}
      ${withShadow(bodyShape(shirt, uid))}
      ${drawShirtDetails(shirt)}
      <g class="head-group">
        ${withShadow((fill) => `<circle cx="100" cy="72" r="44" fill="${fill || MASCOT_INK.skin}"/>`)}
        ${drawFace()}
        ${drawFaceItem(look.face, uid)}
        ${drawHeadItem(look.head, uid)}
        ${isBig ? drawSweatDrop() + drawSparks() : ""}
      </g>
      ${arms.waving}
      ${arms.chin}
      ${drawChestItem(look.chest)}
    </g></g>
    ${isBig ? drawConfetti() : ""}
  </svg>`;
}
