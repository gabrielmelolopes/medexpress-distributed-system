// api.js — MedExpress
// API: Spring Boot localhost:8080

export const API_BASE = 'http://localhost:8080';

export const KEY_USUARIO  = 'medexpress_usuario';
export const KEY_REDIRECT = 'medexpress_redirect';
export const KEY_PRODUTO  = 'medexpress_produto_id';

// Chave do carrinho isolada por usuário
export function keyCarrinho() {
  const u = getUsuario();
  return u?.id ? `medexpress_carrinho_${u.id}` : 'medexpress_carrinho_guest';
}

// SESSÃO
export function getUsuario() {
  try { return JSON.parse(localStorage.getItem(KEY_USUARIO)); }
  catch { return null; }
}

export function setUsuario(usuario) {
  localStorage.setItem(KEY_USUARIO, JSON.stringify(usuario));
}

export function logout() {
  const user = getUsuario();
  if (user?.id) localStorage.removeItem(`medexpress_carrinho_${user.id}`);
  localStorage.removeItem(KEY_USUARIO);
  window.location.href = '/';
}

// API helper genérico
export async function apiFetch(path, options = {}) {
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
    const raw = await res.text().catch(() => '');
    let msg = `HTTP ${res.status}`;
    try {
      const json = JSON.parse(raw);
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
    throw new Error('Resposta inválida do servidor (JSON malformado).');
  }
}

// API - PRODUTOS
export async function apiGetProdutos()        { return apiFetch('/products'); }
export async function apiGetProduto(id)       { return apiFetch(`/products/${id}`); }
export async function apiSearchProdutos(nome) { return apiFetch(`/products?name=${encodeURIComponent(nome)}`); }

// API - CARRINHO
export async function apiGetCarrinho(userId) {
  try { return await apiFetch(`/cart/${userId}`); }
  catch { return []; }
}

export async function apiAddCarrinho(userId, productId, quantity) {
  return apiFetch(`/cart/${userId}/add/${productId}?quantity=${quantity}`, { method: 'POST' });
}

export async function apiRemoveCarrinho(userId, productId) {
  return apiFetch(`/cart/${userId}/${productId}`, { method: 'DELETE' });
}

// API - PEDIDOS
export async function apiCriarPedido(userId, itens) {
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

export async function apiGetPedidos() {
  return apiFetch('/orders');
}

// Conversão: back → front
export function backProdutoParaFront(p) {
  return {
    id:        p.id,
    nome:      p.name        || '',
    preco:     parseFloat(p.price) || 0,
    imagem:    p.url_image   || '',
    descricao: p.description || '',
  };
}

export function backItemParaFront(item) {
  return {
    produto:    backProdutoParaFront(item.product),
    quantidade: item.quantity,
  };
}

// CARRINHO — persistência LOCAL
export function salvarCarrinho(carrinho) {
  localStorage.setItem(keyCarrinho(), JSON.stringify(carrinho));
}

export function carregarCarrinho() {
  try { return JSON.parse(localStorage.getItem(keyCarrinho())) || []; }
  catch { return []; }
}

// CARRINHO — operações locais
export function adicionarItemLocal(carrinho, produto, quantidade) {
  const copia = carrinho.map(i => ({ ...i }));
  const item  = copia.find(i => i.produto.id === produto.id);
  if (item) item.quantidade += quantidade;
  else      copia.push({ produto, quantidade });
  return copia;
}

export function alterarQuantidadeLocal(carrinho, idProduto, delta) {
  const copia = carrinho.map(i => ({ ...i }));
  const item  = copia.find(i => i.produto.id === idProduto);
  if (!item) return copia;
  item.quantidade += delta;
  return item.quantidade <= 0
    ? copia.filter(i => i.produto.id !== idProduto)
    : copia;
}

export function removerItemLocal(carrinho, idProduto) {
  return carrinho.filter(i => i.produto.id !== idProduto);
}

// helpers
export function brl(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}

export function totalItens(carrinho) {
  return carrinho.reduce((s, i) => s + i.quantidade, 0);
}

export function totalValor(carrinho) {
  return carrinho.reduce((s, i) => s + i.produto.preco * i.quantidade, 0);
}
