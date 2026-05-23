"use strict";

/*
   shared.js — MedExpress
   API: Spring Boot localhost:8080
*/

const API_BASE = 'http://localhost:8080';

const KEY_USUARIO  = 'medexpress_usuario';
const KEY_REDIRECT = 'medexpress_redirect';
const KEY_PRODUTO  = 'medexpress_produto_id';

/* Chave do carrinho isolada por usuário
   Logado:     medexpress_carrinho_<userId>
   Não logado: medexpress_carrinho_guest
 */
function keyCarrinho() {
    const u = getUsuario();
    return u?.id ? `medexpress_carrinho_${u.id}` : 'medexpress_carrinho_guest';
}

/* SESSÃO*/
function getUsuario() {
    try { return JSON.parse(localStorage.getItem(KEY_USUARIO)); }
    catch { return null; }
}

function setUsuario(usuario) {
    localStorage.setItem(KEY_USUARIO, JSON.stringify(usuario));
}

function logout() {
    const user = getUsuario();
    if (user?.id) localStorage.removeItem(`medexpress_carrinho_${user.id}`);
    localStorage.removeItem(KEY_USUARIO);
    window.location.href = 'index.html';
}

/*
   API - helper genérico
*/
async function apiFetch(path, options = {}) {
    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
    } catch (networkErr) {
        throw new Error('Servidor indisponível. Verifique se o back-end está rodando em localhost:8080.');
    }

    if (res.status === 204) return null;

    if (!res.ok) {
        // Lê o corpo como texto e tenta extrair a mensagem do Spring
        const raw = await res.text().catch(() => '');
        let msg = `HTTP ${res.status}`;
        try {
            const json = JSON.parse(raw);
            // Spring StandardError: { message, error, status, ... }
            msg = json.message || json.error || raw || msg;
        } catch {
            msg = raw || msg;
        }
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    try {
        return JSON.parse(text);
    } catch (parseErr) {
        console.error('[apiFetch] Erro ao parsear JSON:', parseErr.message, '| Trecho:', text.substring(0, 200));
        throw new Error('Resposta inválida do servidor (JSON malformado).');
    }
}

/*
   API - PRODUTOS
*/
async function apiGetProdutos()        { return apiFetch('/products'); }
async function apiGetProduto(id)       { return apiFetch(`/products/${id}`); }
async function apiSearchProdutos(nome) { return apiFetch(`/products?name=${encodeURIComponent(nome)}`); }

/*
   API - CARRINHO
*/
async function apiGetCarrinho(userId) {
    try { return await apiFetch(`/cart/${userId}`); }
    catch { return []; }
}

async function apiAddCarrinho(userId, productId, quantity) {
    return apiFetch(`/cart/${userId}/add/${productId}?quantity=${quantity}`, { method: 'POST' });
}

async function apiRemoveCarrinho(userId, productId) {
    return apiFetch(`/cart/${userId}/${productId}`, { method: 'DELETE' });
}

/*
   API - PEDIDOS
*/
async function apiCriarPedido(userId, itens) {
    return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
            client: { id: userId },
            items: itens.map(i => ({
                product:  { id: i.produto.id },
                quantity: i.quantidade,
            })),
        }),
    });
}

async function apiGetPedidos() {
    return apiFetch('/orders');
}

/*
   CONVERSÃO: back → front
*/
function backProdutoParaFront(p) {
    return {
        id:        p.id,
        nome:      p.name        || '',
        preco:     parseFloat(p.price) || 0,
        imagem:    p.url_image   || '',
        descricao: p.description || '',
    };
}

function backItemParaFront(item) {
    return {
        produto:    backProdutoParaFront(item.product),
        quantidade: item.quantity,
    };
}

/*
   CARRINHO — persistência LOCAL
*/
function salvarCarrinho(carrinho) {
    localStorage.setItem(keyCarrinho(), JSON.stringify(carrinho));
}

function carregarCarrinho() {
    try { return JSON.parse(localStorage.getItem(keyCarrinho())) || []; }
    catch { return []; }
}

/*
   CARRINHO — operações locais
   */
function adicionarItemLocal(carrinho, produto, quantidade) {
    const copia = carrinho.map(i => ({ ...i }));
    const item  = copia.find(i => i.produto.id === produto.id);
    if (item) item.quantidade += quantidade;
    else      copia.push({ produto, quantidade });
    return copia;
}

function alterarQuantidadeLocal(carrinho, idProduto, delta) {
    const copia = carrinho.map(i => ({ ...i }));
    const item  = copia.find(i => i.produto.id === idProduto);
    if (!item) return copia;
    item.quantidade += delta;
    return item.quantidade <= 0
        ? copia.filter(i => i.produto.id !== idProduto)
        : copia;
}

function removerItemLocal(carrinho, idProduto) {
    return carrinho.filter(i => i.produto.id !== idProduto);
}

/*
   CARRINHO
*/
async function adicionarAoCarrinho(produto, quantidade = 1) {
    let c = carregarCarrinho();
    c = adicionarItemLocal(c, produto, quantidade);
    salvarCarrinho(c);
    atualizarBadge(c);
    renderizarCarrinho(c);

    const user = getUsuario();
    if (user?.id) {
        apiAddCarrinho(user.id, produto.id, quantidade)
            .catch(e => console.warn('[Carrinho] sync add:', e.message));
    }

    abrirCarrinho();
    mostrarToast(`"${produto.nome}" adicionado ao carrinho!`);
}

/*
   CARRINHO - total -> Itens
*/
function totalItens(carrinho) {
    return carrinho.reduce((s, i) => s + i.quantidade, 0);
}

function totalValor(carrinho) {
    return carrinho.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
}

/*
   CARRINHO — renderização sidebar
*/
function renderizarCarrinho(carrinho) {
    const lista   = document.getElementById('listaCarrinho');
    const totalEl = document.getElementById('totalCarrinho');
    if (!lista || !totalEl) return;

    if (!carrinho.length) {
        lista.innerHTML = `
            <div class="carrinho-vazio">
                <i class="bi bi-cart3"></i>
                Seu carrinho está vazio.
            </div>`;
        totalEl.textContent = '0,00';
        return;
    }

    lista.innerHTML = carrinho.map(item => `
        <div class="item-carrinho">
            <img src="${item.produto.imagem}"
                 alt="${item.produto.nome}"
                 onerror="this.src='https://placehold.co/64x64?text=Foto'">
            <div class="item-info">
                <div class="item-nome">${item.produto.nome}</div>
                <div class="item-preco">R$ ${brl(item.produto.preco * item.quantidade)}</div>
                <div class="item-quantidade">
                    <button class="btn-qtd" data-acao="diminuir" data-id="${item.produto.id}">−</button>
                    <span class="qtd-valor">${item.quantidade}</span>
                    <button class="btn-qtd" data-acao="aumentar" data-id="${item.produto.id}">+</button>
                </div>
            </div>
            <button class="btn-remover" data-acao="remover" data-id="${item.produto.id}" title="Remover">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>`).join('');

    totalEl.textContent = brl(totalValor(carrinho));

    lista.querySelectorAll('[data-acao]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id   = parseInt(btn.dataset.id);
            const acao = btn.dataset.acao;
            const user = getUsuario();
            let c = carregarCarrinho();

            if (acao === 'aumentar') {
                c = alterarQuantidadeLocal(c, id, +1);
                salvarCarrinho(c); renderizarCarrinho(c); atualizarBadge(c);
                if (user?.id) apiAddCarrinho(user.id, id, 1)
                    .catch(e => console.warn('[Carrinho] aumentar:', e.message));
            }

            if (acao === 'diminuir') {
                const itemAtual = c.find(i => i.produto.id === id);
                if (!itemAtual) return;
                const novaQtd = itemAtual.quantidade - 1;
                c = alterarQuantidadeLocal(c, id, -1);
                salvarCarrinho(c); renderizarCarrinho(c); atualizarBadge(c);
                if (user?.id) {
                    if (novaQtd <= 0) {
                        apiRemoveCarrinho(user.id, id)
                            .catch(e => console.warn('[Carrinho] remover ao diminuir:', e.message));
                    } else {
                        // Banco não tem PATCH; remove e readiciona com quantidade correta
                        apiRemoveCarrinho(user.id, id)
                            .then(() => apiAddCarrinho(user.id, id, novaQtd))
                            .catch(e => console.warn('[Carrinho] diminuir:', e.message));
                    }
                }
            }

            if (acao === 'remover') {
                c = removerItemLocal(c, id);
                salvarCarrinho(c); renderizarCarrinho(c); atualizarBadge(c);
                if (user?.id) apiRemoveCarrinho(user.id, id)
                    .catch(e => console.warn('[Carrinho] remover:', e.message));
            }
        });
    });
}

function atualizarBadge(carrinho) {
    document.querySelectorAll('.badge-carrinho').forEach(b => {
        b.textContent = totalItens(carrinho);
    });
}

function abrirCarrinho() {
    document.getElementById('sidebarCarrinho')?.classList.add('aberto');
    document.getElementById('overlay')?.classList.add('ativo');
}

function fecharCarrinho() {
    document.getElementById('sidebarCarrinho')?.classList.remove('aberto');
    document.getElementById('overlay')?.classList.remove('ativo');
}

/*
   TOAST
*/
function mostrarToast(msg, tipo = 'success') {
    const el = document.getElementById('toastCarrinho');
    if (!el) return;
    el.className = `toast align-items-center border-0 text-bg-${tipo}`;
    document.getElementById('toastMsg').textContent = msg;
    bootstrap.Toast.getOrCreateInstance(el, { delay: 2800 }).show();
}

/*
   HEADER — sessão
*/
function aplicarSessaoNoHeader() {
    const usuario = getUsuario();
    const labelEl = document.getElementById('labelLogin');
    if (!labelEl) return;

    if (usuario?.id) {
        const nome = usuario.name || usuario.nome || 'Usuário';
        labelEl.textContent = `Olá, ${nome.split(' ')[0]}`;

        const navLogin = document.getElementById('navLogin');
        if (navLogin) {
            const link = navLogin.querySelector('a');
            link.removeAttribute('href');
            link.style.cursor = 'default';
        }

        if (!document.getElementById('navLogout')) {
            const li = document.createElement('li');
            li.id = 'navLogout';
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link nav-action" href="#" id="btnLogout">
                    <i class="bi bi-box-arrow-right me-1"></i>Sair
                </a>`;
            navLogin?.parentElement?.insertBefore(li, navLogin.nextSibling);
            document.getElementById('btnLogout')
                ?.addEventListener('click', e => { e.preventDefault(); logout(); });
        }
    }
}

/*
   NAVEGAÇÃO
*/
function irParaProduto(id) {
    localStorage.setItem(KEY_PRODUTO, id);
    window.location.href = 'produto.html';
}

/*
   HELPER
*/
function brl(valor) {
    return Number(valor).toFixed(2).replace('.', ',');
}

/*
   INICIALIZAÇÃO
*/
async function initCarrinho() {
    const user = getUsuario();

    if (user?.id) {
        // Verifica se a sessão ainda é válida no banco.
        try {
            const res = await fetch(`${API_BASE}/users/search?email=${encodeURIComponent(user.email)}`);
            if (!res.ok) {
                console.warn('[initCarrinho] Sessão inválida — usuário não encontrado no banco. Limpando sessão.');
                localStorage.removeItem(KEY_USUARIO);
                localStorage.removeItem(`medexpress_carrinho_${user.id}`);
                window.location.reload();
                return;
            }
        } catch {
            // Servidor fora do ar - mantém sessão local sem verificar
        }

        // Sincroniza carrinho banco -> localStorage
        // Só sobrescreve se o localStorage do usuário estiver vazio
        const carrinhoLocal = carregarCarrinho();
        if (carrinhoLocal.length === 0) {
            try {
                const backItems = await apiGetCarrinho(user.id);
                if (Array.isArray(backItems) && backItems.length > 0) {
                    salvarCarrinho(backItems.map(backItemParaFront));
                }
            } catch (e) {
                console.warn('[initCarrinho] sync carrinho falhou:', e.message);
            }
        }
    }

    const carrinho = carregarCarrinho();
    atualizarBadge(carrinho);
    renderizarCarrinho(carrinho);
    aplicarSessaoNoHeader();

    document.getElementById('btnAbrirCarrinho')
        ?.addEventListener('click', e => { e.preventDefault(); abrirCarrinho(); });

    document.getElementById('btnFecharCarrinho')
        ?.addEventListener('click', fecharCarrinho);

    document.getElementById('overlay')
        ?.addEventListener('click', fecharCarrinho);

    document.getElementById('btnFinalizarCompra')
        ?.addEventListener('click', () => {
            if (!getUsuario()?.id) {
                localStorage.setItem(KEY_REDIRECT, 'checkout');
                window.location.href = 'login.html';
            } else {
                fecharCarrinho();
                window.location.href = 'checkout.html';
            }
        });

    return carrinho;
}