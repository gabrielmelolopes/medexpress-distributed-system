import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { logout } from '../api';

export default function Header({ onSearch, showCategories = false, onCategoryFilter }) {
  const { totalItens, abrirCarrinho, usuario, recarregarUsuario } = useCart();
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const handleBuscar = () => {
    if (onSearch) onSearch(busca);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    recarregarUsuario();
  };

  const handleBuscaInput = (e) => {
    setBusca(e.target.value);
    if (!e.target.value.trim() && onSearch) onSearch('');
  };

  const handleBuscaKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) onSearch(busca);
  };

  const nomeUsuario = usuario?.name || usuario?.nome || 'Usuário';

  return (
    <header className="top-bar">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container-fluid px-4 align-items-center gap-3">
          <a className="navbar-brand logo-text" href="/" onClick={e => { e.preventDefault(); navigate('/'); }}>
            MedExpress
          </a>

          <div className="d-flex search-bar flex-grow-1">
            <input
              className="form-control"
              type="search"
              value={busca}
              onChange={handleBuscaInput}
              onKeyDown={handleBuscaKeyDown}
              placeholder="Buscar medicamentos, cosméticos e mais..."
            />
            <button className="btn btn-busca" type="button" onClick={handleBuscar}>
              <i className="bi bi-search"></i>
            </button>
          </div>

          <ul className="navbar-nav d-flex flex-row gap-3 align-items-center flex-shrink-0">
            {usuario?.id ? (
              <>
                <li className="nav-item">
                  <span className="nav-link nav-action" style={{ cursor: 'default' }}>
                    <i className="bi bi-person me-1"></i>
                    Olá, {nomeUsuario.split(' ')[0]}
                  </span>
                </li>
                <li className="nav-item">
                  <a className="nav-link nav-action" href="#" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-1"></i>Sair
                  </a>
                </li>
              </>
            ) : (
              <li className="nav-item" id="navLogin">
                <a className="nav-link nav-action" href="/login" onClick={e => { e.preventDefault(); navigate('/login'); }}>
                  <i className="bi bi-person me-1"></i>
                  <span>Login / Cadastro</span>
                </a>
              </li>
            )}
            <li className="nav-item">
              <a className="nav-link nav-action position-relative" href="#" onClick={e => { e.preventDefault(); abrirCarrinho(); }}>
                <i className="bi bi-cart3 fs-5"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge bg-danger rounded-pill badge-carrinho">
                  {totalItens}
                </span>
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link nav-action" href="/rastreamento" onClick={e => { e.preventDefault(); navigate('/rastreamento'); }}>
                <i className="bi bi-box-seam me-1"></i>Rastrear Pedido
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {showCategories && (
        <div className="categoria-bar bg-white border-bottom d-none d-md-block">
          <div className="container-fluid px-4">
            <ul className="list-unstyled d-flex gap-4 mb-0 py-2" id="barraFiltros">
              {[
                { label: 'Todos', cat: '' },
                { label: 'Medicamentos', cat: 'medicamento' },
                { label: 'Vitaminas', cat: 'vitamina' },
                { label: 'Higiene', cat: 'higiene' },
                { label: 'Dermocosméticos', cat: 'cosmetico' },
              ].map(item => (
                <li key={item.cat}>
                  <a
                    href="#"
                    className="cat-link"
                    onClick={e => { e.preventDefault(); if (onCategoryFilter) onCategoryFilter(item.cat); }}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#" className="cat-link text-danger fw-bold"
                   onClick={e => { e.preventDefault(); if (onCategoryFilter) onCategoryFilter(''); }}>
                  Ofertas
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
