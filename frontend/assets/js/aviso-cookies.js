// AVISO DE COOKIES (página inicial e app)
// O EduSinal usa só um cookie: o da sessão, que mantém a pessoa conectada.
// Ele é essencial (sem ele ninguém consegue entrar na conta). Pelo Guia de
// Cookies da ANPD (LGPD), cookie essencial não precisa de consentimento, mas
// precisa ser informado com transparência. Por isso o aviso só informa e tem
// "Entendi": não existe "Recusar" porque não há nenhum cookie opcional
// (nada de propaganda, estatística ou rastreamento).
// Aparece uma vez por aparelho: vale para a página inicial e para o app.
(function () {
  const SEEN_KEY = "edusinal-aviso-cookies";
  try {
    if (localStorage.getItem(SEEN_KEY)) return;
  } catch {
    // navegador sem armazenamento (ex.: modo privado bloqueado): mostra o aviso
  }

  // Cada página diz onde ficam os termos (data-termos na tag <script>).
  const termsUrl = document.currentScript?.dataset.termos || "/app/prototipo/?tela=termos";
  const notice = document.createElement("div");
  notice.className = "cookie-notice";
  notice.setAttribute("role", "region");
  notice.setAttribute("aria-label", "Aviso de cookies");
  notice.innerHTML = `
    <i class="bi bi-cookie cookie-notice-icon" aria-hidden="true"></i>
    <p>O EduSinal usa só <strong>um cookie</strong>: o essencial para você continuar conectado. Nada de propaganda ou rastreamento.</p>
    <div class="cookie-notice-actions">
      <a class="cookie-notice-link" href="${termsUrl}">Ler os termos</a>
      <button class="cookie-notice-ok" type="button">Entendi</button>
    </div>`;
  // No app, os termos abrem como uma tela (sem recarregar), e o "voltar" leva
  // de volta para onde a pessoa estava. Na página inicial, o link abre o app.
  notice.querySelector(".cookie-notice-link").addEventListener("click", (event) => {
    if (typeof openTerms !== "function") return;
    event.preventDefault();
    openTerms();
  });
  notice.querySelector(".cookie-notice-ok").addEventListener("click", () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // sem armazenamento: só fecha agora
    }
    notice.remove();
  });
  document.body.append(notice);
})();
