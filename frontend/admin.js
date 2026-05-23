
    /*
    admin.js — MedExpress Admin Panel
    API Spring Boot (localhost:8080)
    Endpoints usados:
    GET    /products          - listar produtos
    POST   /products          - criar produto
    GET    /products/{id}     - buscar produto (para edição)
    GET    /orders            - listar pedidos
    GET    /users             - listar usuários
    POST   /users/login       - autenticar admin
    */

    const API = 'http://localhost:8080';

    // E-mail do admin - qualquer usuário cadastrado no banco pode acessar.
    const ADMIN_KEY = 'medexpress_admin';

    function brl(v) {
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

    function toast(msg, tipo = 'sucesso') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `admin-toast ${tipo}`;
    el.innerHTML = `<i class="bi bi-${tipo === 'sucesso' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

    async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
});
    if (res.status === 204) return null;
    if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `HTTP ${res.status}`);
}
    return res.json();
}

    function statusBadge(status) {
    const map = {
    PROCESSANDO: 'bi-hourglass-split',
    ENVIADO:     'bi-truck',
    ENTREGUE:    'bi-check-circle-fill',
};
    const icon = map[status] || 'bi-question-circle';
    return `<span class="status-badge status-${status}"><i class="bi ${icon}"></i>${status}</span>`;
}

    /* Autenticação */
    function getAdmin() {
    try { return JSON.parse(localStorage.getItem(ADMIN_KEY)); }
    catch { return null; }
}

    function verificarSessao() {
    const admin = getAdmin();
    if (admin?.id) {
    mostrarPainel(admin);
}
}

    document.getElementById('btnLoginAdmin').addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value.trim();
    const senha  = document.getElementById('adminSenha').value;
    const errEl  = document.getElementById('loginErro');
    const msgEl  = document.getElementById('loginErroMsg');

    errEl.classList.add('d-none');

    if (!email || senha.length < 6) {
    msgEl.textContent = 'Preencha e-mail e senha (mínimo 6 caracteres).';
    errEl.classList.remove('d-none');
    return;
}

    const btn = document.getElementById('btnLoginAdmin');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Autenticando...`;

    try {
    // Autentica via POST /users/login — mesmo endpoint do cliente
    const usuario = await apiFetch('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: senha }),
});

    if (!usuario?.id) throw new Error('Resposta inesperada.');

    localStorage.setItem(ADMIN_KEY, JSON.stringify({
    id: usuario.id, name: usuario.name, email: usuario.email,
}));

    mostrarPainel(usuario);

} catch (e) {
    if (e.message.includes('401') || e.message === '') {
    msgEl.textContent = 'E-mail ou senha incorretos.';
} else if (e.message.includes('fetch') || e.message.includes('Failed')) {
    msgEl.textContent = 'Servidor indisponível. Verifique se o back-end está rodando.';
} else {
    msgEl.textContent = e.message || 'Erro ao autenticar.';
}
    errEl.classList.remove('d-none');
} finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-shield-lock me-2"></i>Entrar no Painel`;
}
});

    // Enter no campo de senha dispara o login
    document.getElementById('adminSenha').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btnLoginAdmin').click();
});

    function mostrarPainel(usuario) {
    document.getElementById('telaLoginAdmin').style.display = 'none';
    document.getElementById('painelAdmin').style.display = 'block';
    document.getElementById('adminNomeLogado').textContent = usuario.name || usuario.email;
    carregarDashboard();
}

    document.getElementById('btnLogoutAdmin').addEventListener('click', () => {
    localStorage.removeItem(ADMIN_KEY);
    document.getElementById('painelAdmin').style.display = 'none';
    document.getElementById('telaLoginAdmin').style.display = 'flex';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminSenha').value = '';
});

    /* Navegação entre seções */
    const titulos = {
    dashboard: 'Dashboard',
    produtos:  'Gerenciar Produtos',
    pedidos:   'Gerenciar Pedidos',
    usuarios:  'Usuários Cadastrados',
};

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const secao = link.dataset.secao;

        // Atualiza links da sidebar
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('ativo'));
        link.classList.add('ativo');

        // Mostra a seção correta
        document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
        document.getElementById(`secao${capitalize(secao)}`).classList.add('ativa');

        document.getElementById('tituloPainel').textContent = titulos[secao];

        // Carrega os dados da seção ao entrar nela
        if (secao === 'dashboard') carregarDashboard();
        if (secao === 'produtos')  carregarProdutos();
        if (secao === 'pedidos')   carregarPedidos();
        if (secao === 'usuarios')  carregarUsuarios();
    });
});

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    /* DashBoard */
    async function carregarDashboard() {
    try {
    const [produtos, pedidos, usuarios] = await Promise.all([
    apiFetch('/products'),
    apiFetch('/orders'),
    apiFetch('/users'),
    ]);

    document.getElementById('statProdutos').textContent = produtos.length;
    document.getElementById('statPedidos').textContent  = pedidos.length;
    document.getElementById('statUsuarios').textContent = usuarios.length;

    // Calcula receita total (soma dos itens de todos os pedidos)
    const receita = pedidos.reduce((total, pedido) => {
    const subtotal = (pedido.items || []).reduce((s, item) =>
    s + parseFloat(item.price || 0) * (item.quantity || 0), 0);
    return total + subtotal;
}, 0);
    document.getElementById('statReceita').textContent = `R$ ${brl(receita)}`;

    // Últimos 5 pedidos
    const ultimos = [...pedidos]
    .sort((a, b) => new Date(b.moment) - new Date(a.moment))
    .slice(0, 5);

    const tbody = document.getElementById('tabelaUltimosPedidos');
    tbody.innerHTML = ultimos.length === 0
    ? `<tr><td colspan="5" class="text-center text-muted py-3">Nenhum pedido ainda.</td></tr>`
    : ultimos.map(p => {
    const totalPedido = (p.items || []).reduce((s, i) =>
    s + parseFloat(i.price || 0) * (i.quantity || 0), 0);
    return `
                    <tr>
                        <td><span class="badge-id">#${p.id}</span></td>
                        <td>${p.client?.name || '—'}</td>
                        <td>${(p.items || []).length} item(s)</td>
                        <td>R$ ${brl(totalPedido)}</td>
                        <td>${statusBadge(p.status)}</td>
                    </tr>`;
}).join('');

} catch (e) {
    console.error('Dashboard:', e);
    toast('Erro ao carregar dashboard. Verifique o servidor.', 'erro');
}
}

    /* Produtos */
    let todosProdutosAdmin = [];

    async function carregarProdutos() {
    const tbody = document.getElementById('tabelaProdutos');
    tbody.innerHTML = `<tr class="loading-row"><td colspan="5">
        <div class="spinner-border spinner-border-sm text-danger me-2"></div>Carregando...</td></tr>`;

    try {
    const lista = await apiFetch('/products');
    todosProdutosAdmin = lista;
    renderizarTabelaProdutos(lista);
} catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">
            Erro ao carregar produtos: ${e.message}</td></tr>`;
}
}

    function renderizarTabelaProdutos(lista) {
    const tbody = document.getElementById('tabelaProdutos');

    if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">
            Nenhum produto cadastrado.</td></tr>`;
    return;
}

    tbody.innerHTML = lista.map(p => `
        <tr>
            <td><span class="badge-id">${p.id}</span></td>
            <td>
                <img
                    src="${p.url_image || 'https://placehold.co/44x44?text=Foto'}"
                    class="img-thumb"
                    onerror="this.src='https://placehold.co/44x44?text=Foto'"
                    alt="${p.name}"
                >
            </td>
            <td>
                <div style="font-weight:700;font-size:.9rem;">${p.name}</div>
                <div style="font-size:.75rem;color:var(--gray-600);">
                    ${p.description ? p.description.substring(0, 60) + (p.description.length > 60 ? '…' : '') : ''}
                </div>
            </td>
            <td style="font-weight:800;color:var(--red);">R$ ${brl(p.price)}</td>
            <td>
                <button class="btn-tbl editar me-1"
                    onclick="prepararEdicaoProduto(${p.id})">
                    <i class="bi bi-pencil me-1"></i>Editar
                </button>
            </td>
        </tr>`).join('');
}

    // Busca local na tabela de produtos
    document.getElementById('buscaProdutoTabela').addEventListener('input', function () {
    const t = this.value.toLowerCase();
    const filtrados = todosProdutosAdmin.filter(p =>
    p.name.toLowerCase().includes(t) ||
    String(p.id).includes(t)
    );
    renderizarTabelaProdutos(filtrados);
});

    // Salvar produto (POST /products)
    document.getElementById('btnSalvarProduto').addEventListener('click', async () => {
    const nome      = document.getElementById('produtoNome').value.trim();
    const preco     = parseFloat(document.getElementById('produtoPreco').value);
    const imagem    = document.getElementById('produtoImagem').value.trim();
    const descricao = document.getElementById('produtoDescricao').value.trim();
    const idEdicao  = document.getElementById('produtoIdEdicao').value;

    if (!nome || isNaN(preco) || preco < 0) {
    toast('Preencha nome e preço corretamente.', 'erro');
    return;
}

    const btn = document.getElementById('btnSalvarProduto');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Salvando...`;

    // O back aceita: { name, price, url_image, description }
    const body = {
    name:        nome,
    price:       preco,
    url_image:   imagem || null,
    description: descricao || null,
};

    // Se tiver id em edição, inclui para o back identificar (PUT não existe no controller,
    // mas o POST com id existente pode ser tratado pelo back; se não, apenas cria novo)
    if (idEdicao) body.id = parseInt(idEdicao);

    try {
    const salvo = await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(body),
});

    toast(`Produto "${salvo.name}" salvo com sucesso!`);
    limparFormProduto();
    await carregarProdutos();

} catch (e) {
    toast(`Erro ao salvar: ${e.message}`, 'erro');
} finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-floppy me-1"></i>Salvar Produto`;
}
});

    // Preparar edição: preenche o form com os dados do produto
    async function prepararEdicaoProduto(id) {
    try {
    const p = await apiFetch(`/products/${id}`);

    document.getElementById('produtoIdEdicao').value    = p.id;
    document.getElementById('produtoNome').value        = p.name || '';
    document.getElementById('produtoPreco').value       = p.price || '';
    document.getElementById('produtoImagem').value      = p.url_image || '';
    document.getElementById('produtoDescricao').value   = p.description || '';

    document.getElementById('formProdutoTitulo').innerHTML =
    `<i class="bi bi-pencil-square"></i> Editando produto #${p.id}`;

    document.getElementById('btnSalvarProduto').innerHTML =
    `<i class="bi bi-floppy me-1"></i>Atualizar Produto`;

    document.getElementById('btnCancelarEdicao').classList.remove('d-none');

    // Scroll suave até o formulário
    document.getElementById('formProdutoTitulo').scrollIntoView({ behavior: 'smooth' });

} catch (e) {
    toast('Erro ao carregar produto para edição.', 'erro');
}
}

    // Cancelar edição
    document.getElementById('btnCancelarEdicao').addEventListener('click', limparFormProduto);

    function limparFormProduto() {
    document.getElementById('produtoIdEdicao').value  = '';
    document.getElementById('produtoNome').value      = '';
    document.getElementById('produtoPreco').value     = '';
    document.getElementById('produtoImagem').value    = '';
    document.getElementById('produtoDescricao').value = '';

    document.getElementById('formProdutoTitulo').innerHTML =
    `<i class="bi bi-plus-circle"></i> Novo Produto`;

    document.getElementById('btnSalvarProduto').innerHTML =
    `<i class="bi bi-floppy me-1"></i>Salvar Produto`;

    document.getElementById('btnCancelarEdicao').classList.add('d-none');
}

    /* Pedidos */
    let todosPedidosAdmin = [];

    async function carregarPedidos() {
    const container = document.getElementById('listaPedidosAdmin');
    container.innerHTML = `<div class="text-center py-4">
        <div class="spinner-border spinner-border-sm text-danger me-2"></div>Carregando pedidos...
    </div>`;

    try {
    todosPedidosAdmin = await apiFetch('/orders');
    todosPedidosAdmin.sort((a, b) => new Date(b.moment) - new Date(a.moment));
    renderizarPedidos(todosPedidosAdmin);
} catch (e) {
    container.innerHTML = `<div class="alert alert-danger m-3">Erro: ${e.message}</div>`;
}
}

    // Filtro de status dos pedidos
    document.getElementById('filtroPedidoStatus').addEventListener('change', function () {
    const val = this.value;
    const filtrados = val
    ? todosPedidosAdmin.filter(p => p.status === val)
    : todosPedidosAdmin;
    renderizarPedidos(filtrados);
});

    function renderizarPedidos(lista) {
    const container = document.getElementById('listaPedidosAdmin');

    if (!lista.length) {
    container.innerHTML = `<div class="text-center text-muted py-4">Nenhum pedido encontrado.</div>`;
    return;
}

    // Mapa de qual é o próximo status possível para cada status atual
    const proximoStatus = {
    PROCESSANDO: 'ENVIADO',
    ENVIADO:     'ENTREGUE',
    ENTREGUE:    null   // pedido entregue não avança mais
};

    const labelProximo = {
    ENVIADO:  '📦 Marcar como Enviado',
    ENTREGUE: '✅ Marcar como Entregue',
};

    container.innerHTML = lista.map(p => {
    const totalPedido = (p.items || []).reduce((s, i) =>
    s + parseFloat(i.price || 0) * (i.quantity || 0), 0);

    const data = p.moment
    ? new Date(p.moment).toLocaleDateString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
})
    : '—';

    const itensHtml = (p.items || []).map(item => `
            <div class="d-flex align-items-center gap-2 py-1 border-bottom">
                <span class="text-muted small" style="min-width:60px;">ID ${item.product?.id || '?'}</span>
                <span style="flex:1;font-size:.85rem;font-weight:600;">${item.product?.name || 'Produto'}</span>
                <span class="text-muted small">× ${item.quantity}</span>
                <span style="font-weight:800;color:var(--red);min-width:80px;text-align:right;">
                    R$ ${brl(parseFloat(item.price || 0) * item.quantity)}
                </span>
            </div>`).join('');

    // Botão de avanço de status  só aparece se houver próximo status
    const proximo = proximoStatus[p.status];
    const btnStatus = proximo ? `
            <button
                class="btn-tbl editar"
                style="font-size:.8rem;padding:.4rem .9rem;"
                onclick="avancarStatus(event, ${p.id}, '${proximo}')">
                ${labelProximo[proximo]}
            </button>` : `
            <span style="font-size:.78rem;color:var(--gray-400);font-weight:600;">
                <i class="bi bi-check-all me-1"></i>Concluído
            </span>`;

    return `
            <div class="pedido-row-header" onclick="togglePedido(${p.id})">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge-id">#${p.id}</span>
                    <div>
                        <div style="font-weight:700;font-size:.88rem;">${p.client?.name || 'Cliente'}</div>
                        <div style="font-size:.75rem;color:var(--gray-600);">${data}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span style="font-weight:800;">R$ ${brl(totalPedido)}</span>
                    ${statusBadge(p.status)}
                    <i class="bi bi-chevron-down text-muted" id="chevron-${p.id}"></i>
                </div>
            </div>
            <div class="pedido-collapse-body d-none" id="detalhe-${p.id}">
                <div class="mb-3">${itensHtml || '<p class="text-muted small">Sem itens.</p>'}</div>
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span style="font-size:.85rem;font-weight:700;">
                        Total: R$ ${brl(totalPedido)}
                        <span class="text-muted fw-normal ms-2" style="font-size:.75rem;">
                            | Cliente ID: ${p.client?.id || '—'} | ${p.client?.email || '—'}
                        </span>
                    </span>
                    <div>${btnStatus}</div>
                </div>
            </div>`;
}).join('');
}

    async function avancarStatus(event, orderId, novoStatus) {
    event.stopPropagation(); // impede fechar/abrir o collapse ao clicar no botão

    const btn = event.currentTarget;
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" style="width:12px;height:12px;border-width:2px;"></span> Atualizando...`;

    try {
    await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: novoStatus }),
});

    toast(`Pedido #${orderId} atualizado para ${novoStatus}!`);

    // Recarrega a lista de pedidos para refletir o novo status
    await carregarPedidos();

} catch (e) {
    toast(`Erro ao atualizar status: ${e.message}`, 'erro');
    btn.disabled = false;
    btn.innerHTML = textoOriginal;
}
}

    function togglePedido(id) {
    const body    = document.getElementById(`detalhe-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    const aberto  = !body.classList.contains('d-none');
    body.classList.toggle('d-none');
    chevron.className = aberto ? 'bi bi-chevron-down text-muted' : 'bi bi-chevron-up text-muted';
}

    async function carregarUsuarios() {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = `<tr class="loading-row"><td colspan="3">
        <div class="spinner-border spinner-border-sm text-danger me-2"></div>Carregando...</td></tr>`;

    try {
    const usuarios = await apiFetch('/users');
    if (!usuarios.length) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">
                Nenhum usuário cadastrado.</td></tr>`;
    return;
    }

    tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td><span class="badge-id">${u.id}</span></td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar">${(u.name || 'U').charAt(0).toUpperCase()}</div>
                        <span style="font-weight:700;">${u.name || '—'}</span>
                    </div>
                </td>
                <td style="color:var(--gray-600);">${u.email || '—'}</td>
            </tr>`).join('');

    } catch (e) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger py-3">
            Erro: ${e.message}</td></tr>`;
    }
}
verificarSessao();