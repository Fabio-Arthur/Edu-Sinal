// DICIONÁRIO (o "álbum de sinais")
// Decisão da equipe (11/11/2026):
//   - o ALFABETO fica todo aberto, para consultar os sinais das letras à vontade;
//   - as PALAVRAS vêm das atividades de aprender da trilha. Cada uma começa
//     bloqueada e abre quando o aluno conclui a atividade que ensina o sinal;
//   - o DESAFIA-ME (opcional) sorteia perguntas dos exercícios que o aluno já
//     concluiu, ou seja, dos sinais que ele já desbloqueou.
// Consultar é livre e não gasta vidas. Os vídeos ainda serão gravados.

// Tira acentos e maiúsculas para a busca achar "mae" em "Mãe".
function normalizeText(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Código do sinal, igual ao do banco: "Bom dia" → "bom-dia", "Letra A" → "letra-a".
// (O gerador do banco, ferramentas/gerar_conteudo.mjs, faz a mesma conta.)
function signCode(sign) {
  return normalizeText(sign).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "sinal";
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_CATEGORY = "alfabeto";
const ALPHABET_TRAIL_TOPIC = "alfabeto-manual"; // a etapa da trilha que ensina letras (elas já ficam no alfabeto)

// Dicas das letras (sem descrever como o sinal é feito).
const LETTER_TIPS = {
  A: "A primeira letra! Com o alfabeto manual dá para soletrar nomes e palavras que ainda não têm sinal.",
  E: "Soletrar o próprio nome é um ótimo treino.",
  M: "Metade do alfabeto! Tente soletrar o nome de alguém da sua família.",
  Z: "A última letra! Agora você consegue soletrar qualquer palavra.",
};

// Categorias: o alfabeto e uma para cada etapa da trilha (menos a do alfabeto).
const DICTIONARY_CATEGORIES = [
  { id: ALPHABET_CATEGORY, label: "Alfabeto" },
  ...TOPIC_ORDER.filter((topicId) => topicId !== ALPHABET_TRAIL_TOPIC)
    .map((topicId) => ({ id: topicId, label: learningTopics[topicId].title })),
];

// As palavras saem dos cartões das atividades de aprender (js/conteudo.js).
// Cada uma lembra qual atividade a desbloqueia.
const DICTIONARY_WORDS = [];
TOPIC_ORDER.filter((topicId) => topicId !== ALPHABET_TRAIL_TOPIC).forEach((topicId) => {
  learningTopics[topicId].branches.filter((branch) => branch.kind === "learn").forEach((branch) => {
    branch.cards.forEach((card) => {
      if (DICTIONARY_WORDS.some((word) => word.sign === card.sign)) return; // já veio de outra atividade
      DICTIONARY_WORDS.push({
        id: signCode(card.sign),
        sign: card.sign,
        word: card.label || card.sign,
        tip: card.tip,
        category: topicId,
        topicId,
        branchId: branch.id,
      });
    });
  });
});

function categoryLabel(categoryId) {
  return DICTIONARY_CATEGORIES.find((category) => category.id === categoryId).label;
}

// A palavra abre quando a atividade de aprender que a ensina foi concluída.
function isWordUnlocked(word) {
  return isLessonDone(word.topicId, word.branchId);
}

function unlockedWordsCount() {
  return DICTIONARY_WORDS.filter(isWordUnlocked).length;
}

// Guarda que o aluno viu um sinal: conta para a missão do dia e para a conquista.
// O servidor guarda e devolve o estado (a missão do dia já conta na hora).
async function markSignViewed(signId) {
  if (state.daily.signsViewed.includes(signId)) return; // já contou hoje
  try {
    applyServerState(await api("POST", `/dicionario/${encodeURIComponent(signId)}/visto`));
  } catch (error) {
    showApiError(error);
  }
}

function selectWord(wordId) {
  const word = DICTIONARY_WORDS.find((entry) => entry.id === wordId);
  if (!word) return;
  if (!isWordUnlocked(word)) {
    const branch = learningTopics[word.topicId].branches.find((entry) => entry.id === word.branchId);
    showToast(`Você desbloqueia “${word.word}” na etapa ${learningTopics[word.topicId].title}, na atividade “${branch.label}”.`);
    return;
  }
  state.selectedWord = wordId;
  markSignViewed(wordId);
  render();
}

function chooseDictionaryCategory(categoryId) {
  state.dictionaryCategory = categoryId;
  state.dictionaryQuery = "";
  state.selectedWord = null;
  render();
}

// Chamado a cada letra digitada na busca. Só troca a lista de resultados,
// para o campo de busca não perder o foco.
function searchDictionary(query) {
  state.dictionaryQuery = query;
  state.selectedWord = null;
  document.getElementById("dictionary-results").innerHTML = renderDictionaryResults();
}

// ----- Desafia-me: 5 perguntas dos exercícios que o aluno já concluiu -----
// É opcional. Passar (errando no máximo 1) dá prêmio uma vez por dia; no resto
// do dia, refazer é treino livre. O servidor sorteia as perguntas.

const DICTIONARY_TOPIC = "dicionario"; // o desafio fica salvo como "dicionario:desafio"
const CHALLENGE_ID = "desafio";
const CHALLENGE_SIZE = 5;
const CHALLENGE_COINS = 10;

// Abre depois do primeiro exercício concluído (cada exercício tem 5 perguntas).
function isChallengeUnlocked() {
  return TOPIC_ORDER.some((topicId) => learningTopics[topicId].branches
    .some((branch) => branch.kind === "practice" && isLessonDone(topicId, branch.id)));
}

function isChallengeRewardAvailable() {
  return state.alphabetChallengeDate !== dateKey();
}

// O servidor manda só QUAIS perguntas sortear ({ atividade, posicao }); o texto,
// o vídeo e as opções vêm do conteúdo do app (js/conteudo.js), que é igual ao do banco.
function challengeSteps(questions) {
  return questions.map((question, position) => {
    const [topicId, branchId] = question.atividade.split(":");
    const branch = learningTopics[topicId].branches.find((entry) => entry.id === branchId);
    return { ...branch.questions[question.posicao], questionIndex: position };
  });
}

function startAlphabetChallenge() {
  if (!isChallengeUnlocked()) return;
  beginLesson({
    topicId: DICTIONARY_TOPIC,
    branchId: CHALLENGE_ID,
    kind: "practice",
    isChallenge: true,
    steps: [],
    makeSteps: challengeSteps, // as perguntas chegam da API
  });
}

// Cartão do Desafia-me: trancado, com prêmio ou só treino.
function renderAlphabetChallenge() {
  if (!isChallengeUnlocked()) {
    return `
      <section class="challenge-card is-locked" aria-label="Desafia-me">
        <span class="challenge-icon">${icon("lock-fill")}</span>
        <div class="challenge-copy"><h3>Desafia-me</h3><p>Conclua o seu primeiro exercício na trilha para liberar um desafio com os sinais que você já aprendeu.</p></div>
      </section>`;
  }
  const hasReward = isChallengeRewardAvailable();
  const blocked = activityBlockReason(DICTIONARY_TOPIC, CHALLENGE_ID, "practice");
  const text = hasReward
    ? `${CHALLENGE_SIZE} perguntas sorteadas dos sinais que você já desbloqueou. Erre no máximo ${FINAL_MAX_MISTAKES} para ganhar o prêmio.`
    : "Você já ganhou o prêmio de hoje. Pode treinar de novo quando quiser, sem prêmio.";
  const prize = hasReward
    ? `<span class="challenge-prize">${icon("lightning-charge-fill")} +${XP_PER_EXERCISE} XP</span><span class="challenge-prize">${icon("coin")} +${CHALLENGE_COINS}</span>`
    : `<span class="challenge-prize is-done">${icon("check-circle-fill")} Prêmio de hoje ganho</span>`;
  let button = hasReward
    ? `<button class="button-3d button-3d-gold challenge-button" type="button" data-action="start-challenge">${icon("lightning-charge-fill")} Desafia-me</button>`
    : `<button class="button-3d button-3d-outline challenge-button" type="button" data-action="start-challenge">${icon("arrow-repeat")} Treinar de novo</button>`;
  if (blocked) button = `<button class="button-3d challenge-button" type="button" disabled>${blocked === "energy" ? `${icon("battery")} Sem energia` : `${icon("heart-fill")} Sem vidas`}</button>`;
  return `
    <section class="challenge-card${hasReward ? " has-reward" : ""}" aria-label="Desafia-me">
      <span class="challenge-icon">${icon("lightning-charge-fill")}</span>
      <div class="challenge-copy"><h3>Desafia-me</h3><p>${text}</p><div class="challenge-prizes">${prize}</div></div>
      ${button}
    </section>`;
}

// ----- Alfabeto: todas as letras abertas, só para consultar -----

function selectLetter(letter) {
  state.selectedLetter = letter;
  markSignViewed(signCode(`Letra ${letter}`));
  render();
}

function renderLetterTile(letter) {
  const isSelected = state.selectedLetter === letter;
  return `<button class="letter-tile${isSelected ? " is-selected" : ""}" type="button" data-alphabet-letter="${letter}" aria-label="Letra ${letter}" aria-pressed="${isSelected}"><span>${letter}</span></button>`;
}

// Painel ao lado da grade: o vídeo e a dica da letra escolhida.
function renderLetterPanel() {
  const letter = state.selectedLetter;
  return `
    <aside class="letter-panel" aria-live="polite">
      ${signVideoHtml(`Letra ${letter}`, "small")}
      <p class="letter-panel-kicker">ALFABETO MANUAL</p>
      <h3>Letra ${letter}</h3>
      <p>${LETTER_TIPS[letter] || "Mais uma letra para soletrar nomes e palavras que ainda não têm sinal."}</p>
    </aside>`;
}

function renderAlphabet() {
  return `
    <section class="alphabet-track" aria-labelledby="alphabet-title">
      <div class="alphabet-banner">
        <div><small>ALFABETO MANUAL</small><h2 id="alphabet-title">Todas as letras liberadas</h2></div>
        <div class="alphabet-progress"><strong>${ALPHABET.length} letras</strong></div>
      </div>
      <div class="alphabet-layout">
        <div class="letter-grid" role="group" aria-label="Letras do alfabeto manual">${ALPHABET.map(renderLetterTile).join("")}</div>
        ${renderLetterPanel()}
      </div>
    </section>`;
}

// ----- Palavras -----

function renderWordDetail(word) {
  if (!word) {
    return `<aside class="word-detail word-detail-empty">${icon("hand-index-thumb-fill")}<p>Escolha uma palavra desbloqueada para ver o sinal.</p></aside>`;
  }
  return `
    <aside class="word-detail" aria-live="polite">
      ${signVideoHtml(word.sign, "small")}
      <p class="word-detail-kicker">${categoryLabel(word.category).toUpperCase()}</p>
      <h2>${word.word}</h2>
      <p class="word-example">${icon("lightbulb-fill")} ${word.tip}</p>
      <p class="word-note">O vídeo deste sinal será gravado e revisado por pessoas surdas fluentes em Libras.</p>
    </aside>`;
}

// Um cartão de palavra: aberto (com "visto") ou com cadeado.
function renderWordCard(word) {
  const unlocked = isWordUnlocked(word);
  const isSelected = state.selectedWord === word.id;
  const seen = unlocked && state.signsSeen.includes(word.id) ? `<small class="word-seen">${icon("check-circle-fill")} visto</small>` : "";
  const detail = unlocked ? categoryLabel(word.category) : "Bloqueada · aprenda na trilha";
  return `<button class="word-card${isSelected ? " is-selected" : ""}${unlocked ? "" : " is-locked"}" type="button" data-action="select-word" data-word="${word.id}" aria-pressed="${isSelected}" aria-label="${escapeHtml(word.word)}${unlocked ? "" : ", bloqueada"}"><span class="word-card-play">${icon(unlocked ? "play-fill" : "lock-fill")}</span><span class="word-card-text"><strong>${word.word}</strong><small>${detail}</small></span>${seen}</button>`;
}

// Resultado da busca ou da categoria escolhida.
function renderDictionaryResults() {
  const query = normalizeText(state.dictionaryQuery.trim());
  if (!query && state.dictionaryCategory === ALPHABET_CATEGORY) return renderAlphabet();

  const words = query
    ? DICTIONARY_WORDS.filter((word) => normalizeText(word.word).includes(query))
    : DICTIONARY_WORDS.filter((word) => word.category === state.dictionaryCategory);

  if (words.length === 0) {
    return `<p class="dictionary-empty">${icon("search")} Nenhum sinal encontrado para “${escapeHtml(state.dictionaryQuery)}”. Tente outra palavra.</p>`;
  }

  const open = words.filter(isWordUnlocked).length;
  const selected = words.find((word) => word.id === state.selectedWord && isWordUnlocked(word));
  const title = query ? `Resultados para “${escapeHtml(state.dictionaryQuery.trim())}”` : categoryLabel(state.dictionaryCategory);
  return `
    <div class="section-heading"><div><p class="eyebrow">${open} DE ${words.length} ${words.length === 1 ? "SINAL DESBLOQUEADO" : "SINAIS DESBLOQUEADOS"}</p><h2>${title}</h2></div></div>
    <div class="dictionary-layout"><div class="word-grid">${words.map(renderWordCard).join("")}</div>${renderWordDetail(selected)}</div>`;
}

function renderSigns() {
  const chips = DICTIONARY_CATEGORIES.map((category) => {
    const isActive = !state.dictionaryQuery && state.dictionaryCategory === category.id;
    return `<button class="category-chip${isActive ? " is-active" : ""}" type="button" data-action="dictionary-category" data-category="${category.id}" aria-pressed="${isActive}">${category.id === ALPHABET_CATEGORY ? icon("alphabet-uppercase") : ""}${category.label}</button>`;
  }).join("");

  return `
    <section class="dictionary-hero" aria-labelledby="dictionary-title">
      <span class="dictionary-hero-icon">${icon("book-fill")}</span>
      <div class="dictionary-hero-copy">
        <small>DICIONÁRIO DE LIBRAS</small>
        <h2 id="dictionary-title">Dicionário</h2>
        <p>O alfabeto está todo aberto. As palavras abrem quando você aprende na trilha.</p>
      </div>
      <span class="dictionary-hero-stat"><strong>${unlockedWordsCount()}/${DICTIONARY_WORDS.length}</strong> palavras desbloqueadas</span>
    </section>
    ${renderAlphabetChallenge()}
    <div class="dictionary-tools">
      <label class="dictionary-search-box">${icon("search")}<input class="dictionary-search" id="dictionary-search" type="search" placeholder="Buscar palavra, ex.: obrigado" aria-label="Buscar palavra no dicionário" value="${escapeHtml(state.dictionaryQuery)}" autocomplete="off" /></label>
      <div class="dictionary-categories" role="group" aria-label="Categorias do dicionário">${chips}</div>
    </div>
    <div class="screen-scroll">
    <div id="dictionary-results">${renderDictionaryResults()}</div>
    <p class="demo-disclaimer">O alfabeto manual representa letras; Libras é uma língua completa, com gramática e sinais próprios.</p>
    </div>`;
}
