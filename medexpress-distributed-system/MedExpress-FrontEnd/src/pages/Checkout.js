import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartSidebar from '../components/CartSidebar';
import Overlay from '../components/Overlay';
import Toast from '../components/Toast';
import { useCart } from '../CartContext';
import { apiCriarPedido, apiRemoveCarrinho, KEY_REDIRECT, brl } from '../api';

const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function Checkout() {
  const navigate = useNavigate();
  const { carrinho, usuario, totalValor, limparCarrinho, mostrarToast } = useCart();
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [pagamento, setPagamento] = useState('PIX');
  const [erroCheckout, setErroCheckout] = useState('');
  const [loading, setLoading] = useState(false);
  const [pedidoSucesso, setPedidoSucesso] = useState(null);

  useEffect(() => {
    if (!usuario?.id) {
      localStorage.setItem(KEY_REDIRECT, 'checkout');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [usuario, navigate]);

  const handleCepChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 9);
    setCep(val);
  };

  const handleConfirmar = async () => {
    setErroCheckout('');
    if (!cep || !rua || !numero || !cidade || !estado) {
      setErroCheckout('Preencha todos os campos de endereço.');
      return;
    }
    setLoading(true);
    try {
      const pedido = await apiCriarPedido(usuario.id, carrinho);
      limparCarrinho();
      const remocoes = carrinho.map(item =>
        apiRemoveCarrinho(usuario.id, item.produto.id).catch(() => {})
      );
      await Promise.all(remocoes);
      setPedidoSucesso(pedido);
    } catch (e) {
      setErroCheckout(e.message || 'Erro ao criar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario?.id) {
    return (
      <>
        <Overlay />
        <Header />
        <main className="checkout-page">
          <div className="container px-3">
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-circle me-2"></i>
              Você precisa estar logado para finalizar a compra.
              <a href="/login" className="alert-link ms-1" onClick={e => { e.preventDefault(); navigate('/login'); }}>Fazer login</a>
            </div>
          </div>
        </main>
        <CartSidebar />
        <Toast />
      </>
    );
  }

  if (carrinho.length === 0 && !pedidoSucesso) {
    return (
      <>
        <Overlay />
        <Header />
        <main className="checkout-page">
          <div className="container px-3">
            <div className="lista-vazia py-5 text-center">
              <i className="bi bi-cart3 d-block mb-3" style={{ fontSize: '3rem', color: 'var(--gray-400)' }}></i>
              <p className="fw-bold text-muted">Seu carrinho está vazio.</p>
              <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="btn btn-outline-danger rounded-pill px-4">Ver produtos</a>
            </div>
          </div>
        </main>
        <CartSidebar />
        <Toast />
      </>
    );
  }

  return (
    <>
      <Overlay />
      <Header />
      <main className="checkout-page">
        <div className="container px-3">

          <div className="mb-4">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              <i className="bi bi-bag-check me-2" style={{ color: 'var(--red)' }}></i>Finalizar Pedido
            </h2>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb small mb-0">
                <li className="breadcrumb-item">
                  <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} style={{ color: 'var(--red)', textDecoration: 'none' }}>Início</a>
                </li>
                <li className="breadcrumb-item active">Checkout</li>
              </ol>
            </nav>
          </div>

          {pedidoSucesso ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '5rem' }}>🎉</div>
              <h3 style={{ fontWeight: 800 }} className="mt-3">Pedido realizado!</h3>
              <p className="text-muted">
                Seu pedido <strong>#{pedidoSucesso.id}</strong> foi confirmado e está sendo processado.
                <br />Você receberá atualizações em breve.
              </p>
              <div className="d-flex justify-content-center gap-3 mt-4">
                <a href="/rastreamento" onClick={e => { e.preventDefault(); navigate('/rastreamento'); }} className="btn btn-danger px-4 py-2 fw-bold rounded-pill">
                  <i className="bi bi-box-seam me-2"></i>Acompanhar pedido
                </a>
                <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="btn btn-outline-secondary px-4 py-2 fw-bold rounded-pill">
                  Voltar à loja
                </a>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Coluna esquerda */}
              <div className="col-lg-7">
                {/* Dados do cliente */}
                <div className="checkout-card">
                  <h5><i className="bi bi-person-circle"></i> Dados do cliente</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold">Nome completo</label>
                      <input type="text" className="form-control" value={usuario.name || usuario.nome || ''} readOnly />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">E-mail</label>
                      <input type="email" className="form-control" value={usuario.email || ''} readOnly />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="checkout-card">
                  <h5><i className="bi bi-geo-alt"></i> Endereço de entrega</h5>
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">CEP</label>
                      <input type="text" className="form-control" value={cep} onChange={handleCepChange} placeholder="00000-000" maxLength={9} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Número</label>
                      <input type="text" className="form-control" value={numero} onChange={e => setNumero(e.target.value)} placeholder="Ex: 42" />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Rua</label>
                      <input type="text" className="form-control" value={rua} onChange={e => setRua(e.target.value)} placeholder="Ex: Rua das Flores" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Cidade</label>
                      <input type="text" className="form-control" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Sua cidade" />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold">Estado</label>
                      <select className="form-select" value={estado} onChange={e => setEstado(e.target.value)}>
                        <option value="">UF</option>
                        {ESTADOS.map(uf => <option key={uf}>{uf}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                <div className="checkout-card">
                  <h5><i className="bi bi-credit-card"></i> Pagamento</h5>
                  <div className="d-flex flex-column gap-2">
                    {[
                      { value: 'PIX', icon: 'bi-qr-code', color: '#32bcad', label: 'PIX', sub: 'Aprovação imediata' },
                      { value: 'CARTAO', icon: 'bi-credit-card', color: '#0d6efd', label: 'Cartão de crédito', sub: 'Parcelamento disponível' },
                      { value: 'BOLETO', icon: 'bi-upc', color: '#198754', label: 'Boleto bancário', sub: 'Vencimento em 3 dias úteis' },
                    ].map(op => (
                      <label key={op.value} className="d-flex align-items-center gap-3 p-3 border rounded-3" style={{ cursor: 'pointer' }}>
                        <input className="form-check-input mt-0" type="radio" name="pagamento" value={op.value} checked={pagamento === op.value} onChange={() => setPagamento(op.value)} />
                        <i className={`bi ${op.icon} fs-4`} style={{ color: op.color }}></i>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '.9rem' }}>{op.label}</div>
                          <div className="text-muted" style={{ fontSize: '.75rem' }}>{op.sub}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna direita: resumo */}
              <div className="col-lg-5">
                <div className="checkout-card" style={{ position: 'sticky', top: 130 }}>
                  <h5><i className="bi bi-receipt"></i> Resumo do pedido</h5>

                  {carrinho.map(item => (
                    <div className="checkout-item" key={item.produto.id}>
                      <img
                        src={item.produto.imagem || 'https://placehold.co/52x52?text=Foto'}
                        alt={item.produto.nome}
                        onError={e => e.target.src = 'https://placehold.co/52x52?text=Foto'}
                      />
                      <div className="checkout-item-info">
                        <div className="nome">{item.produto.nome}</div>
                        <div className="qtd">Qtd: {item.quantidade}</div>
                      </div>
                      <div className="checkout-item-preco">R$ {brl(item.produto.preco * item.quantidade)}</div>
                    </div>
                  ))}

                  <div className="mt-3">
                    <div className="checkout-resumo-linha">
                      <span>Subtotal</span>
                      <span>R$ {brl(totalValor)}</span>
                    </div>
                    <div className="checkout-resumo-linha">
                      <span>Frete</span>
                      <span className="text-success fw-bold">Grátis</span>
                    </div>
                    <div className="checkout-resumo-linha total">
                      <span>Total</span>
                      <span>R$ {brl(totalValor)}</span>
                    </div>
                  </div>

                  {erroCheckout && (
                    <div className="alert alert-danger mt-3 small py-2">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {erroCheckout}
                    </div>
                  )}

                  <button className="btn-pagar mt-3" onClick={handleConfirmar} disabled={loading}>
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2"></span>Processando...</>
                      : <><i className="bi bi-lock-fill me-2"></i>Confirmar pedido</>
                    }
                  </button>
                  <p className="text-center text-muted mt-2" style={{ fontSize: '.75rem' }}>
                    <i className="bi bi-shield-lock me-1"></i>Ambiente seguro e criptografado
                  </p>
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
