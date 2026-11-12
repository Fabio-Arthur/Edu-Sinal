// ATIVIDADE
// Uma atividade é uma lista de passos. Cada passo é:
//   um cartão (type "card"): um sinal novo para aprender. Não tem certo ou
//     errado; "Próximo" passa para o passo seguinte;
//   ou uma pergunta (os outros types, ver conteudo.js).
// Aprender (learn) só tem cartões e não gasta vidas. Exercício (practice),
// prova final e as letras do alfabeto têm perguntas (e podem ter cartões):
//     1. o aluno escolhe uma resposta (pode trocar);
//     2. toca em "Conferir": errar gasta uma vida;
//     3. "Continuar" vai para a próxima; na última, "Concluir".
//   Segunda chance: a pergunta errada volta uma vez no fim da atividade
//   (menos na prova final e no Desafia-me, que têm limite de erros).
//   O exercício é concluído se chegar ao fim com vidas. Na prova final, além
//   disso, pode errar no máximo FINAL_MAX_MISTAKES vezes.
//
// Quem confere as respostas e dá as recompensas é o servidor (ver js/api.js):
//   começar → POST /atividades/{código}/comecar
//   conferir → POST /atividades/{código}/respostas (o servidor diz se acertou)
//   concluir → POST /atividades/{código}/concluir (XP, moedas, energia, ofensiva)

async function startBranch(topicId, branchId) {
  const index = learningTopics[topicId].branches.findIndex((branch) => branch.id === branchId);
  if (branchId !== "final" && !isBranchUnlocked(topicId, index)) return; // fora de ordem: não começa
  if (branchId === "final" && !isFinalUnlocked(topicId)) return;
  await beginLesson({
    topicId,
    branchId,
    kind: activityKind(topicId, branchId),
    steps: numberQuestions(stepsFor(topicId, branchId)), // cartões ou perguntas
  });
}

// Código da atividade para a API: "numeros:pratica-um-a-cinco", "alfabeto:A"...
function lessonCode(lesson = state.currentLesson) {
  return encodeURIComponent(`${lesson.topicId}:${lesson.branchId}`);
}

// Cada pergunta ganha o seu número (a primeira é 0), sem contar os cartões.
// É por esse número que a API sabe qual pergunta o aluno respondeu.
function numberQuestions(steps) {
  let number = 0;
  return steps.map((step) => (isCardStep(step) ? step : { ...step, questionIndex: number++ }));
}

// Começa a atividade: confere no app (energia e vidas), avisa o servidor
// e abre a tela. Devolve a resposta da API (o Desafia-me usa as perguntas dela).
async function beginLesson(lesson) {
  const reason = activityBlockReason(lesson.topicId, lesson.branchId, lesson.kind);
  if (reason) {
    state.currentLesson = lesson;
    setScreen("lesson"); // o setScreen mostra o aviso de energia ou vidas e não abre
    return null;
  }
  let result;
  try {
    result = await api("POST", `/atividades/${lessonCode(lesson)}/comecar`);
  } catch (error) {
    showApiError(error);
    return null;
  }
  applyServerState(result.estado);
  hideToast();
  state.currentLesson = { ...lesson, index: 0, mistakes: 0, outOfLives: false };
  if (result.perguntas.length) state.currentLesson.steps = lesson.makeSteps(result.perguntas);
  setScreen("lesson");
  return result;
}

function currentStep() {
  const lesson = state.currentLesson;
  return lesson.steps[lesson.index];
}

function isFinalExam(lesson = state.currentLesson) {
  return lesson.branchId === "final";
}

// Prova final e Desafia-me: para passar, pode errar no máximo FINAL_MAX_MISTAKES.
function hasMistakeLimit(lesson = state.currentLesson) {
  return isFinalExam(lesson) || Boolean(lesson.isChallenge);
}

function isLearning(lesson = state.currentLesson) {
  return lesson.kind === "learn";
}

function isCardStep(step) {
  return step.type === "card";
}

// ----- Vídeo do sinal -----

// Mostra o vídeo do sinal; enquanto ele não foi gravado, um espaço reservado
// com o nome do sinal ("prévia"), só para dar para testar o protótipo.
function signVideoHtml(sign, size = "large") {
  const video = SIGN_VIDEOS[sign];
  if (video) {
    return `<video class="sign-video sign-video-${size}" src="${video}" autoplay loop muted playsinline aria-label="Vídeo do sinal ${escapeHtml(sign)}"></video>`;
  }
  return `<div class="sign-video sign-video-${size} is-placeholder" role="img" aria-label="Vídeo do sinal ${escapeHtml(sign)} (em produção)">
      ${icon("play-circle-fill", "sign-video-play")}
      <span>Vídeo em produção</span>
      <small class="sign-preview">${size === "small" ? "" : "prévia: "}${escapeHtml(sign)}</small>
    </div>`;
}

// ----- Respostas -----

// Nome da resposta certa, para a mensagem depois de conferir.
// "position" é a posição da certa, que vem do servidor (no verdadeiro ou falso: 0 = Verdadeiro).
function correctAnswerLabel(question, position) {
  if (question.type === "vf") return position === 0 ? "Verdadeiro" : "Falso";
  if (question.type === "palavra-video") return `o vídeo ${optionLetter(position)}`;
  return `“${question.options[position]}”`;
}

function optionLetter(position) {
  return "ABCD"[position];
}

// Título grande de cada tipo de pergunta.
function questionTitle(question) {
  if (question.title) return question.title; // título próprio (ex.: letras do alfabeto)
  if (question.type === "video-palavra") return "O que este sinal significa?";
  if (question.type === "palavra-video") return `Qual é o sinal de “${escapeHtml(question.sign)}”?`;
  if (question.type === "vf") return "Verdadeiro ou falso?";
  return question.q;
}

// Opções em texto: botões grandes, com o número da tecla (1, 2, 3...).
function textOptionsHtml(options) {
  return `<div class="answer-list" role="group" aria-label="Opções de resposta">${options.map((text, position) =>
    `<button class="answer-option" type="button" data-action="select-answer" data-option="${position}" aria-pressed="false"><span class="answer-key" aria-hidden="true">${position + 1}</span><span>${text}</span></button>`,
  ).join("")}</div>`;
}

// Opções em vídeo: cartões com o vídeo de cada sinal e uma letra.
function videoOptionsHtml(signs) {
  return `<div class="answer-grid answer-grid-${signs.length}" role="group" aria-label="Escolha o vídeo">${signs.map((sign, position) =>
    `<button class="answer-option answer-video" type="button" data-action="select-answer" data-option="${position}" aria-pressed="false" aria-label="Vídeo ${optionLetter(position)}">${signVideoHtml(sign, "small")}<span class="answer-key" aria-hidden="true">${optionLetter(position)}</span></button>`,
  ).join("")}</div>`;
}

function trueFalseHtml() {
  return `<div class="answer-tf" role="group" aria-label="Verdadeiro ou falso">
      <button class="answer-option answer-true" type="button" data-action="select-answer" data-option="0" aria-pressed="false">${icon("check-lg")}<span>Verdadeiro</span></button>
      <button class="answer-option answer-false" type="button" data-action="select-answer" data-option="1" aria-pressed="false">${icon("x-lg")}<span>Falso</span></button>
    </div>`;
}

// O meio da tela de um exercício, conforme o tipo da pergunta.
function questionBodyHtml(question) {
  if (question.type === "video-palavra") return `<div class="question-split">${signVideoHtml(question.sign)}${textOptionsHtml(question.options)}</div>`;
  if (question.type === "palavra-video") return videoOptionsHtml(question.options);
  if (question.type === "vf") return `<blockquote class="tf-statement">${question.q}</blockquote>${trueFalseHtml()}`;
  return textOptionsHtml(question.options);
}

// ----- Tela -----

// Linha pequena do topo: etapa · atividade · passo.
function lessonKicker() {
  const lesson = state.currentLesson;
  const position = `${lesson.index + 1} de ${lesson.steps.length}`;
  if (lesson.isChallenge) return `Dicionário · Desafia-me · ${position}`;
  const topic = learningTopics[lesson.topicId];
  const name = isFinalExam() ? "Prova final" : topic.branches.find((branch) => branch.id === lesson.branchId).label;
  return `${topic.title} · ${name} · ${position}`;
}

function renderLesson() {
  const lesson = state.currentLesson;
  const step = currentStep();
  const total = lesson.steps.length;
  const isLast = lesson.index === total - 1;
  const progress = Math.round((lesson.index / total) * 100);

  // Cartão: o sinal novo e o botão para seguir. Pergunta: as opções e "Conferir".
  let body;
  let footerHint;
  let button;
  if (isCardStep(step)) {
    body = `<h2>${step.title || "Sinal novo"}</h2>${signVideoHtml(step.sign)}<p class="learn-word">${escapeHtml(step.label || step.sign)}</p><p class="learn-tip">${step.tip}</p>`;
    footerHint = `${icon("eye-fill")} Assista ao sinal e repita com as mãos.`;
    button = `<button class="button-3d button-3d-primary lesson-next" id="lesson-continue" type="button" data-action="${isLast ? "finish-lesson" : "next-question"}">${isLast ? "Concluir" : "Próximo"}</button>`;
  } else {
    const retryTag = step.isRetry ? `<span class="lesson-retry">${icon("arrow-counterclockwise")} Segunda chance</span>` : "";
    body = `${retryTag}<h2>${questionTitle(step)}</h2>${questionBodyHtml(step)}`;
    footerHint = "";
    if (isFinalExam()) footerHint = `${icon("trophy-fill")} Prova final: para passar, erre no máximo ${FINAL_MAX_MISTAKES}.`;
    if (lesson.isChallenge) footerHint = `${icon("lightning-charge-fill")} Desafio: para vencer, erre no máximo ${FINAL_MAX_MISTAKES}.`;
    button = `<button class="button-3d button-3d-primary lesson-next" id="lesson-continue" type="button" data-action="check-answer" disabled>Conferir</button>`;
  }

  const status = isLearning()
    ? `<span class="lesson-badge">${icon("book-fill")} Aprender</span>`
    : `<span class="lesson-lives" aria-label="${state.lives} de ${MAX_LIVES} vidas">${icon("heart-fill")}<strong>${state.lives}</strong></span>`;

  return `
    <section class="lesson is-${lesson.kind}" aria-labelledby="lesson-kicker">
      <header class="lesson-top">
        <button class="lesson-close" type="button" data-action="leave-lesson" aria-label="Sair da atividade" title="Sair">${icon("x-lg")}</button>
        <div class="lesson-progress" role="progressbar" aria-label="Progresso da atividade" aria-valuenow="${lesson.index}" aria-valuemin="0" aria-valuemax="${total}"><span id="lesson-progress-bar" style="width: ${progress}%"></span></div>
        ${status}
      </header>
      <div class="lesson-body">
        <p class="lesson-kicker" id="lesson-kicker">${escapeHtml(lessonKicker())}</p>
        ${body}
      </div>
      <footer class="lesson-footer" id="lesson-footer">
        <div class="lesson-footer-inner">
          <div class="lesson-feedback" id="answer-feedback" aria-live="polite">${footerHint}</div>
          ${button}
        </div>
      </footer>
    </section>`;
}

// 1º passo: o aluno escolhe uma resposta (pode trocar antes de conferir).
function selectAnswer(clickedButton) {
  if (state.answered) return;
  document.querySelectorAll(".answer-option").forEach((option) => {
    option.classList.toggle("is-selected", option === clickedButton);
    option.setAttribute("aria-pressed", String(option === clickedButton));
  });
  document.getElementById("lesson-continue").disabled = false;
}

// Frases de "acertou", variando a cada pergunta.
const CORRECT_TITLES = ["Muito bem!", "Isso aí!", "Mandou bem!", "Certinho!"];

// 2º passo: "Conferir" pergunta ao servidor se acertou e decide o que vem depois.
async function checkAnswer() {
  const lesson = state.currentLesson;
  const chosen = document.querySelector(".answer-option.is-selected");
  if (state.answered || !chosen) return;
  state.answered = true; // trava o botão enquanto o servidor responde (nada de clique duplo)

  const question = currentStep();
  let result;
  try {
    result = await api("POST", `/atividades/${lessonCode()}/respostas`, {
      pergunta: question.questionIndex,
      resposta: Number(chosen.dataset.option),
      rodada: question.isRetry ? 2 : 1, // 2 = a segunda chance da mesma pergunta
    });
  } catch (error) {
    state.answered = false; // deu erro: deixa tentar de novo
    showApiError(error);
    return;
  }
  applyServerState(result.estado); // as vidas já vêm certas do servidor

  const rightOption = result.resposta_certa;
  const isCorrect = result.correta;
  const getsRetry = !isCorrect && !question.isRetry && !hasMistakeLimit();
  if (getsRetry) lesson.steps.push({ ...question, isRetry: true }); // volta no fim, uma vez só
  if (!isCorrect) {
    lesson.mistakes += 1;
    const lives = document.querySelector(".lesson-lives");
    lives.querySelector("strong").textContent = state.lives;
    lives.setAttribute("aria-label", `${state.lives} de ${MAX_LIVES} vidas`);
    lives.classList.add("is-losing"); // coração treme
  }

  document.querySelectorAll(".answer-option").forEach((option) => {
    option.disabled = true;
    if (Number(option.dataset.option) === rightOption) option.classList.add("is-correct");
    else if (option === chosen) option.classList.add("is-incorrect");
  });
  document.getElementById("lesson-progress-bar").style.width = `${Math.round(((lesson.index + 1) / lesson.steps.length) * 100)}%`;

  // Faixa de baixo: verde-turquesa se acertou, coral se errou
  document.getElementById("lesson-footer").classList.add(isCorrect ? "is-correct" : "is-incorrect");
  let title = isCorrect ? CORRECT_TITLES[lesson.index % CORRECT_TITLES.length] : `Quase! A resposta certa é ${correctAnswerLabel(question, rightOption)}.`;
  if (isCorrect && question.isRetry) title = "Agora foi!";
  const retryNote = getsRetry ? " Ela volta no final para você tentar de novo." : "";
  document.getElementById("answer-feedback").innerHTML = `
    <span class="feedback-icon">${icon(isCorrect ? "check-lg" : "x-lg")}</span>
    <span><strong>${title}</strong><small>${question.explain}${retryNote}</small></span>`;
  // a faixa cresce com a explicação: o conteúdo ganha espaço para não ficar embaixo dela
  const footer = document.getElementById("lesson-footer");
  document.querySelector(".lesson").style.paddingBottom = `${footer.offsetHeight + 16}px`;

  // O que o botão faz agora
  const button = document.getElementById("lesson-continue");
  const isLast = lesson.index === lesson.steps.length - 1;
  const failedExam = hasMistakeLimit() && lesson.mistakes > FINAL_MAX_MISTAKES;
  if (!isCorrect && state.lives === 0) {
    lesson.outOfLives = true;
    button.dataset.action = "finish-lesson";
    button.textContent = "Sair";
  } else if (isLast || failedExam) {
    button.dataset.action = "finish-lesson";
    button.textContent = failedExam ? "Ver resultado" : "Concluir";
  } else {
    button.dataset.action = "next-question";
    button.textContent = "Continuar";
  }
  button.focus({ preventScroll: true });
}

function nextQuestion() {
  state.currentLesson.index += 1;
  state.answered = false;
  render();
  (document.querySelector(".answer-option") || document.getElementById("lesson-continue"))?.focus({ preventScroll: true });
}

// Depois da atividade: volta direto para a árvore da etapa (sem a animação de
// abrir, que é só a partir da Home) ou, nas letras, para o alfabeto do dicionário.
function returnFromLesson(lesson) {
  if (lesson.topicId === DICTIONARY_TOPIC) {
    setScreen("signs"); // o Desafia-me volta para o dicionário
    return;
  }
  setScreen("trail");
  state.focusTopic = lesson.topicId;
  render();
}

// Fim da atividade: conclui (e premia na 1ª vez) ou explica por que não passou.
async function finishLesson() {
  const lesson = state.currentLesson;
  const failedExam = hasMistakeLimit(lesson) && lesson.mistakes > FINAL_MAX_MISTAKES;

  // Sem vidas ou reprovado: nem pergunta ao servidor (não tem prêmio).
  if (lesson.outOfLives) {
    showToast("Suas vidas acabaram. Elas voltam com o tempo; enquanto isso, revise no dicionário.");
    returnFromLesson(lesson);
    return;
  }
  if (failedExam) {
    showToast(`Você errou ${lesson.mistakes}. ${lesson.isChallenge ? "No desafio" : "Na prova"}, pode errar no máximo ${FINAL_MAX_MISTAKES}. Tente de novo!`);
    returnFromLesson(lesson);
    return;
  }

  let result;
  try {
    result = await api("POST", `/atividades/${lessonCode(lesson)}/concluir`);
  } catch (error) {
    showApiError(error);
    returnFromLesson(lesson);
    return;
  }
  applyServerState(result.estado);
  showToast(finishMessage(lesson, result));
  returnFromLesson(lesson);
}

// A mensagem do fim da atividade, com o que o servidor deu de prêmio.
function finishMessage(lesson, result) {
  const prize = `+${result.xp_ganho} XP e +${result.moedas_ganhas} moedas`;
  if (lesson.isChallenge) {
    return result.primeira_vez
      ? `Desafio vencido! ${prize}.`
      : "Desafio vencido! O prêmio de hoje você já ganhou: volte amanhã para outro.";
  }
  if (!result.primeira_vez) return "Revisão concluída!";
  if (result.item_ganho) return `Primeira atividade concluída: ${prize} e um broche para o mascote!`;
  if (isFinalExam(lesson)) {
    const next = TOPIC_ORDER[TOPIC_ORDER.indexOf(lesson.topicId) + 1];
    return next ? `Etapa concluída! “${learningTopics[next].title}” foi liberada. ${prize}.` : `Etapa concluída! ${prize}.`;
  }
  if (state.energy === 0) return `Atividade concluída! Sua energia acabou: ela volta aos poucos (${timeUntilNextEnergy()}).`;
  return `Atividade concluída: ${prize} e −1 de energia.`;
}

// Sair no meio: volta para a árvore sem concluir (vidas perdidas não voltam).
function leaveLesson() {
  const lesson = state.currentLesson;
  if (lesson) returnFromLesson(lesson);
  else setScreen("trail");
}

// Teclado na atividade: 1 a 4 escolhem a resposta; Enter confere ou continua.
function handleLessonKey(event) {
  if (state.screen !== "lesson") return false;
  if (/^[1-4]$/.test(event.key) && !state.answered) {
    const option = document.querySelector(`.answer-option[data-option="${Number(event.key) - 1}"]`);
    if (option) selectAnswer(option);
    return Boolean(option);
  }
  if (event.key === "Enter" && event.target.tagName !== "BUTTON") {
    const button = document.getElementById("lesson-continue");
    if (button && !button.disabled) button.click();
    return true;
  }
  return false;
}
