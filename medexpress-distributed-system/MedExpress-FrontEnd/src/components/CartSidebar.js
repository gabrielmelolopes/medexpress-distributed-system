import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { getUsuario, KEY_REDIRECT } from '../api';

export default function CartSidebar() {
  const {
    carrinho, sidebarAberta, fecharCarrinho,
    aumentarItem, diminuirItem, removerItem,
    totalValor, brl, usuario
  } = useCart();
  const navigate = useNavigate();

  const handleFinalizar = () => {
    if (!usuario?.id) {
      localStorage.setItem(KEY_REDIRECT, 'checkout');
      fecharCarrinho();
      navigate('/login');
    } else {
      fecharCarrinho();
      navigate('/checkout');
    }
  };

  return (
    <div id="sidebarCarrinho" className={`carrinho ${sidebarAberta ? 'aberto' : ''}`}>
      <div className="carrinho-header">
        <h5 className="mb-0"><i className="bi bi-cart3 me-2"></i>Meu Carrinho</h5>
        <button className="btn-fechar" onClick={fecharCarrinho}>&times;</button>
      </div>

      <div className="lista-carrinho">
        {carrinho.length === 0 ? (
          <div className="carrinho-vazio">
            <i className="bi bi-cart3"></i>
            Seu carrinho está vazio.
          </div>
        ) : (
          carrinho.map(item => (
            <div className="item-carrinho" key={item.produto.id}>
              <img
                src={item.produto.imagem || 'https://placehold.co/64x64?text=Foto'}
                alt={item.produto.nome}
                onError={e => e.target.src = 'https://placehold.co/64x64?text=Foto'}
              />
              <div className="item-info">
                <div className="item-nome">{item.produto.nome}</div>
                <div className="item-preco">R$ {brl(item.produto.preco * item.quantidade)}</div>
                <div className="item-quantidade">
                  <button className="btn-qtd" onClick={() => diminuirItem(item.produto.id)}>−</button>
                  <span className="qtd-valor">{item.quantidade}</span>
                  <button className="btn-qtd" onClick={() => aumentarItem(item.produto.id)}>+</button>
                </div>
              </div>
              <button className="btn-remover" onClick={() => removerItem(item.produto.id)} title="Remover">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="carrinho-footer">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong>Total:</strong>
          <span className="total-valor">R$ <span>{brl(totalValor)}</span></span>
        </div>
        <button className="btn btn-finalizar w-100" onClick={handleFinalizar}>
          <i className="bi bi-bag-check me-2"></i>Finalizar Compra
        </button>
      </div>
    </div>
  );
}
