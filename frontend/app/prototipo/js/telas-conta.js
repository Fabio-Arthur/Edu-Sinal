// CADASTRO E LOGIN
// Telas de cadastro e entrada, e a validação dos dados. A conta fica no
// servidor (POST /auth/cadastro e /auth/login, ver js/api.js). A senha só
// passa pela memória do app até ser enviada: nunca é salva no navegador.
//
// Cadastro e login são por etapas, uma pergunta por tela (como nos exercícios):
//   cadastro: apelido → e-mail → senha → meta diária → "Tudo pronto!";
//   login: e-mail → senha → "deixa eu ver se te conheço…" → "Me lembrei!".
// Não pede idade: quando houver servidor, crianças vão precisar do
// consentimento de um responsável (LGPD) e isso será tratado lá.

const WELCOME_COINS = 20; // moedas de boas-vindas de um perfil novo

// Senha no estilo do Duolingo: simples de criar, sem obrigar maiúscula,
// número e símbolo. Vale o tamanho mínimo e não pode ser uma senha óbvia.
// (O servidor confere a mesma coisa em senha_service.py.)
const PASSWORD_MIN_LENGTH = 8;
const OBVIOUS_PASSWORDS = ["12345678", "123456789", "1234567890", "87654321", "11111111", "00000000",
  "senha123", "senha1234", "password", "qwertyui", "abcdefgh", "abc12345", "edusinal", "libras123"];

// Devolve o problema da senha (para mostrar ao aluno) ou "" se está tudo certo.
function passwordProblem(password, nickname = "", email = "") {
  const lower = password.toLowerCase();
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (OBVIOUS_PASSWORDS.includes(lower) || new Set(lower).size === 1) return "Essa senha é fácil demais de adivinhar. Tente outra.";
  if ((nickname && lower === nickname.toLowerCase()) || (email && lower === email.split("@")[0].toLowerCase())) {
    return "A senha não pode ser igual ao seu apelido ou e-mail.";
  }
  return "";
}

// ----- Cadastro por etapas -----

// Campo de senha com o botão de olhinho para mostrar/esconder o que foi digitado.
function passwordField(id, name, label, autocomplete, placeholder) {
  return `<label class="field-label" for="${id}">${label}<span class="password-field"><input id="${id}" name="${name}" type="password" autocomplete="${autocomplete}" placeholder="${placeholder}" /><button class="password-toggle" type="button" data-action="toggle-password" data-target="${id}" aria-label="Mostrar a senha" aria-pressed="false">${icon("eye-fill")}</button></span></label>`;
}

// Mostra ou esconde a senha sem redesenhar a tela (o que já foi digitado fica).
function togglePassword(button) {
  const input = document.getElementById(button.dataset.target);
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.setAttribute("aria-pressed", String(show));
  button.setAttribute("aria-label", show ? "Esconder a senha" : "Mostrar a senha");
  button.innerHTML = icon(show ? "eye-slash-fill" : "eye-fill");
  input.focus();
}

const SIGNUP_STEPS = ["nickname", "email", "password", "goal"];
const GOAL_OPTIONS = [
  { value: 1, title: "Leve", text: "1 atividade por dia", icon: "cup-hot-fill" },
  { value: 3, title: "Normal", text: "3 atividades por dia", icon: "lightning-charge-fill" },
  { value: 5, title: "Puxado", text: "5 atividades por dia", icon: "fire" },
];

// Respostas enquanto o cadastro não termina (a senha nunca fica guardada).
// keptProgress: era visitante e a conta guardou o progresso que ele já tinha.
let signup = { step: 0, nickname: "", email: "", password: "", acceptedTerms: false, goal: DAILY_GOAL, done: false, keptProgress: false };

function resetSignup() {
  signup = { step: 0, nickname: "", email: "", password: "", acceptedTerms: false, goal: DAILY_GOAL, done: false, keptProgress: false };
}

// O que cada etapa pergunta e mostra.
function signupStepHtml(stepName) {
  if (stepName === "nickname") {
    return {
      question: "Como você quer ser chamado(a)?",
      body: `<label class="field-label" for="signup-nickname">Apelido<input id="signup-nickname" name="nickname" value="${escapeHtml(signup.nickname)}" maxlength="20" autocomplete="nickname" placeholder="Ex.: Mari, Lu, Biel" /></label>
        <p class="field-hint">${icon("shield-fill-check")} É o nome que aparece nas ligas. Não use seu nome completo.</p>`,
    };
  }
  if (stepName === "email") {
    return {
      question: `Prazer, ${escapeHtml(signup.nickname)}! Qual é o seu e-mail?`,
      body: `<label class="field-label" for="signup-email">E-mail<input id="signup-email" name="email" type="email" value="${escapeHtml(signup.email)}" autocomplete="email" placeholder="voce@email.com" /></label>
        <p class="field-hint">${icon("envelope-fill")} Serve para você entrar de novo na sua conta.</p>`,
    };
  }
  if (stepName === "password") {
    return {
      question: "Agora crie uma senha.",
      body: `${passwordField("signup-password", "password", "Senha", "new-password", "Crie uma senha")}
        ${passwordField("signup-confirm-password", "passwordConfirmation", "Confirme a senha", "new-password", "Digite a senha de novo")}
        <p class="field-hint">${icon("lock-fill")} Pelo menos 8 caracteres. Dica: uma frase curta que só você conhece é fácil de lembrar e difícil de adivinhar.</p>
        <label class="signup-terms"><input type="checkbox" name="acceptedTerms"${signup.acceptedTerms ? " checked" : ""} /><span>Li e aceito os <button class="text-button" type="button" data-action="open-terms">termos de uso e privacidade</button> do EduSinal.</span></label>`,
    };
  }
  return {
    question: "Quantas atividades você quer fazer por dia?",
    body: `<div class="onboard-goals" role="radiogroup" aria-label="Meta diária">${GOAL_OPTIONS.map((goal) => {
      const isActive = signup.goal === goal.value;
      return `<button class="onboard-goal${isActive ? " is-active" : ""}" type="button" role="radio" aria-checked="${isActive}" data-action="signup-goal" data-value="${goal.value}"><span class="onboard-goal-icon">${icon(goal.icon)}</span><span><strong>${goal.title}</strong><small>${goal.text}</small></span></button>`;
    }).join("")}</div>
      <p class="field-hint">${icon("sliders")} Dá para mudar depois em Configurações.</p>`,
  };
}

// Uma etapa: barra de progresso, o mascote perguntando num balão, os campos
// e o botão grande embaixo. Usada pelo cadastro e pelo login.
function renderOnboardStep({ formId, step, total, backAction, question, body, error = "", footerExtra = "", submitLabel }) {
  const progress = Math.round((step / total) * 100);
  return `
    <section class="onboard" aria-labelledby="onboard-title">
      <header class="onboard-top">
        <button class="lesson-close" type="button" data-action="${backAction}" aria-label="${step === 0 ? "Voltar ao início" : "Voltar uma etapa"}">${icon(step === 0 ? "x-lg" : "arrow-left")}</button>
        <div class="onboard-progress" role="progressbar" aria-label="Etapas" aria-valuenow="${step + 1}" aria-valuemin="1" aria-valuemax="${total}"><span style="width: ${progress}%"></span></div>
        <small>${step + 1} de ${total}</small>
      </header>
      <form class="onboard-body" id="${formId}" novalidate>
        <div class="onboard-ask">
          <span class="onboard-mascot mascot-backdrop">${mascotSvg(DEFAULT_LOOK, "avatar", "")}</span>
          <h2 class="onboard-bubble" id="onboard-title">${question}</h2>
        </div>
        <div class="onboard-fields">${body}</div>
        <p class="form-error" id="form-error" role="alert" aria-live="polite">${error}</p>
        <div class="onboard-footer">
          ${footerExtra}
          <button class="button-3d button-3d-primary onboard-next" type="submit">${submitLabel}</button>
        </div>
      </form>
    </section>`;
}

function renderSignup() {
  if (signup.done) return renderSignupDone();
  const { question, body } = signupStepHtml(SIGNUP_STEPS[signup.step]);
  return renderOnboardStep({
    formId: "signup-form",
    step: signup.step,
    total: SIGNUP_STEPS.length,
    backAction: "signup-back",
    question,
    body,
    footerExtra: signup.step === 0 ? '<p class="onboard-login">Já tem uma conta? <button class="text-button" type="button" data-screen="login">Entrar</button></p>' : "",
    submitLabel: signup.step === SIGNUP_STEPS.length - 1 ? "Criar conta" : "Continuar",
  });
}

// Fim do cadastro: confirma que a conta foi criada (antes ia direto para a Home).
function renderSignupDone() {
  const goal = GOAL_OPTIONS.find((option) => option.value === state.dailyGoal) || GOAL_OPTIONS[1];
  const text = signup.keptProgress
    ? `Sua conta foi criada e <strong>todo o seu progresso foi salvo</strong>. Sua meta é <strong>${goal.text}</strong>.`
    : `Sua conta foi criada. Você ganhou <strong>${WELCOME_COINS} moedas</strong> de boas-vindas e sua meta é <strong>${goal.text}</strong>.`;
  return `
    <section class="onboard onboard-done" aria-labelledby="done-title">
      <button class="welcome-mascot mascot-backdrop" type="button" data-action="mascot-react" aria-label="Mascote do EduSinal">${mascotSvg(state.mascot, "full", "", { animated: true })}</button>
      <h2 id="done-title">Tudo pronto, ${escapeHtml(state.name)}!</h2>
      <p>${text}</p>
      <button class="button-3d button-3d-primary onboard-next" type="button" data-action="signup-start">${signup.keptProgress ? "Continuar de onde parei" : "Começar a primeira etapa"}</button>
    </section>`;
}

// Volta uma etapa (na primeira, volta para a tela inicial, ou para o Perfil do visitante).
function signupBack() {
  if (signup.step === 0) {
    setScreen(state.isGuest ? "profile" : "intro");
    return;
  }
  signup.step -= 1;
  render();
  focusSignupField();
}

function chooseSignupGoal(value) {
  signup.goal = Number(value);
  render();
}

// Coloca o cursor no campo da etapa nova (cadastro e login).
function focusSignupField() {
  const field = document.querySelector(".onboard-fields input, .onboard-goal.is-active");
  if (field) field.focus();
}

// ----- Login por etapas -----
// status: "ask" (perguntando), "checking" (o mascote pensando) ou "done".
// A conferência só acontece depois do e-mail E da senha, e o erro é o mesmo
// para os dois casos: assim ninguém descobre quais e-mails têm conta
// ("enumeração de contas"), o que vai importar quando houver servidor.

const LOGIN_STEPS = ["email", "password"];
const LOGIN_THINK_MS = 1600; // tempo do mascote "pensando"

let login = { step: 0, email: "", status: "ask", error: "" };

function resetLogin() {
  login = { step: 0, email: "", status: "ask", error: "" };
}

function renderLogin() {
  if (login.status === "checking") return renderLoginChecking();
  if (login.status === "done") return renderLoginDone();
  const isEmail = LOGIN_STEPS[login.step] === "email";
  return renderOnboardStep({
    formId: "login-form",
    step: login.step,
    total: LOGIN_STEPS.length,
    backAction: "login-back",
    question: isEmail ? "Oi de novo! Qual é o seu e-mail?" : "Agora a senha.",
    body: isEmail
      ? `<label class="field-label" for="login-email">E-mail<input id="login-email" name="email" type="email" value="${escapeHtml(login.email)}" autocomplete="username" placeholder="voce@email.com" /></label>`
      : passwordField("login-password", "password", "Senha", "current-password", "Sua senha"),
    error: login.error,
    footerExtra: isEmail ? '<p class="onboard-login">Ainda não tem conta? <button class="text-button" type="button" data-screen="signup">Criar conta</button></p>' : "",
    submitLabel: isEmail ? "Continuar" : "Entrar",
  });
}

// O mascote cutucando a cabeça, tentando lembrar.
function renderLoginChecking() {
  return `
    <section class="onboard onboard-done" aria-live="polite">
      <span class="welcome-mascot mascot-backdrop">${mascotSvg(DEFAULT_LOOK, "full", "", { animated: true })}</span>
      <h2>Hmm… deixa eu ver se esse e-mail é familiar<span class="thinking-dots"><span>.</span><span>.</span><span>.</span></span></h2>
    </section>`;
}

function renderLoginDone() {
  const streak = state.streak > 0
    ? `Sua ofensiva está em <strong>${state.streak} ${state.streak === 1 ? "dia" : "dias"}</strong>. Bora manter?`
    : "Que tal começar uma ofensiva nova hoje?";
  return `
    <section class="onboard onboard-done" aria-labelledby="login-done-title">
      <button class="welcome-mascot mascot-backdrop" type="button" data-action="mascot-react" aria-label="Mascote de ${escapeHtml(state.name)}">${mascotSvg(state.mascot, "full", "", { animated: true })}</button>
      <p class="onboard-kicker">Me lembrei! :D</p>
      <h2 id="login-done-title">Bem-vindo(a) de volta, ${escapeHtml(state.name)}!</h2>
      <p>${streak}</p>
      <button class="button-3d button-3d-primary onboard-next" type="button" data-action="login-start">Continuar de onde parei</button>
    </section>`;
}

function loginBack() {
  if (login.step === 0) {
    setScreen("intro");
    return;
  }
  login.step -= 1;
  login.error = "";
  render();
  focusSignupField();
}

// Confere a etapa atual do cadastro. Devolve o texto do erro, ou "" quando está tudo certo.
function validateSignupStep(form) {
  const stepName = SIGNUP_STEPS[signup.step];
  if (stepName === "nickname") {
    const nickname = form.elements.nickname.value.trim();
    if (nickname.length < 2) return "O apelido precisa ter pelo menos 2 letras.";
    if (!/^[\p{L}\p{N} ]+$/u.test(nickname)) return "Use só letras, números e espaços no apelido.";
  }
  if (stepName === "email" && (!form.elements.email.value.trim() || !form.elements.email.validity.valid)) return "Informe um e-mail válido.";
  if (stepName === "password") {
    const password = form.elements.password.value;
    const problem = passwordProblem(password, signup.nickname, signup.email);
    if (problem) return problem;
    if (password !== form.elements.passwordConfirmation.value) return "As senhas não conferem.";
    if (!form.elements.acceptedTerms.checked) return "Para criar a conta, marque que leu e aceita os termos de uso.";
  }
  return "";
}

async function handleLoginSubmit(form) {
  const isEmail = LOGIN_STEPS[login.step] === "email";
  let error = "";
  if (isEmail && (!form.elements.email.value.trim() || !form.elements.email.validity.valid)) error = "Informe um e-mail válido.";
  if (!isEmail && !form.elements.password.value) error = "Digite sua senha.";
  document.getElementById("form-error").textContent = error;
  if (error) return;

  if (isEmail) {
    login.email = form.elements.email.value.trim().toLowerCase();
    login.step = 1;
    login.error = "";
    render();
    focusSignupField();
    return;
  }

  // senha preenchida: o mascote "pensa" enquanto o servidor confere
  const password = form.elements.password.value;
  login.status = "checking";
  render();
  playMascotReaction();
  setTimeout(playMascotReaction, 800);
  const thinking = new Promise((resolve) => setTimeout(resolve, LOGIN_THINK_MS)); // o mascote pensa pelo menos um pouquinho
  let estado = null;
  let loginError = null;
  try {
    estado = await api("POST", "/auth/login", { email: login.email, senha: password });
  } catch (caught) {
    loginError = caught;
  }
  await thinking;
  if (state.screen !== "login") return; // a pessoa saiu da tela no meio
  if (loginError) {
    // e-mail ou senha errados: a mesma mensagem para os dois (o servidor não diz qual)
    const message = loginError.status === 401 ? "Não consegui lembrar de você… Confere o e-mail e a senha, ou crie uma conta." : loginError.message;
    login = { step: 0, email: login.email, status: "ask", error: message };
    render();
    focusSignupField();
    return;
  }
  applyServerState(estado);
  login.status = "done";
  render();
  playMascotReaction();
}

// "Continuar" de cada etapa: guarda a resposta e vai para a próxima.
// Na última, cria o perfil e mostra o "Tudo pronto!".
async function handleSignupSubmit(form) {
  const errorBox = document.getElementById("form-error");
  const error = validateSignupStep(form);
  errorBox.textContent = error;
  if (error) return;

  const stepName = SIGNUP_STEPS[signup.step];
  if (stepName === "nickname") signup.nickname = form.elements.nickname.value.trim().replace(/\s+/g, " ");
  if (stepName === "email") signup.email = form.elements.email.value.trim().toLowerCase();
  if (stepName === "password") {
    signup.password = form.elements.password.value;
    signup.acceptedTerms = true;
  }
  if (signup.step < SIGNUP_STEPS.length - 1) {
    signup.step += 1;
    render();
    focusSignupField();
    return;
  }

  // Última etapa: cria a conta no servidor (que já deixa logado).
  // Visitante: a conta de visitante ganha e-mail e senha e guarda o progresso.
  const wasGuest = state.isGuest;
  try {
    applyServerState(await api("POST", wasGuest ? "/auth/visitante/conta" : "/auth/cadastro", {
      apelido: signup.nickname,
      email: signup.email,
      senha: signup.password,
      meta_diaria: signup.goal,
      aceitou_termos: signup.acceptedTerms,
    }));
  } catch (error) {
    // E-mail já cadastrado: volta para a etapa do e-mail com o aviso.
    if (error.status === 409) {
      signup.step = SIGNUP_STEPS.indexOf("email");
      render();
      document.getElementById("form-error").textContent = error.message;
      focusSignupField();
    } else {
      errorBox.textContent = error.message;
    }
    return;
  }
  signup.password = ""; // a senha sai da memória assim que a conta foi criada
  signup.done = true;
  signup.keptProgress = wasGuest;
  render();
  playMascotReaction(); // comemoração: cutucada na cabeça
}
