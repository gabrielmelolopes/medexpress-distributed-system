import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CartSidebar from '../components/CartSidebar';
import Overlay from '../components/Overlay';
import Toast from '../components/Toast';
import { useCart } from '../CartContext';
import { apiFetch, brl } from '../api';

const STATUS_CONFIG = {
  PROCESSANDO: { label: 'Processando', icon: 'bi-hourglass-split', step: 0, badge: 'status-PROCESSANDO' },
  ENVIADO:     { label: 'Enviado',     icon: 'bi-truck',            step: 1, badge: 'status-ENVIADO' },
  ENTREGUE:    { label: 'Entregue',    icon: 'bi-check-circle-fill',step: 2, badge: 'status-ENTREGUE' },
};

const STEPS = [
  { icon: 'bi-clock',       label: 'Processando' },
  { icon: 'bi-truck',       label: 'Enviado' },
  { icon: 'bi-house-check', label: 'Entregue' },
];

function Timeline({ statusKey }) {
  const cfg  = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PROCESSANDO;
  const step = cfg.step;
  const barW = step === 0 ? '5%' : step === 1 ? '50%' : '100%';

  return (
    <div className="timeline">
      <div className="timeline-bar" style={{ width: barW }}></div>
      {STEPS.map((s, i) => (
        <div key={i} className={`timeline-step ${i < step ? 'concluido' : ''} ${i === step ? 'ativo' : ''}`}>
          <div className="step-icon"><i className={`bi ${s.icon}`}></i></div>
          <span className="step-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function formatarData(isoStr) {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function PedidoCard({ pedido }) {
  const cfg   = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.PROCESSANDO;
  const total = (pedido.items || []).reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  return (
    <div className="pedido-card">
      <div className="pedido-header">
        <div>
          <div className="pedido-id">Pedido #{pedido.id}</div>
          <div className="pedido-data">{formatarData(pedido.moment)}</div>
        </div>
        <span className={`status-badge ${cfg.badge}`}>
          <i className={`bi ${cfg.icon}`}></i>{cfg.label}
        </span>
      </div>
      <div className="pedido-body">
        <Timeline statusKey={pedido.status} />
        <div className="pedido-itens">
          {(pedido.items || []).length === 0
            ? <p className="text-muted small">Nenhum item.</p>
            : (pedido.items || []).map((item, idx) => {
              const p = item.product || {};
              return (
                <div className="pedido-item-linha" key={idx}>
                  <img
                    src={p.url_image || ''}
                    alt={p.name || ''}
                    onError={e => e.target.src = 'https://placehold.co/44x44?text=Foto'}
                  />
                  <span className="pedido-item-nome">{p.name || 'Produto'} × {item.quantity}</span>
                  <span className="pedido-item-preco">R$ {brl(parseFloat(item.price) * item.quantity)}</span>
                </div>
              );
            })
          }
        </div>
        <div className="pedido-total-linha">
          <span>Total do pedido</span>
          <span>R$ {brl(total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function Rastreamento() {
  const navigate = useNavigate();
  const { usuario } = useCart();
  const [todosPedidos, setTodosPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [termoBusca, setTermoBusca] = useState('');

  useEffect(() => {
    if (!usuario?.id) return;
    setLoading(true);
    apiFetch('/orders')
      .then(todos => {
        const meus = todos.filter(p => p.client?.id === usuario.id);
        meus.sort((a, b) => new Date(b.moment) - new Date(a.moment));
        setTodosPedidos(meus);
        setPedidosFiltrados(meus);
      })
      .catch(() => setErro('Não foi possível carregar seus pedidos. Verifique se o servidor está rodando.'))
      .finally(() => setLoading(false));
  }, [usuario]);

  const filtrar = (termo) => {
    const t = termo.trim().toLowerCase();
    const filtrados = t ? todosPedidos.filter(p => String(p.id).includes(t)) : todosPedidos;
    setPedidosFiltrados(filtrados);
  };

  const handleBuscar = () => filtrar(termoBusca);

  const handleInputChange = (e) => {
    setTermoBusca(e.target.value);
    if (!e.target.value.trim()) filtrar('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') filtrar(termoBusca);
  };

  return (
    <>
      <Overlay />
      <Header />

      <main className="rastreamento-page">
        <div className="container px-3">

          <div className="rastreamento-hero">
            <h2><i className="bi bi-box-seam me-2"></i>Rastrear Pedidos</h2>
            <p>Acompanhe o status de todos os seus pedidos em tempo real.</p>
            <div className="busca-pedido">
              <input
                type="text"
                value={termoBusca}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nº do pedido..."
              />
              <button className="btn-buscar" onClick={handleBuscar}>Buscar</button>
            </div>
          </div>

          {!usuario?.id && (
            <div className="checkout-card text-center py-5">
              <i className="bi bi-lock fs-1 text-muted mb-3 d-block"></i>
              <h5 className="fw-bold">Faça login para ver seus pedidos</h5>
              <p className="text-muted small">Você precisa estar logado para acompanhar seus pedidos.</p>
              <a href="/login" onClick={e => { e.preventDefault(); navigate('/login'); }} className="btn btn-danger rounded-pill px-4 mt-2">
                <i className="bi bi-person me-2"></i>Entrar na conta
              </a>
            </div>
          )}

          {usuario?.id && loading && (
            <div className="loading-state">
              <div className="spinner-border" role="status"></div>
              <span>Carregando seus pedidos...</span>
            </div>
          )}

          {usuario?.id && erro && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {erro}
            </div>
          )}

          {usuario?.id && !loading && !erro && (
            pedidosFiltrados.length === 0 ? (
              <div className="lista-vazia">
                <i className="bi bi-search"></i>
                <p>
                  {termoBusca.trim()
                    ? `Nenhum pedido encontrado para "#${termoBusca}".`
                    : 'Você ainda não fez nenhum pedido.'
                  }
                </p>
                {!termoBusca.trim() && (
                  <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="btn btn-outline-danger mt-2">
                    Ver produtos
                  </a>
                )}
              </div>
            ) : (
              pedidosFiltrados.map(pedido => (
                <PedidoCard key={pedido.id} pedido={pedido} />
              ))
            )
          )}

        </div>
      </main>

      <CartSidebar />
      <Toast />
    </>
  );
}
