// TERMOS DE USO E PRIVACIDADE
// Escritos em linguagem simples, porque o app pode ter crianças e adolescentes.
// Abrem pelas Configurações (Ajuda), pelo cadastro e pela URL ?tela=termos,
// mesmo sem estar logado.
// RASCUNHO do TCC: revisar com o orientador antes de publicar de verdade.

const TERMS_UPDATED_AT = "13/11/2026";

// Cada parte: [título, parágrafos]. Para mudar o texto, é só editar aqui.
const TERMS_SECTIONS = [
  ["O que é o EduSinal", [
    "O EduSinal é um app para aprender Libras, feito como Trabalho de Conclusão de Curso (TCC). Ele é gratuito, não tem propaganda e não vende nada com dinheiro de verdade.",
  ]],
  ["Quem pode usar", [
    "Qualquer pessoa que queira aprender Libras.",
    "Se você tem menos de 12 anos, peça para o seu pai, a sua mãe ou um responsável ler estes termos e criar a conta junto com você. A lei brasileira (LGPD) pede que um responsável concorde quando o usuário é uma criança.",
  ]],
  ["Sua conta", [
    "Para criar a conta, pedimos só um apelido, um e-mail e uma senha.",
    "Use um apelido, e não o seu nome completo. Apelidos com palavrões ou ofensas podem ser trocados ou bloqueados.",
    "Não conte a sua senha para ninguém. Cada pessoa usa a própria conta.",
    "Também dá para experimentar como visitante, sem e-mail e sem senha. O visitante não entra nas ligas, e o progresso dele é apagado depois de 7 dias, ou quando você sai. Se criar a conta antes disso, o progresso vai junto.",
  ]],
  ["Quais dados guardamos", [
    "Apelido, e-mail, a senha embaralhada (ninguém consegue ler a senha, nem a equipe), a meta diária e o seu progresso: atividades feitas, XP, moedas, vidas, energia, ofensiva, itens do mascote e sinais vistos no dicionário.",
    "Não pedimos nome completo, CPF, telefone, endereço, foto, data de nascimento nem localização.",
  ]],
  ["Para que usamos os seus dados", [
    "Só para o app funcionar: você entrar na conta, o seu progresso ficar salvo e as missões e as ligas funcionarem.",
    "Não vendemos nem passamos os seus dados para ninguém, e não usamos para propaganda.",
  ]],
  ["Quem vê o quê", [
    "Nas ligas, os alunos da sua salinha veem o seu apelido, o seu mascote e números do jogo (XP, ofensiva, liga, etapa da trilha, conquistas e o mês em que você entrou). O seu e-mail nunca aparece para ninguém.",
    "Não existe chat nem mensagens entre alunos.",
  ]],
  ["Cookies", [
    "Usamos só um cookie, para você continuar conectado (ele vale 7 dias). O tema, o tamanho do texto e as animações ficam guardados no seu aparelho. Não usamos cookies de propaganda nem de rastreamento.",
  ]],
  ["Segurança", [
    "A senha é guardada embaralhada, e o app publicado usa conexão segura (HTTPS). Mesmo assim, nenhum sistema é 100% seguro: se notar algo estranho na sua conta, troque a senha e avise a equipe.",
  ]],
  ["Os seus direitos", [
    "Você pode ver o seu progresso no Perfil, mudar o apelido e a meta diária quando quiser e apagar a conta em Configurações → Conta → Apagar minha conta. Apagar a conta apaga todos os seus dados de uma vez, para sempre.",
  ]],
  ["Moedas e itens do mascote", [
    "As moedas são do jogo: não valem dinheiro, não podem ser vendidas nem trocadas, e as regras do jogo podem mudar.",
  ]],
  ["Regras de convivência", [
    "Respeite as outras pessoas e não tente burlar o sistema (por exemplo, para ganhar moedas ou XP sem fazer as atividades).",
    "O conteúdo é educativo e está sendo revisado por pessoas surdas fluentes em Libras. Pode ter erros: se encontrar algum, avise a equipe.",
  ]],
  ["Mudanças nestes termos", [
    "Se estes termos mudarem, avisamos no app. A data da última mudança fica no topo desta página.",
  ]],
  ["Contato", [
    "Equipe do EduSinal (TCC). E-mail: [a definir pela equipe].",
  ]],
];

// De onde a pessoa veio, para o "Voltar" levar de volta.
let termsReturnScreen = "more";

function openTerms() {
  // Saindo do cadastro para ler os termos: lembra se a caixinha estava marcada.
  const acceptBox = document.querySelector('input[name="acceptedTerms"]');
  if (acceptBox) signup.acceptedTerms = acceptBox.checked;
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
