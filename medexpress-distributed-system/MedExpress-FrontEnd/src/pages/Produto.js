import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartSidebar from '../components/CartSidebar';
import Overlay from '../components/Overlay';
import Toast from '../components/Toast';
import { useCart } from '../CartContext';
import { apiGetProduto, backProdutoParaFront, KEY_PRODUTO, brl } from '../api';

export default function Produto() {
  const navigate = useNavigate();
  const { adicionarAoCarrinho } = useCart();
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [qtd, setQtd] = useState(1);
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    const id = parseInt(localStorage.getItem(KEY_PRODUTO));
    if (!id) {
      setErro('ID do produto não informado.');
      setLoading(false);
      return;
    }
    apiGetProduto(id)
      .then(raw => {
        const p = backProdutoParaFront(raw);
        setProduto(p);
        document.title = `MedExpress | ${p.nome}`;
      })
      .catch(() => setErro('Não foi possível carregar o produto. Tente novamente.'))
      .finally(() => setLoading(false));
  }, []);

  const handleComprar = async () => {
    setAdicionando(true);
    await adicionarAoCarrinho(produto, qtd);
    setAdicionando(false);
  };

  return (
    <>
      <Overlay />
      <Header />

      <div className="bg-white border-bottom py-2">
        <div className="container-fluid px-4">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li className="breadcrumb-item">
                <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="text-decoration-none" style={{ color: 'var(--red)' }}>Início</a>
              </li>
              <li className="breadcrumb-item active">{produto?.nome || 'Produto'}</li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="produto-page">
        <div className="container-fluid px-4">

          {erro && (
            <div id="estadoErro">
              <div className="alert alert-danger mt-4">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {erro}
              </div>
              <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="btn btn-outline-danger">← Voltar</a>
            </div>
          )}

          {loading && !erro && (
            <div className="row g-4">
              <div className="col-md-5">
                <div className="produto-galeria">
                  <div className="skeleton-block produto-skeleton" style={{ width: '100%', height: 320 }}></div>
                </div>
              </div>
              <div className="col-md-7">
                <div className="produto-info-card">
                  <div className="skeleton-block produto-skeleton mb-3" style={{ height: 28, width: '60%' }}></div>
                  <div className="skeleton-block produto-skeleton mb-2" style={{ height: 18, width: '40%' }}></div>
                  <div className="skeleton-block produto-skeleton mb-4" style={{ height: 48, width: '50%' }}></div>
                  <div className="skeleton-block produto-skeleton mb-2" style={{ height: 14, width: '100%' }}></div>
                  <div className="skeleton-block produto-skeleton mb-2" style={{ height: 14, width: '90%' }}></div>
                  <div className="skeleton-block produto-skeleton mb-4" style={{ height: 14, width: '75%' }}></div>
                  <div className="skeleton-block produto-skeleton" style={{ height: 48, borderRadius: 24 }}></div>
                </div>
              </div>
            </div>
          )}

          {!loading && produto && (
            <div className="row g-4">
              <div className="col-md-5">
                <div className="produto-galeria">
                  <img
                    src={produto.imagem || 'https://placehold.co/400x320?text=Sem+Foto'}
                    alt={produto.nome}
                    onError={e => e.target.src = 'https://placehold.co/400x320?text=Sem+Foto'}
                  />
                </div>
              </div>
              <div className="col-md-7">
                <div className="produto-info-card">
                  <span className="produto-categoria">Produto</span>
                  <h1 className="produto-titulo">{produto.nome}</h1>

                  <div className="produto-preco-destaque">
                    <span className="atual">R$ {brl(produto.preco)}</span>
                  </div>

                  <p className="produto-desc-completa">{produto.descricao}</p>

                  <div className="qtd-seletor">
                    <label>Quantidade:</label>
                    <button className="btn-qtd" onClick={() => setQtd(q => Math.max(1, q - 1))}>−</button>
                    <span className="qtd-valor">{qtd}</span>
                    <button className="btn-qtd" onClick={() => setQtd(q => q + 1)}>+</button>
                  </div>

                  <button className="btn-comprar" onClick={handleComprar} disabled={adicionando}>
                    {adicionando
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Adicionando...</>
                      : <><i className="bi bi-cart-plus"></i> Adicionar ao Carrinho</>
                    }
                  </button>

                  <div className="mt-3 d-flex gap-3 flex-wrap">
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <i className="bi bi-truck text-danger"></i> Entrega em todo Brasil
                    </div>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                      <i className="bi bi-shield-check text-danger"></i> Produto original
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <CartSidebar />
      <Toast />
    </>
  );
}
