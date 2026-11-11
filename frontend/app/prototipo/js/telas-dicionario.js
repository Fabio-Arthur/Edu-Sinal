// DICIONÁRIO
// Consulta livre de sinais (não gasta vidas), com busca e categorias.
// O alfabeto manual é uma trilha à parte: o aluno aprende uma letra por vez,
// em ordem; cada letra concluída libera a próxima. Com 5 letras aprendidas
// abre o "Desafia-me" (opcional), que mistura todas elas. Os vídeos ainda
// serão gravados.

const DICTIONARY_CATEGORIES = [
  { id: "alfabeto", label: "Alfabeto" },
  { id: "saudacoes", label: "Saudações" },
  { id: "numeros", label: "Números" },
  { id: "familia", label: "Família" },
  { id: "cores", label: "Cores" },
];

// Palavras de exemplo. "example" é uma frase em português para dar contexto.
const DICTIONARY_WORDS = [
  { id: "oi", word: "Oi", category: "saudacoes", example: "Oi, tudo bem?" },
  { id: "tchau", word: "Tchau", category: "saudacoes", example: "Tchau, até amanhã!" },
  { id: "bom-dia", word: "Bom dia", category: "saudacoes", example: "Bom dia, turma!" },
  { id: "boa-tarde", word: "Boa tarde", category: "saudacoes", example: "Boa tarde, professora." },
  { id: "boa-noite", word: "Boa noite", category: "saudacoes", example: "Boa noite, durma bem." },
  { id: "obrigado", word: "Obrigado(a)", category: "saudacoes", example: "Obrigada pela ajuda!" },
  { id: "por-favor", word: "Por favor", category: "saudacoes", example: "Pode repetir, por favor?" },
  { id: "desculpa", word: "Desculpa", category: "saudacoes", example: "Desculpa, não entendi." },
  { id: "um", word: "Um", category: "numeros", example: "Tenho um irmão." },
  { id: "dois", word: "Dois", category: "numeros", example: "São dois sinais novos." },
  { id: "tres", word: "Três", category: "numeros", example: "Faltam três dias." },
  { id: "quatro", word: "Quatro", category: "numeros", example: "Moro com quatro pessoas." },
  { id: "cinco", word: "Cinco", category: "numeros", example: "Cinco minutos de prática." },
  { id: "mae", word: "Mãe", category: "familia", example: "Minha mãe também aprende Libras." },
  { id: "pai", word: "Pai", category: "familia", example: "Meu pai mora perto." },
  { id: "irmao", word: "Irmão", category: "familia", example: "Meu irmão é surdo." },
  { id: "irma", word: "Irmã", category: "familia", example: "Minha irmã estuda comigo." },
  { id: "avo", word: "Avó", category: "familia", example: "Visitei minha avó." },
  { id: "azul", word: "Azul", category: "cores", example: "O mascote é azul." },
  { id: "verde", word: "Verde", category: "cores", example: "A folha é verde." },
  { id: "vermelho", word: "Vermelho", category: "cores", example: "O carro vermelho passou." },
  { id: "amarelo", word: "Amarelo", category: "cores", example: "O sol amarelo apareceu." },
  { id: "branco", word: "Branco", category: "cores", example: "O papel é branco." },
];

// Tira acentos e maiúsculas para a busca achar "mae" em "Mãe".
function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function categoryLabel(categoryId) {
  return DICTIONARY_CATEGORIES.find((category) => category.id === categoryId).label;
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

// ----- Alfabeto manual: uma letra por vez -----

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const ALPHABET_TOPIC = "alfabeto"; // o progresso fica salvo como "alfabeto:A", "alfabeto:B"...

// Dicas das letras (sem descrever como o sinal é feito).
const LETTER_TIPS = {
  A: "A primeira letra! Com o alfabeto manual dá para soletrar nomes e palavras que ainda não têm sinal.",
  E: "Você já sabe as vogais A e E. Soletrar o próprio nome é um ótimo treino.",
  M: "Metade do alfabeto! Tente soletrar o nome de alguém da sua família.",
  Z: "A última letra! Agora você consegue soletrar qualquer palavra.",
};

function isLetterDone(letter) {
  return isLessonDone(ALPHABET_TOPIC, letter);
}

// A próxima letra a aprender (ou nenhuma, se já aprendeu todas).
function nextLetter() {
  return ALPHABET.find((letter) => !isLetterDone(letter)) || null;
}

function isLetterUnlocked(letter) {
  return isLetterDone(letter) || letter === nextLetter();
}

function learnedLettersCount() {
  return ALPHABET.filter(isLetterDone).length;
}

// Duas outras letras para as opções: de preferência as vizinhas.
function letterDistractors(letter) {
  const index = ALPHABET.indexOf(letter);
  return [index - 1, index + 1, index - 2, index + 2]
    .filter((position) => position >= 0 && position < ALPHABET.length)
    .slice(0, 2)
    .map((position) => ALPHABET[position]);
}

// Coloca a resposta certa numa posição que muda de letra para letra.
function lettersWithAnswer(letter) {
  const options = letterDistractors(letter);
  const answer = letter.charCodeAt(0) % (options.length + 1);
  options.splice(answer, 0, letter);
  return { options, answer };
}

// A atividade de cada letra: aprender (cartão) e depois duas perguntas.
function letterSteps(letter) {
  const tip = LETTER_TIPS[letter] || "Mais uma letra para soletrar nomes e palavras.";
  const toWord = lettersWithAnswer(letter);
  const toVideo = lettersWithAnswer(letter);
  return [
    { type: "card", sign: `Letra ${letter}`, label: letter, title: "Letra nova", tip },
    { type: "video-palavra", sign: `Letra ${letter}`, title: "Que letra é esta?", options: toWord.options, answer: toWord.answer, explain: `Essa é a letra ${letter} do alfabeto manual.` },
    { type: "palavra-video", sign: letter, title: `Qual é o sinal da letra ${letter}?`, options: toVideo.options.map((option) => `Letra ${option}`), answer: toVideo.answer, explain: `Esse é o sinal da letra ${letter}.` },
  ];
}

function startLetter(letter) {
  if (!isLetterUnlocked(letter)) return;
  beginLesson({
    topicId: ALPHABET_TOPIC,
    branchId: letter,
    kind: "practice",
    steps: numberQuestions(letterSteps(letter)),
  });
}

// ----- Desafia-me: 5 perguntas misturando as letras já aprendidas -----
// É opcional (não trava as próximas letras). Passar (errando no máximo 1) dá
// prêmio uma vez por dia; no resto do dia, refazer é treino livre.

const CHALLENGE_ID = "desafio";
const CHALLENGE_MIN_LETTERS = 5;
const CHALLENGE_SIZE = 5;
const CHALLENGE_COINS = 10;

function isChallengeUnlocked() {
  return learnedLettersCount() >= CHALLENGE_MIN_LETTERS;
}

function isChallengeRewardAvailable() {
  return state.alphabetChallengeDate !== dateKey();
}

// As 5 perguntas são sorteadas pelo servidor (entre as letras já aprendidas)
// e chegam prontas, sem o gabarito. Aqui só viram passos da atividade.
function challengeSteps(questions) {
  return questions.map((question, position) => {
    const letter = question.sinal.replace("Letra ", "");
    if (question.tipo === "video-palavra") {
      return { type: "video-palavra", sign: question.sinal, title: "Que letra é esta?", options: question.opcoes, questionIndex: position, explain: `Essa é a letra ${letter} do alfabeto manual.` };
    }
    return { type: "palavra-video", sign: letter, title: `Qual é o sinal da letra ${letter}?`, options: question.opcoes, questionIndex: position, explain: `Esse é o sinal da letra ${letter}.` };
  });
}

function startAlphabetChallenge() {
  if (!isChallengeUnlocked()) return;
  beginLesson({
    topicId: ALPHABET_TOPIC,
    branchId: CHALLENGE_ID,
    kind: "practice",
    isChallenge: true,
    steps: [],
    makeSteps: challengeSteps, // as perguntas chegam da API
  });
}

// Cartão acima da grade: trancado (com quanto falta), com prêmio ou só treino.
function renderAlphabetChallenge() {
  const learned = learnedLettersCount();
  if (!isChallengeUnlocked()) {
    return `
      <section class="challenge-card is-locked" aria-label="Desafia-me">
        <span class="challenge-icon">${icon("lock-fill")}</span>
        <div class="challenge-copy"><h3>Desafia-me</h3><p>Aprenda ${CHALLENGE_MIN_LETTERS} letras para liberar um desafio que mistura todas elas.</p><div class="challenge-prizes"><span class="challenge-prize is-locked">${icon("lock-fill")} ${learned}/${CHALLENGE_MIN_LETTERS} letras</span></div></div>
      </section>`;
  }
  const hasReward = isChallengeRewardAvailable();
  const blocked = activityBlockReason(ALPHABET_TOPIC, CHALLENGE_ID, "practice");
  const text = hasReward
    ? `${CHALLENGE_SIZE} perguntas misturando as ${learned} letras que você já aprendeu. Erre no máximo ${FINAL_MAX_MISTAKES} para ganhar o prêmio.`
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

// Volta para o alfabeto do dicionário, com a próxima letra escolhida.
function showAlphabet() {
  setScreen("signs");
  state.dictionaryCategory = "alfabeto";
  state.selectedLetter = nextLetter() || state.selectedLetter;
  render();
}

function selectLetter(letter) {
  if (!isLetterUnlocked(letter)) {
    showToast(`Aprenda a letra ${nextLetter()} primeiro: as letras abrem em ordem.`);
    return;
  }
  state.selectedLetter = letter;
  if (isLetterDone(letter)) markSignViewed(`letra-${letter}`);
  render();
}

function renderLetterTile(letter) {
  const isDone = isLetterDone(letter);
  const isNext = letter === nextLetter();
  const isSelected = state.selectedLetter === letter;
  let status = "is-locked";
  let label = `Letra ${letter}, bloqueada`;
  let mark = icon("lock-fill", "letter-mark");
  if (isDone) {
    status = "is-done";
    label = `Letra ${letter}, aprendida`;
    mark = icon("check-lg", "letter-mark");
  } else if (isNext) {
    status = "is-next";
    label = `Letra ${letter}, próxima a aprender`;
    mark = "";
  }
  return `<button class="letter-tile ${status}${isSelected ? " is-selected" : ""}" type="button" data-alphabet-letter="${letter}" aria-label="${label}" aria-pressed="${isSelected}">${mark}<span>${letter}</span></button>`;
}

// Painel ao lado da grade: a letra escolhida e o botão para aprender ou praticar.
function renderLetterPanel() {
  const letter = isLetterUnlocked(state.selectedLetter) ? state.selectedLetter : nextLetter();
  if (!letter) {
    return `<aside class="letter-panel"><span class="letter-panel-trophy">${icon("trophy-fill")}</span><h3>Alfabeto completo!</h3><p>Você aprendeu as 26 letras. Escolha uma letra para rever.</p></aside>`;
  }
  const isDone = isLetterDone(letter);
  const blocked = activityBlockReason(ALPHABET_TOPIC, letter, "practice");
  const warning = {
    energy: `${icon("battery")} Sem energia para letras novas (${timeUntilNextEnergy()}).`,
    lives: `${icon("heart-fill")} Suas vidas estão recarregando.`,
  }[blocked];
  const button = isDone
    ? `<button class="button-3d button-3d-outline" type="button" data-action="start-letter" data-letter="${letter}">${icon("arrow-repeat")} Praticar de novo</button>`
    : `<button class="button-3d button-3d-primary" type="button" data-action="start-letter" data-letter="${letter}" ${blocked ? "disabled" : ""}>Aprender a letra ${letter}</button>`;
  return `
    <aside class="letter-panel" aria-live="polite">
      ${signVideoHtml(`Letra ${letter}`, "small")}
      <p class="letter-panel-kicker">${isDone ? "LETRA APRENDIDA" : "PRÓXIMA LETRA"}</p>
      <h3>Letra ${letter}</h3>
      <p>${isDone ? "Reveja o sinal e pratique de novo quando quiser (revisão, sem XP)." : "Um cartão para aprender e duas perguntas para praticar."}</p>
      ${button}
      ${warning && !isDone ? `<small class="letter-panel-warning">${warning}</small>` : ""}
    </aside>`;
}

function renderAlphabet() {
  const learned = learnedLettersCount();
  return `
    <section class="alphabet-track" aria-labelledby="alphabet-title">
      <div class="alphabet-banner">
        <div><small>ALFABETO MANUAL</small><h2 id="alphabet-title">Aprenda letra por letra</h2></div>
        <div class="alphabet-progress"><div class="hero-progress-track" role="progressbar" aria-label="Letras aprendidas" aria-valuenow="${learned}" aria-valuemin="0" aria-valuemax="${ALPHABET.length}"><span style="width: ${Math.round((learned / ALPHABET.length) * 100)}%"></span></div><strong>${learned}/${ALPHABET.length}</strong></div>
      </div>
      ${renderAlphabetChallenge()}
      <div class="alphabet-layout">
        <div class="letter-grid" role="group" aria-label="Letras do alfabeto manual">${ALPHABET.map(renderLetterTile).join("")}</div>
        ${renderLetterPanel()}
      </div>
    </section>`;
}

// ----- Palavras -----

function renderWordDetail(word) {
  if (!word) {
    return `<aside class="word-detail word-detail-empty">${icon("hand-index-thumb-fill")}<p>Escolha uma palavra para ver o sinal.</p></aside>`;
  }
  return `
    <aside class="word-detail" aria-live="polite">
      ${signVideoHtml(word.word, "small")}
      <p class="word-detail-kicker">${categoryLabel(word.category).toUpperCase()}</p>
      <h2>${word.word}</h2>
      <p class="word-example">${icon("chat-quote-fill")} “${word.example}”</p>
      <p class="word-note">O vídeo deste sinal será gravado e revisado por pessoas surdas fluentes em Libras.</p>
    </aside>`;
}

// Resultado da busca ou da categoria escolhida.
function renderDictionaryResults() {
  const query = normalizeText(state.dictionaryQuery.trim());
  if (!query && state.dictionaryCategory === "alfabeto") return renderAlphabet();

  const words = query
    ? DICTIONARY_WORDS.filter((word) => normalizeText(word.word).includes(query))
    : DICTIONARY_WORDS.filter((word) => word.category === state.dictionaryCategory);

  if (words.length === 0) {
    return `<p class="dictionary-empty">${icon("search")} Nenhum sinal encontrado para “${escapeHtml(state.dictionaryQuery)}”. Tente outra palavra.</p>`;
  }

  const cards = words.map((word) => {
    const isSelected = state.selectedWord === word.id;
    const seen = state.signsSeen.includes(word.id) ? `<small class="word-seen">${icon("check-circle-fill")} visto</small>` : "";
    return `<button class="word-card${isSelected ? " is-selected" : ""}" type="button" data-action="select-word" data-word="${word.id}" aria-pressed="${isSelected}"><span class="word-card-play">${icon("play-fill")}</span><span class="word-card-text"><strong>${word.word}</strong><small>${categoryLabel(word.category)}</small></span>${seen}</button>`;
  }).join("");

  const selected = words.find((word) => word.id === state.selectedWord);
  const title = query ? `Resultados para “${escapeHtml(state.dictionaryQuery.trim())}”` : categoryLabel(state.dictionaryCategory);
  return `
    <div class="section-heading"><div><p class="eyebrow">${words.length} ${words.length === 1 ? "SINAL" : "SINAIS"}</p><h2>${title}</h2></div></div>
    <div class="dictionary-layout"><div class="word-grid">${cards}</div>${renderWordDetail(selected)}</div>`;
}

// Quantos sinais do dicionário o aluno já abriu (só os que ainda existem na lista).
function seenWordsCount() {
  return DICTIONARY_WORDS.filter((word) => state.signsSeen.includes(word.id)).length;
}

function renderSigns() {
  const chips = DICTIONARY_CATEGORIES.map((category) => {
    const isActive = !state.dictionaryQuery && state.dictionaryCategory === category.id;
    return `<button class="category-chip${isActive ? " is-active" : ""}" type="button" data-action="dictionary-category" data-category="${category.id}" aria-pressed="${isActive}">${category.id === "alfabeto" ? icon("alphabet-uppercase") : ""}${category.label}</button>`;
  }).join("");

  return `
    <section class="dictionary-hero" aria-labelledby="dictionary-title">
      <span class="dictionary-hero-icon">${icon("book-fill")}</span>
      <div class="dictionary-hero-copy">
        <small>DICIONÁRIO DE LIBRAS</small>
        <h2 id="dictionary-title">Dicionário</h2>
        <p>Consulte sinais quando quiser. Revisar é livre e não gasta vidas.</p>
      </div>
      <span class="dictionary-hero-stat"><strong>${seenWordsCount()}/${DICTIONARY_WORDS.length}</strong> sinais vistos</span>
    </section>
    <div class="dictionary-tools">
      <label class="dictionary-search-box">${icon("search")}<input class="dictionary-search" id="dictionary-search" type="search" placeholder="Buscar palavra, ex.: obrigado" aria-label="Buscar palavra no dicionário" value="${escapeHtml(state.dictionaryQuery)}" autocomplete="off" /></label>
      <div class="dictionary-categories" role="group" aria-label="Categorias do dicionário">${chips}</div>
    </div>
    <div id="dictionary-results">${renderDictionaryResults()}</div>
    <p class="demo-disclaimer">O alfabeto manual representa letras; Libras é uma língua completa, com gramática e sinais próprios.</p>`;
}
