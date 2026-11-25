// ÁREA DO ADMINISTRADOR
// Só aparece para contas de administrador (o servidor confere em TODA rota
// /admin; esconder o botão aqui é só para não confundir os alunos).
// O administrador vê todos os usuários juntos (sem separar por liga):
// apelido, mascote e números de jogo. Nunca e-mail nem senha.
// Também tem tudo liberado: o servidor deixa vidas, energia e moedas cheias e
// abre todas as atividades e sinais (ver admin_service.py na API).

let adminLoadedAt = 0;
let adminLoading = false; // já tem um pedido indo? (não pede duas vezes)

// Busca a lista no servidor ao abrir a aba. Se ela chegou há menos de 30
// segundos, usa a que já tem (o botão "Atualizar" força buscar de novo).
async function refreshAdminData(force = false) {
  if (!state.isAdmin || adminLoading) return;
  if (!force && state.adminData && Date.now() - adminLoadedAt < 30000) return;
  adminLoading = true;
  try {
    state.adminData = await api("GET", "/admin/usuarios");
    adminLoadedAt = Date.now();
  } catch (error) {
    showApiError(error);
    return;
  } finally {
    adminLoading = false;
  }
  if (state.screen === "admin") render();
}

function adminSummaryTile(iconName, value, label, tone) {
  return `<li class="admin-tile tone-${tone}"><span class="admin-tile-icon">${icon(iconName)}</span><strong>${value}</strong><small>${label}</small></li>`;
}

function adminDateLabel(isoDay) {
  if (!isoDay) return "—";
  const [year, month, day] = isoDay.split("-");
  return `${day}/${month}/${year}`;
}

function renderAdminRow(user) {
  const look = lookFromServer(user.mascote);
  const kind = user.admin ? '<small class="admin-badge is-admin">Admin</small>'
    : user.visitante ? '<small class="admin-badge">Visitante</small>' : "";
  const league = LEAGUES[user.liga]?.name || "Bronze";
  const details = `Liga ${league} · ${icon("fire")} ${user.ofensiva} · ${user.atividades} atividades · desde ${adminDateLabel(user.desde)}`;
  const remove = user.admin
    ? ""
    : `<button class="admin-delete" type="button" data-action="admin-delete" data-id="${user.id}" data-name="${escapeHtml(user.apelido)}" aria-label="Apagar a conta de ${escapeHtml(user.apelido)}">${icon("trash3-fill")}</button>`;
  return `<li class="admin-row">
    <span class="ranking-avatar ${backdropClass(look)}" aria-hidden="true">${mascotSvg(look, "avatar", "")}</span>
    <div class="admin-row-text"><strong>${escapeHtml(user.apelido)} ${kind}</strong><span>${details}</span></div>
    <span class="ranking-points">${user.xp} XP</span>${remove}
  </li>`;
}

// A lista (separada para a busca redesenhar só ela, sem perder o foco do campo).
function renderAdminList() {
  const query = state.adminQuery.trim().toLowerCase();
  const users = state.adminData.usuarios.filter((user) => user.apelido.toLowerCase().includes(query));
  if (!users.length) return '<li class="admin-empty">Nenhum usuário com esse nome.</li>';
  return users.map(renderAdminRow).join("");
}

function searchAdminUsers(query) {
  state.adminQuery = query;
  document.getElementById("admin-list").innerHTML = renderAdminList();
}

function renderAdmin() {
  refreshAdminData();
  const data = state.adminData;
  const summary = data ? data.resumo : null;
  const tiles = summary ? `
    <ul class="admin-tiles" aria-label="Números do sistema">
      ${adminSummaryTile("people-fill", summary.alunos, "alunos com conta", "blue")}
      ${adminSummaryTile("person-fill", summary.visitantes, "visitantes", "gray")}
      ${adminSummaryTile("lightning-charge-fill", summary.xp_total, "XP somado", "yellow")}
      ${adminSummaryTile("check2-circle", summary.atividades_feitas, "atividades feitas", "teal")}
    </ul>` : "";
  const body = data ? `
    <label class="dictionary-search-box admin-search">${icon("search")}<input id="admin-search" class="dictionary-search" type="search" placeholder="Buscar usuário pelo apelido" value="${escapeHtml(state.adminQuery)}" autocomplete="off" /></label>
    <ol class="admin-list" id="admin-list">${renderAdminList()}</ol>`
    : '<p class="admin-empty">Carregando os usuários…</p>';
  return `
    <section class="admin-hero" aria-labelledby="admin-title">
      <span class="admin-hero-icon">${icon("shield-lock-fill")}</span>
      <div class="admin-hero-copy">
        <small>ÁREA DO ADMINISTRADOR</small>
        <h2 id="admin-title">Gerenciar o EduSinal</h2>
        <p>Você tem tudo liberado: vidas, energia e moedas infinitas e todas as atividades abertas. Você não aparece nas ligas.</p>
      </div>
      <button class="button-3d button-3d-outline admin-refresh" type="button" data-action="admin-refresh">${icon("arrow-clockwise")} Atualizar</button>
    </section>
    ${tiles}
    <section class="admin-users" aria-labelledby="admin-users-title">
      <div class="section-heading"><div><p class="eyebrow">TODOS JUNTOS</p><h2 id="admin-users-title">Usuários</h2></div></div>
      ${body}
      <p class="safety-note"><i class="bi bi-shield-check" aria-hidden="true"></i> Por privacidade (LGPD), o administrador não vê e-mail nem senha. Apagar uma conta apaga tudo dela, para sempre.</p>
    </section>`;
}

function deleteUserAsAdmin(id, name) {
  askConfirm({
    title: `Apagar a conta de ${name}?`,
    text: "Isso apaga a conta e todo o progresso dessa pessoa, para sempre. Não dá para desfazer.",
    confirmLabel: "Apagar a conta",
  }, async () => {
    try {
      await api("DELETE", `/admin/usuarios/${encodeURIComponent(id)}`);
    } catch (error) {
      showApiError(error);
      return;
    }
    showToast(`A conta de ${name} foi apagada.`);
    // Some da lista na hora; depois os números do topo vêm atualizados do servidor.
    state.adminData.usuarios = state.adminData.usuarios.filter((user) => String(user.id) !== String(id));
    render();
    refreshAdminData(true);
  });
}
