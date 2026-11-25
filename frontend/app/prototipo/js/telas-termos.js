// TERMOS DE USO E PRIVACIDADE
// Escritos em linguagem simples, porque o app pode ter crianças e adolescentes.
// Abrem pelas Configurações (Ajuda), pelo cadastro e pela URL ?tela=termos,
// mesmo sem estar logado.
// RASCUNHO do TCC: revisar com o orientador antes de publicar de verdade.

const TERMS_UPDATED_AT = "25/11/2026";

// Cada parte: [título, parágrafos]. Para mudar o texto, é só editar aqui.
// Organização do texto do Erick (equipe), ajustada ao que o app faz hoje.
const TERMS_SECTIONS = [
  ["O que é o EduSinal", [
    "O EduSinal é uma plataforma digital de ensino de Libras, feita como Trabalho de Conclusão de Curso (TCC). Todo o conteúdo é gratuito: o app não tem propaganda e não vende nada com dinheiro de verdade.",
  ]],
  ["Quem pode usar", [
    "Qualquer pessoa que queira aprender Libras.",
    "Se você tem menos de 12 anos, peça para o seu pai, a sua mãe ou um responsável ler estes termos e criar a conta junto com você. A lei brasileira (LGPD) pede que um responsável concorde quando o usuário é uma criança.",
  ]],
  ["Sua conta e o Modo Visitante", [
    "<strong>Cadastro:</strong> pedimos só um apelido, um e-mail e uma senha. Use um apelido, e não o seu nome completo. Apelidos com palavrões ou ofensas podem ser trocados ou bloqueados.",
    "<strong>Senha:</strong> ela é guardada embaralhada, e ninguém consegue lê-la, nem a equipe. Não conte a sua senha para ninguém: cada pessoa usa a própria conta.",
    "<strong>Modo Visitante:</strong> dá para experimentar o app sem e-mail e sem senha. O visitante não entra nas ligas, e o progresso dele fica salvo no nosso servidor até ele sair, ou por até 7 dias. Se criar a conta antes disso, o progresso vai junto.",
  ]],
  ["Moedas e compras", [
    "<strong>Moedas do jogo:</strong> as moedas e as vidas servem só para aprender no app. Não valem dinheiro, não podem ser vendidas, trocadas nem sacadas, e as regras do jogo podem mudar.",
    "<strong>Sem compras com dinheiro:</strong> hoje o EduSinal não tem planos pagos e não pede dados de cartão. Se isso mudar um dia, estes termos serão atualizados antes, explicando preços, pagamento e reembolso.",
  ]],
  ["Quais dados guardamos", [
    "Guardamos só o necessário para o app funcionar.",
    "<strong>Dados de cadastro:</strong> apelido, e-mail, a senha embaralhada e a meta diária.",
    "<strong>Dados de progresso:</strong> atividades feitas, XP, moedas, vidas, energia, ofensiva, itens do mascote e sinais vistos no dicionário.",
    "<strong>O que não pedimos:</strong> nome completo, CPF, telefone, endereço, foto, data de nascimento nem localização.",
  ]],
  ["Para que usamos os seus dados", [
    "Só para o app funcionar: você entrar na conta, o seu progresso ficar salvo e as missões e as ligas funcionarem.",
    "Não vendemos nem passamos os seus dados para ninguém, e não usamos para propaganda.",
  ]],
  ["Interação e privacidade", [
    "Nas ligas, os alunos da sua salinha veem o seu apelido, o seu mascote e números do jogo (XP, ofensiva, liga, etapa da trilha, conquistas e o mês em que você entrou). O seu e-mail nunca aparece para ninguém.",
    "Não existe chat nem mensagens entre alunos, para o ambiente ser seguro para todas as idades.",
    "<strong>Equipe do EduSinal:</strong> os administradores (a equipe do TCC) veem a lista de usuários com o apelido, o mascote e os números do jogo, para cuidar do app. Eles também não veem o seu e-mail nem a sua senha.",
  ]],
  ["Cookies", [
    "Usamos só um cookie, para você continuar conectado (ele vale 7 dias). Ele é essencial: sem ele não dá para entrar na conta, por isso avisamos na primeira visita em vez de pedir permissão. O tema, o tamanho do texto, as animações e se você já viu esse aviso ficam guardados só no seu aparelho. Não usamos cookies de propaganda, de estatística nem de rastreamento.",
  ]],
  ["Segurança e garantias", [
    "A senha é guardada embaralhada, e o app publicado usa conexão segura (HTTPS). Mesmo assim, nenhum sistema é 100% seguro: se notar algo estranho na sua conta, troque a senha e avise a equipe.",
    "O conteúdo é educativo e está sendo revisado por pessoas surdas fluentes em Libras. Pode ter erros: se encontrar algum, avise a equipe.",
  ]],
  ["Regras de conduta", [
    "Respeite as outras pessoas e não tente burlar o sistema (por exemplo, para ganhar XP ou moedas sem fazer as atividades). Contas que desrespeitarem estas regras podem ser apagadas pela equipe.",
  ]],
  ["Seus direitos (LGPD)", [
    "Você pode ver o seu progresso no Perfil, mudar o apelido e a meta diária quando quiser e apagar a conta em Configurações → Conta → Apagar minha conta. Apagar a conta apaga todos os seus dados de uma vez, para sempre.",
  ]],
  ["Mudanças nestes termos", [
    "Se estes termos mudarem, avisamos no app. A data da última mudança fica no topo desta página.",
  ]],
  ["Contato", [
    "Dúvidas ou suporte? Fale com a equipe do EduSinal (TCC) pelo e-mail: <a href=\"mailto:edusinal.SC@gmail.com\">edusinal.SC@gmail.com</a>.",
  ]],
];

// De onde a pessoa veio, para o "Voltar" levar de volta.
let termsReturnScreen = "more";

function openTerms() {
  // Saindo do cadastro para ler os termos: lembra a caixinha e as senhas
  // digitadas (só na memória da página, nunca no navegador).
  const acceptBox = document.querySelector('input[name="acceptedTerms"]');
  if (acceptBox) signup.acceptedTerms = acceptBox.checked;
  const password = document.getElementById("signup-password");
  const confirmation = document.getElementById("signup-confirm-password");
  if (password) signup.password = password.value;
  if (confirmation) signup.passwordConfirmation = confirmation.value;
  termsReturnScreen = state.screen === "terms" ? termsReturnScreen : state.screen;
  setScreen("terms");
}

function closeTerms() {
  setScreen(termsReturnScreen || (state.isRegistered ? "more" : "intro"));
}

function renderTerms() {
  const sections = TERMS_SECTIONS.map(([title, paragraphs], position) => `
      <section class="terms-section" aria-labelledby="terms-${position}">
        <h3 id="terms-${position}">${position + 1}. ${title}</h3>
        ${paragraphs.map((text) => `<p>${text}</p>`).join("")}
      </section>`).join("");

  return `
    <section class="terms" aria-labelledby="terms-title">
      <header class="terms-header">
        <button class="back-button" type="button" data-action="close-terms" aria-label="Voltar" title="Voltar">${icon("arrow-left")}</button>
        <div>
          <h2 id="terms-title">Termos de uso e privacidade</h2>
          <p>Atualizado em ${TERMS_UPDATED_AT}. Escrito do jeito mais simples possível.</p>
        </div>
      </header>
      <div class="terms-text" tabindex="0" aria-label="Texto dos termos (role para ler tudo)">${sections}</div>
    </section>`;
}
