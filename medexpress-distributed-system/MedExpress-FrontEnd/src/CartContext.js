import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  carregarCarrinho, salvarCarrinho,
  adicionarItemLocal, alterarQuantidadeLocal, removerItemLocal,
  apiAddCarrinho, apiRemoveCarrinho, apiGetCarrinho,
  backItemParaFront,
  getUsuario, keyCarrinho,
  API_BASE, KEY_USUARIO,
  totalItens, totalValor, brl
} from './api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [carrinho, setCarrinho] = useState([]);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [usuario, setUsuario] = useState(() => getUsuario());

  // Sincroniza com localStorage sempre que carrinho muda
  const atualizarCarrinho = useCallback((novoCarrinho) => {
    salvarCarrinho(novoCarrinho);
    setCarrinho(novoCarrinho);
  }, []);

  const mostrarToast = useCallback((msg, tipo = 'success') => {
    setToastMsg({ msg, tipo });
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const abrirCarrinho = useCallback(() => setSidebarAberta(true), []);
  const fecharCarrinho = useCallback(() => setSidebarAberta(false), []);

  const adicionarAoCarrinho = useCallback(async (produto, quantidade = 1) => {
    let c = carregarCarrinho();
    c = adicionarItemLocal(c, produto, quantidade);
    atualizarCarrinho(c);
    abrirCarrinho();
    mostrarToast(`"${produto.nome}" adicionado ao carrinho!`);

    const user = getUsuario();
    if (user?.id) {
      apiAddCarrinho(user.id, produto.id, quantidade)
        .catch(e => console.warn('[Carrinho] sync add:', e.message));
    }
  }, [atualizarCarrinho, abrirCarrinho, mostrarToast]);

  const aumentarItem = useCallback(async (idProduto) => {
    let c = carregarCarrinho();
    c = alterarQuantidadeLocal(c, idProduto, +1);
    atualizarCarrinho(c);
    const user = getUsuario();
    if (user?.id) apiAddCarrinho(user.id, idProduto, 1)
      .catch(e => console.warn('[Carrinho] aumentar:', e.message));
  }, [atualizarCarrinho]);

  const diminuirItem = useCallback(async (idProduto) => {
    let c = carregarCarrinho();
    const itemAtual = c.find(i => i.produto.id === idProduto);
    if (!itemAtual) return;
    const novaQtd = itemAtual.quantidade - 1;
    c = alterarQuantidadeLocal(c, idProduto, -1);
    atualizarCarrinho(c);
    const user = getUsuario();
    if (user?.id) {
      if (novaQtd <= 0) {
        apiRemoveCarrinho(user.id, idProduto)
          .catch(e => console.warn('[Carrinho] remover ao diminuir:', e.message));
      } else {
        apiRemoveCarrinho(user.id, idProduto)
          .then(() => apiAddCarrinho(user.id, idProduto, novaQtd))
          .catch(e => console.warn('[Carrinho] diminuir:', e.message));
      }
    }
  }, [atualizarCarrinho]);

  const removerItem = useCallback(async (idProduto) => {
    let c = carregarCarrinho();
    c = removerItemLocal(c, idProduto);
    atualizarCarrinho(c);
    const user = getUsuario();
    if (user?.id) apiRemoveCarrinho(user.id, idProduto)
      .catch(e => console.warn('[Carrinho] remover:', e.message));
  }, [atualizarCarrinho]);

  const limparCarrinho = useCallback(() => {
    atualizarCarrinho([]);
  }, [atualizarCarrinho]);

  const recarregarUsuario = useCallback(() => {
    setUsuario(getUsuario());
  }, []);

  // Inicialização
  useEffect(() => {
    const init = async () => {
      const user = getUsuario();
      if (user?.id) {
        try {
          const res = await fetch(`${API_BASE}/users/search?email=${encodeURIComponent(user.email)}`);
          if (!res.ok) {
            localStorage.removeItem(KEY_USUARIO);
            localStorage.removeItem(`medexpress_carrinho_${user.id}`);
            setUsuario(null);
            setCarrinho([]);
            return;
          }
        } catch {
          // servidor fora do ar - mantém sessão
        }

        const carrinhoLocal = carregarCarrinho();
        if (carrinhoLocal.length === 0) {
          try {
            const backItems = await apiGetCarrinho(user.id);
            if (Array.isArray(backItems) && backItems.length > 0) {
              const convertido = backItems.map(backItemParaFront);
              salvarCarrinho(convertido);
              setCarrinho(convertido);
              return;
            }
          } catch (e) {
            console.warn('[initCarrinho] sync falhou:', e.message);
          }
        }
      }
      setCarrinho(carregarCarrinho());
    };
    init();
  }, []);

  return (
    <CartContext.Provider value={{
      carrinho,
      sidebarAberta,
      toastMsg,
      usuario,
      totalItens: totalItens(carrinho),
      totalValor: totalValor(carrinho),
      brl,
      adicionarAoCarrinho,
      aumentarItem,
      diminuirItem,
      removerItem,
      limparCarrinho,
      abrirCarrinho,
      fecharCarrinho,
      mostrarToast,
      recarregarUsuario,
      atualizarCarrinho,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
