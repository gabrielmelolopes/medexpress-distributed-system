import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartSidebar from '../components/CartSidebar';
import Overlay from '../components/Overlay';
import Toast from '../components/Toast';
import { useCart } from '../CartContext';
import { apiGetProdutos, apiSearchProdutos, backProdutoParaFront, KEY_PRODUTO } from '../api';

function SkeletonCard() {
  return (
    <div className="col-6 col-md-4 col-lg-3">
      <div className="card-produto">
        <div className="img-wrapper">
          <div className="skeleton-block produto-skeleton" style={{ position: 'absolute', inset: 0, background: 'var(--gray-200)' }}></div>
        </div>
        <div className="card-produto-body" style={{ gap: '.6rem' }}>
          <div className="skeleton-block produto-skeleton" style={{ height: 10, width: '45%', borderRadius: 4 }}></div>
          <div className="skeleton-block produto-skeleton" style={{ height: 16, width: '80%', borderRadius: 4 }}></div>
          <div className="skeleton-block produto-skeleton" style={{ height: 12, width: '100%', borderRadius: 4 }}></div>
          <div className="skeleton-block produto-skeleton" style={{ height: 12, width: '85%', borderRadius: 4 }}></div>
          <div className="skeleton-block produto-skeleton" style={{ height: 22, width: '50%', borderRadius: 4, marginTop: 4 }}></div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ produto, onAdd }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdd = async (e) => {
    e.stopPropagation();
    setLoading(true);
    await onAdd(produto, 1);
    setLoading(false);
  };

  const handleClick = () => {
    localStorage.setItem(KEY_PRODUTO, produto.id);
    navigate('/produto');
  };

  const imgSrc = produto.imagem || 'https://placehold.co/400x300?text=Sem+Foto';

  return (
    <div className="col-6 col-md-4 col-lg-3 d-flex">
      <div className="card-produto w-100" role="button" onClick={handleClick}>
        <div className="img-wrapper">
          <img
            src={imgSrc}
            alt={produto.nome}
            onError={e => e.target.src = 'https://placehold.co/400x300?text=Sem+Foto'}
            loading="lazy"
          />
          <button
            className="btn-adicionar"
            onClick={handleAdd}
            title="Adicionar ao carrinho"
            disabled={loading}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
              : <i className="bi bi-plus-lg"></i>
            }
          </button>
        </div>
        <div className="card-produto-body">
          <span className="produto-categoria">Produto</span>
          <h6 className="produto-nome">{produto.nome}</h6>
          <p className="produto-desc">{produto.descricao || ''}</p>
          <div className="produto-precos">
            <span className="preco-por">R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [todosProdutos, setTodosProdutos] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const { adicionarAoCarrinho } = useCart();

  const carregarProdutos = useCallback(async (nome = '') => {
    setLoading(true);
    setErro(false);
    try {
      const raw = nome ? await apiSearchProdutos(nome) : await apiGetProdutos();
      const produtos = raw.map(backProdutoParaFront);
      setTodosProdutos(produtos);
      setProdutosFiltrados(produtos);
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  const handleSearch = (termo) => {
    setTermoBusca(termo);
    if (!termo) {
      setProdutosFiltrados(todosProdutos);
      return;
    }
    carregarProdutos(termo);
  };

  const handleCategoryFilter = (cat) => {
    if (!cat) {
      setProdutosFiltrados(todosProdutos);
      return;
    }
    const t = cat.toLowerCase();
    const filtrados = todosProdutos.filter(p =>
      p.nome.toLowerCase().includes(t) || (p.descricao || '').toLowerCase().includes(t)
    );
    setProdutosFiltrados(filtrados);
  };

  const handleChipClick = (cat) => {
    if (!cat) {
      setProdutosFiltrados(todosProdutos);
    } else {
      handleCategoryFilter(cat);
    }
  };

  return (
    <>
      <Overlay />
      <Header
        onSearch={handleSearch}
        showCategories={true}
        onCategoryFilter={handleCategoryFilter}
      />

      {/* HERO */}
      <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="4000">
        <div className="carousel-indicators">
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
          <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
        </div>
        <div className="carousel-inner">
          <div className="carousel-item active">
            <div className="hero-banner">
              <img src="https://media.istockphoto.com/id/1368216051/pt/foto/alternative-medicine-herbal-organic-capsule-with-vitamin-e-omega-3-fish-oil-mineral-drug-with.webp?a=1&b=1&s=612x612&w=0&k=20&c=3feXMnnhY1-ZGBH8_Rp9aMyweEIqFhKUv_C9Y7uvcxY=" className="hero-img" alt="Imunidade" />
              <div className="hero-overlay"></div>
              <div className="hero-text">
                <span className="hero-tag">Saúde &amp; Bem-estar</span>
                <h2>Cuide da sua imunidade</h2>
                <p>Vitaminas e suplementos para fortalecer sua saúde todos os dias.</p>
                <button className="btn btn-hero" onClick={() => handleChipClick('vitamina')}>
                  Ver suplementos <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="carousel-item">
            <div className="hero-banner">
              <img src="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1000&auto=format&fit=crop&q=60" className="hero-img" alt="Ofertas" />
              <div className="hero-overlay"></div>
              <div className="hero-text">
                <span className="hero-tag">Promoções</span>
                <h2>Ofertas imperdíveis</h2>
                <p>Medicamentos e cuidados com até 50% OFF na MedExpress.</p>
                <button className="btn btn-hero" onClick={() => handleChipClick('')}>
                  Ver ofertas <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
          <span className="carousel-control-prev-icon"></span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>

      {/* CHIPS */}
      <section className="py-4 bg-white border-bottom">
        <div className="container-fluid px-4">
          <div className="d-flex gap-3 flex-wrap">
            {[
              { label: 'Medicamentos', icon: 'bi-capsule text-danger', cat: 'medicamento' },
              { label: 'Vitaminas', icon: 'bi-sun text-warning', cat: 'vitamina' },
              { label: 'Dermocosméticos', icon: 'bi-droplet text-info', cat: 'cosmetico' },
              { label: 'Higiene', icon: 'bi-heart-pulse text-danger', cat: 'higiene' },
              { label: 'Ver todos', icon: 'bi-stars text-warning', cat: '' },
            ].map(chip => (
              <div className="cat-chip" key={chip.cat + chip.label} onClick={() => handleChipClick(chip.cat)}>
                <i className={`bi ${chip.icon}`}></i> {chip.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUTOS */}
      <section className="py-5">
        <div className="container-fluid px-4">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <h3 className="section-title mb-0">Produtos em Destaque</h3>
            <div className="d-flex align-items-center gap-3">
              {!loading && !erro && (
                <span className="text-muted small fw-bold">
                  {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
                </span>
              )}
              <a href="#" className="link-ver-todos" onClick={e => { e.preventDefault(); setProdutosFiltrados(todosProdutos); }}>
                Ver todos <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>

          {erro && (
            <div className="alert alert-warning d-flex align-items-center gap-3">
              <i className="bi bi-wifi-off fs-4 flex-shrink-0"></i>
              <div>
                <strong>Não foi possível conectar ao servidor.</strong>
                <div className="small mt-1">Verifique se o back-end está rodando em <code>localhost:8080</code>.</div>
              </div>
              <button className="btn btn-sm btn-outline-warning ms-auto" onClick={() => carregarProdutos()}>
                <i className="bi bi-arrow-clockwise me-1"></i>Tentar novamente
              </button>
            </div>
          )}

          {!erro && termoBusca && produtosFiltrados.length === 0 && !loading && (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-circle me-2"></i>
              Nenhum produto encontrado para "{termoBusca}".
            </div>
          )}

          <div className="row g-4">
            {loading
              ? Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)
              : produtosFiltrados.length === 0 && !termoBusca
                ? (
                  <div className="col-12">
                    <div className="lista-vazia py-5">
                      <i className="bi bi-search d-block mb-3" style={{ fontSize: '2.5rem', color: 'var(--gray-400)' }}></i>
                      <p className="fw-bold text-muted">Nenhum produto encontrado.</p>
                    </div>
                  </div>
                )
                : produtosFiltrados.map(p => (
                  <ProductCard key={p.id} produto={p} onAdd={adicionarAoCarrinho} />
                ))
            }
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="py-4 bg-white border-top border-bottom">
        <div className="container-fluid px-4">
          <div className="row g-3 text-center">
            <div className="col-6 col-md-3"><div className="trust-item"><i className="bi bi-truck"></i><span>Entrega rápida em todo Brasil</span></div></div>
            <div className="col-6 col-md-3"><div className="trust-item"><i className="bi bi-patch-check"></i><span>Produto original e certificado</span></div></div>
            <div className="col-6 col-md-3"><div className="trust-item"><i className="bi bi-shield-lock"></i><span>Pagamento seguro</span></div></div>
            <div className="col-6 col-md-3"><div className="trust-item"><i className="bi bi-arrow-repeat"></i><span>Troca grátis em até 30 dias</span></div></div>
          </div>
        </div>
      </section>

      <CartSidebar />
      <Toast />
    </>
  );
}
