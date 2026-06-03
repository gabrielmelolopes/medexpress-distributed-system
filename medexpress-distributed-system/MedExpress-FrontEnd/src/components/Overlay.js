import React from 'react';
import { useCart } from '../CartContext';

export default function Overlay() {
  const { sidebarAberta, fecharCarrinho } = useCart();
  return (
    <div
      className={`overlay ${sidebarAberta ? 'ativo' : ''}`}
      onClick={fecharCarrinho}
    />
  );
}
