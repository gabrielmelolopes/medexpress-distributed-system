import React, { useState, useEffect, useCallback } from 'react';

// ── Configuração ───────────────────────────────────────────────
// Aponta para o Spring Boot. Se você tiver proxy configurado no
// package.json ("proxy": "http://localhost:8080"), troque para '/'.
// Por enquanto usamos o endereço direto para garantir funcionar.
const API = 'http://localhost:8080';
const ADMIN_KEY = 'medexpress_admin';

// ── Helpers locais (sem depender do api.js do projeto) ─────────
function brl(v) {
    return Number(v).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

async function apiFetch(path, opts = {}) {
    let res;
    try {
        res = await fetch(`${API}${path}`, {
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
            ...opts,
        });
    } catch {
        throw new Error('Servidor indisponível. Verifique se o back-end está rodando em localhost:8080.');
    }
    if (res.status === 204) return null;
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(txt).message || msg; } catch { msg = txt || msg; }
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    const text = await res.text();
    if (!text || !text.trim()) return null;
    return JSON.parse(text);
}

// ── Badge de status reutilizável ───────────────────────────────
function StatusBadge({ status }) {
    const icons = {
        PROCESSANDO: 'bi-hourglass-split',
        ENVIADO:     'bi-truck',
        ENTREGUE:    'bi-check-circle-fill',
    };
    return (
        <span className={`status-badge status-${status}`}>
      <i className={`bi ${icons[status] || 'bi-question-circle'} me-1`}></i>
            {status}
    </span>
    );
}

// ── Toast local (não usa o CartContext) ────────────────────────
function useToast() {
    const [toast, setToast] = useState(null);
    const show = (msg, tipo = 'sucesso') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };
    const ToastEl = toast ? (
        <div style={{
            position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
            background: toast.tipo === 'sucesso' ? '#059669' : '#dc2626',
            color: '#fff', padding: '.75rem 1.25rem', borderRadius: 10,
            fontWeight: 700, fontSize: '.9rem',
            boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            display: 'flex', gap: '.5rem', alignItems: 'center',
            animation: 'slideIn .25s ease',
        }}>
            <i className={`bi bi-${toast.tipo === 'sucesso' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {toast.msg}
        </div>
    ) : null;
    return { show, ToastEl };
}

// ══════════════════════════════════════════════════════════════
//  SEÇÃO: DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard() {
    const [stats, setStats]           = useState({ produtos: 0, pedidos: 0, usuarios: 0, receita: 0 });
    const [ultimosPedidos, setUltimos] = useState([]);
    const [loading, setLoading]       = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/products'),
            apiFetch('/orders'),
            apiFetch('/users'),
        ])
            .then(([produtos, pedidos, usuarios]) => {
                const receita = pedidos.reduce((t, p) =>
                    t + (p.items || []).reduce((s, i) =>
                        s + parseFloat(i.price || 0) * (i.quantity || 0), 0), 0);
                setStats({ produtos: produtos.length, pedidos: pedidos.length, usuarios: usuarios.length, receita });
                setUltimos([...pedidos].sort((a, b) => new Date(b.moment) - new Date(a.moment)).slice(0, 5));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        { label: 'Produtos',  value: stats.produtos,          icon: 'bi-box-seam',        cor: '#fee2e2', corI: 'var(--red)' },
        { label: 'Pedidos',   value: stats.pedidos,           icon: 'bi-bag-check',       cor: '#dbeafe', corI: '#2563eb'    },
        { label: 'Usuários',  value: stats.usuarios,          icon: 'bi-people',          cor: '#d1fae5', corI: '#059669'    },
        { label: 'Receita',   value: `R$ ${brl(stats.receita)}`, icon: 'bi-currency-dollar', cor: '#fff7ed', corI: '#ea580c' },
    ];

    if (loading) return (
        <div className="text-center py-5">
            <div className="spinner-border text-danger"></div>
        </div>
    );

    return (
        <div>
            {/* Cards de estatística */}
            <div className="row g-3 mb-4">
                {cards.map(c => (
                    <div className="col-6 col-md-3" key={c.label}>
                        <div style={{
                            background: '#fff', borderRadius: 12, padding: '1.25rem',
                            boxShadow: '0 1px 4px rgba(0,0,0,.08)', position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '.25rem' }}>
                                {c.label}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c.corI }}>{c.value}</div>
                            <i className={`bi ${c.icon}`} style={{
                                fontSize: '1.5rem', color: c.corI, opacity: .25,
                                position: 'absolute', right: '1rem', bottom: '.75rem',
                            }}></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* Últimos pedidos */}
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                <h6 style={{ fontWeight: 800, marginBottom: '1rem' }}>
                    <i className="bi bi-clock-history me-2" style={{ color: 'var(--red)' }}></i>Últimos Pedidos
                </h6>
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                        <thead>
                        <tr>
                            {['#', 'Cliente', 'Itens', 'Total', 'Status'].map(h => (
                                <th key={h} style={{
                                    padding: '.6rem .75rem', fontSize: '.75rem', fontWeight: 700,
                                    textTransform: 'uppercase', color: 'var(--gray-600)',
                                    borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-100)',
                                }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {ultimosPedidos.length === 0 ? (
                            <tr><td colSpan={5} className="text-center text-muted py-3">Nenhum pedido ainda.</td></tr>
                        ) : ultimosPedidos.map(p => {
                            const total = (p.items || []).reduce((s, i) =>
                                s + parseFloat(i.price || 0) * (i.quantity || 0), 0);
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <td style={{ padding: '.75rem' }}>
                      <span style={{ background: 'var(--gray-200)', borderRadius: 20, padding: '.2rem .55rem', fontSize: '.75rem', fontWeight: 800 }}>
                        #{p.id}
                      </span>
                                    </td>
                                    <td style={{ padding: '.75rem', fontWeight: 600 }}>{p.client?.name || '—'}</td>
                                    <td style={{ padding: '.75rem' }}>{(p.items || []).length} item(s)</td>
                                    <td style={{ padding: '.75rem', fontWeight: 800, color: 'var(--red)' }}>R$ {brl(total)}</td>
                                    <td style={{ padding: '.75rem' }}><StatusBadge status={p.status} /></td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  SEÇÃO: PRODUTOS
// ══════════════════════════════════════════════════════════════
function Produtos() {
    const { show: toast, ToastEl } = useToast();
    const [lista, setLista]       = useState([]);
    const [filtrados, setFiltrados] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [busca, setBusca]       = useState('');
    const [salvando, setSalvando] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState({ id: '', nome: '', preco: '', imagem: '', descricao: '' });

    const carregar = useCallback(() => {
        setLoading(true);
        apiFetch('/products')
            .then(p => { setLista(p); setFiltrados(p); })
            .catch(e => toast(`Erro: ${e.message}`, 'erro'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleBusca = e => {
        const t = e.target.value.toLowerCase();
        setBusca(e.target.value);
        setFiltrados(lista.filter(p =>
            p.name.toLowerCase().includes(t) || String(p.id).includes(t)
        ));
    };

    const handleSalvar = async () => {
        if (!form.nome || isNaN(parseFloat(form.preco)) || parseFloat(form.preco) < 0) {
            toast('Preencha nome e preço corretamente.', 'erro');
            return;
        }
        setSalvando(true);
        const body = {
            name:        form.nome,
            price:       parseFloat(form.preco),
            url_image:   form.imagem   || null,
            description: form.descricao || null,
        };
        if (form.id) body.id = parseInt(form.id);
        try {
            const salvo = await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) });
            toast(`Produto "${salvo.name}" salvo!`);
            setForm({ id: '', nome: '', preco: '', imagem: '', descricao: '' });
            setModoEdicao(false);
            carregar();
        } catch (e) {
            toast(`Erro ao salvar: ${e.message}`, 'erro');
        } finally {
            setSalvando(false);
        }
    };

    const handleEditar = async id => {
        try {
            const p = await apiFetch(`/products/${id}`);
            setForm({ id: p.id, nome: p.name || '', preco: p.price || '', imagem: p.url_image || '', descricao: p.description || '' });
            setModoEdicao(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            toast('Erro ao carregar produto.', 'erro');
        }
    };

    const f = k => e => setForm(prev => ({ ...prev, [k]: e.target.value }));

    return (
        <div>
            {ToastEl}
            <div className="row g-4">

                {/* Formulário */}
                <div className="col-lg-5">
                    <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)' }}>
                        <h6 style={{ fontWeight: 800, marginBottom: '1rem' }}>
                            <i className={`bi ${modoEdicao ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`} style={{ color: 'var(--red)' }}></i>
                            {modoEdicao ? `Editando #${form.id}` : 'Novo Produto'}
                        </h6>
                        <div className="row g-3">
                            {[
                                { label: 'Nome *',         key: 'nome',     type: 'text',   placeholder: 'Ex: Paracetamol 500mg' },
                                { label: 'Preço (R$) *',   key: 'preco',    type: 'number', placeholder: '0,00' },
                                { label: 'URL da imagem',  key: 'imagem',   type: 'url',    placeholder: 'https://...' },
                            ].map(({ label, key, type, placeholder }) => (
                                <div className="col-12" key={key}>
                                    <label className="form-label small fw-bold">{label}</label>
                                    <input
                                        type={type}
                                        className="form-control"
                                        placeholder={placeholder}
                                        value={form[key]}
                                        onChange={f(key)}
                                        step={type === 'number' ? '0.01' : undefined}
                                        min={type === 'number' ? '0' : undefined}
                                    />
                                </div>
                            ))}
                            <div className="col-12">
                                <label className="form-label small fw-bold">Descrição</label>
                                <textarea className="form-control" rows={3} value={form.descricao} onChange={f('descricao')} placeholder="Descrição do produto" />
                            </div>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                            <button
                                className="btn btn-danger fw-bold flex-grow-1 rounded-pill"
                                onClick={handleSalvar}
                                disabled={salvando}
                            >
                                {salvando
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                                    : <><i className="bi bi-floppy me-1"></i>{modoEdicao ? 'Atualizar' : 'Salvar Produto'}</>
                                }
                            </button>
                            {modoEdicao && (
                                <button
                                    className="btn btn-outline-secondary fw-bold rounded-pill"
                                    onClick={() => { setForm({ id: '', nome: '', preco: '', imagem: '', descricao: '' }); setModoEdicao(false); }}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabela */}
                <div className="col-lg-7">
                    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
                            <h6 style={{ fontWeight: 800, margin: 0 }}>Produtos cadastrados</h6>
                            <input
                                className="form-control"
                                style={{ maxWidth: 220 }}
                                placeholder="Buscar produto..."
                                value={busca}
                                onChange={handleBusca}
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-danger"></div></div>
                        ) : (
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                                    <thead>
                                    <tr>
                                        {['#', 'Foto', 'Produto', 'Preço', ''].map(h => (
                                            <th key={h} style={{ padding: '.6rem .75rem', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-600)', borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-100)' }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filtrados.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center text-muted py-3">Nenhum produto.</td></tr>
                                    ) : filtrados.map(p => (
                                        <tr key={p.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                            <td style={{ padding: '.75rem' }}>
                                                <span style={{ background: 'var(--gray-200)', borderRadius: 20, padding: '.2rem .55rem', fontSize: '.75rem', fontWeight: 800 }}>{p.id}</span>
                                            </td>
                                            <td style={{ padding: '.75rem' }}>
                                                <img
                                                    src={p.url_image || 'https://placehold.co/44x44?text=Foto'}
                                                    onError={e => { e.target.src = 'https://placehold.co/44x44?text=Foto'; }}
                                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }}
                                                    alt={p.name}
                                                />
                                            </td>
                                            <td style={{ padding: '.75rem' }}>
                                                <div style={{ fontWeight: 700 }}>{p.name}</div>
                                                <div style={{ fontSize: '.75rem', color: 'var(--gray-600)' }}>
                                                    {(p.description || '').substring(0, 55)}{(p.description || '').length > 55 ? '…' : ''}
                                                </div>
                                            </td>
                                            <td style={{ padding: '.75rem', fontWeight: 800, color: 'var(--red)' }}>R$ {brl(p.price)}</td>
                                            <td style={{ padding: '.75rem' }}>
                                                <button
                                                    onClick={() => handleEditar(p.id)}
                                                    style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(232,25,44,.2)', borderRadius: 6, padding: '.35rem .75rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  SEÇÃO: PEDIDOS
// ══════════════════════════════════════════════════════════════
function Pedidos() {
    const { show: toast, ToastEl } = useToast();
    const [todos, setTodos]         = useState([]);
    const [filtrados, setFiltrados] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [filtroStatus, setFiltroStatus] = useState('');
    const [abertos, setAbertos]     = useState({});

    const carregar = useCallback(() => {
        setLoading(true);
        apiFetch('/orders')
            .then(lista => {
                const sorted = [...lista].sort((a, b) => new Date(b.moment) - new Date(a.moment));
                setTodos(sorted);
                setFiltrados(sorted);
            })
            .catch(e => toast(`Erro: ${e.message}`, 'erro'))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleFiltro = e => {
        const val = e.target.value;
        setFiltroStatus(val);
        setFiltrados(val ? todos.filter(p => p.status === val) : todos);
    };

    const togglePedido = id => setAbertos(a => ({ ...a, [id]: !a[id] }));

    const avancarStatus = async (e, orderId, novoStatus) => {
        e.stopPropagation();
        try {
            await apiFetch(`/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: novoStatus }),
            });
            toast(`Pedido #${orderId} → ${novoStatus}`);
            carregar();
        } catch (err) {
            toast(`Erro: ${err.message}`, 'erro');
        }
    };

    const proxStatus  = { PROCESSANDO: 'ENVIADO', ENVIADO: 'ENTREGUE', ENTREGUE: null };
    const labelProx   = { ENVIADO: '📦 Marcar como Enviado', ENTREGUE: '✅ Marcar como Entregue' };
    const fmtData = iso => iso
        ? new Date(iso).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
        : '—';

    return (
        <div>
            {ToastEl}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}>
                    <h6 style={{ fontWeight: 800, margin: 0 }}>Todos os pedidos</h6>
                    <select className="form-select" style={{ maxWidth: 200, fontSize: '.85rem' }} value={filtroStatus} onChange={handleFiltro}>
                        <option value="">Todos os status</option>
                        <option value="PROCESSANDO">Processando</option>
                        <option value="ENVIADO">Enviado</option>
                        <option value="ENTREGUE">Entregue</option>
                    </select>
                </div>

                <div style={{ padding: '1rem 1.5rem' }}>
                    {loading ? (
                        <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-danger"></div></div>
                    ) : filtrados.length === 0 ? (
                        <div className="text-center text-muted py-4">Nenhum pedido encontrado.</div>
                    ) : filtrados.map(p => {
                        const total  = (p.items || []).reduce((s, i) => s + parseFloat(i.price || 0) * (i.quantity || 0), 0);
                        const proximo = proxStatus[p.status];
                        const aberto  = !!abertos[p.id];

                        return (
                            <div key={p.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 10, marginBottom: '.75rem', overflow: 'hidden' }}>
                                {/* Cabeçalho clicável */}
                                <div
                                    onClick={() => togglePedido(p.id)}
                                    style={{ padding: '1rem 1.25rem', background: 'var(--gray-100)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.75rem' }}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <span style={{ background: 'var(--gray-200)', borderRadius: 20, padding: '.2rem .55rem', fontSize: '.75rem', fontWeight: 800 }}>#{p.id}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '.88rem' }}>{p.client?.name || 'Cliente'}</div>
                                            <div style={{ fontSize: '.75rem', color: 'var(--gray-600)' }}>{fmtData(p.moment)}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <span style={{ fontWeight: 800 }}>R$ {brl(total)}</span>
                                        <StatusBadge status={p.status} />
                                        <i className={`bi bi-chevron-${aberto ? 'up' : 'down'} text-muted`}></i>
                                    </div>
                                </div>

                                {/* Detalhe expansível */}
                                {aberto && (
                                    <div style={{ padding: '1rem 1.25rem' }}>
                                        {(p.items || []).map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '.85rem', padding: '.4rem 0', borderBottom: '1px solid var(--gray-200)' }}>
                                                <span style={{ minWidth: 60, color: 'var(--gray-600)', fontSize: '.78rem' }}>ID {item.product?.id || '?'}</span>
                                                <span style={{ flex: 1, fontWeight: 600 }}>{item.product?.name || 'Produto'}</span>
                                                <span style={{ color: 'var(--gray-600)' }}>× {item.quantity}</span>
                                                <span style={{ fontWeight: 800, color: 'var(--red)', minWidth: 80, textAlign: 'right' }}>
                          R$ {brl(parseFloat(item.price || 0) * item.quantity)}
                        </span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.5rem', marginTop: '.75rem' }}>
                      <span style={{ fontSize: '.85rem', fontWeight: 700 }}>
                        Total: R$ {brl(total)}
                          <span style={{ fontWeight: 400, color: 'var(--gray-600)', fontSize: '.75rem', marginLeft: '.5rem' }}>
                          | ID {p.client?.id || '—'} | {p.client?.email || '—'}
                        </span>
                      </span>
                                            {proximo ? (
                                                <button
                                                    onClick={e => avancarStatus(e, p.id, proximo)}
                                                    style={{ background: 'var(--red-light)', color: 'var(--red)', border: '1px solid rgba(232,25,44,.2)', borderRadius: 6, padding: '.35rem .75rem', fontSize: '.8rem', fontWeight: 700, cursor: 'pointer' }}
                                                >
                                                    {labelProx[proximo]}
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '.78rem', color: 'var(--gray-400)', fontWeight: 600 }}>
                          <i className="bi bi-check-all me-1"></i>Concluído
                        </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  SEÇÃO: USUÁRIOS
// ══════════════════════════════════════════════════════════════
function Usuarios() {
    const [lista, setLista]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/users')
            .then(setLista)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.08)', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)', fontWeight: 800 }}>
                Usuários cadastrados
            </div>
            {loading ? (
                <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-danger"></div></div>
            ) : (
                <div className="table-responsive">
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                        <thead>
                        <tr>
                            {['#', 'Nome', 'E-mail'].map(h => (
                                <th key={h} style={{ padding: '.6rem .75rem', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gray-600)', borderBottom: '2px solid var(--gray-200)', background: 'var(--gray-100)' }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {lista.length === 0 ? (
                            <tr><td colSpan={3} className="text-center text-muted py-3">Nenhum usuário.</td></tr>
                        ) : lista.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                <td style={{ padding: '.75rem' }}>
                                    <span style={{ background: 'var(--gray-200)', borderRadius: 20, padding: '.2rem .55rem', fontSize: '.75rem', fontWeight: 800 }}>{u.id}</span>
                                </td>
                                <td style={{ padding: '.75rem' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--red)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.85rem', flexShrink: 0 }}>
                                            {(u.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 700 }}>{u.name || '—'}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '.75rem', color: 'var(--gray-600)' }}>{u.email || '—'}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL: Admin
// ══════════════════════════════════════════════════════════════
const SECOES = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid' },
    { id: 'produtos',  label: 'Produtos',  icon: 'bi-box-seam' },
    { id: 'pedidos',   label: 'Pedidos',   icon: 'bi-bag-check' },
    { id: 'usuarios',  label: 'Usuários',  icon: 'bi-people' },
];
const TITULOS = {
    dashboard: 'Dashboard',
    produtos:  'Gerenciar Produtos',
    pedidos:   'Gerenciar Pedidos',
    usuarios:  'Usuários Cadastrados',
};

export default function Admin() {
    const [admin, setAdmin] = useState(() => {
        try { return JSON.parse(localStorage.getItem(ADMIN_KEY)); }
        catch { return null; }
    });
    const [email, setEmail]     = useState('');
    const [senha, setSenha]     = useState('');
    const [erro, setErro]       = useState('');
    const [loading, setLoading] = useState(false);
    const [secao, setSecao]     = useState('dashboard');

    // Garante que o Admin não herda o padding-top do body (que existe para o Header da loja)
    useEffect(() => {
        document.body.style.paddingTop = '0';
        return () => { document.body.style.paddingTop = ''; };
    }, []);

    async function handleLogin(e) {
        e.preventDefault();
        setErro('');
        if (!email || senha.length < 6) {
            setErro('Preencha e-mail e senha (mínimo 6 caracteres).');
            return;
        }
        setLoading(true);
        try {
            const u = await apiFetch('/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: senha }),
            });
            if (!u?.id) throw new Error('Resposta inesperada.');
            const dados = { id: u.id, name: u.name, email: u.email };
            localStorage.setItem(ADMIN_KEY, JSON.stringify(dados));
            setAdmin(dados);
        } catch (e) {
            const s = e.status;
            if (s === 400 || s === 401) setErro('E-mail ou senha incorretos.');
            else setErro(e.message || 'Erro ao autenticar.');
        } finally {
            setLoading(false);
        }
    }

    function handleLogout() {
        localStorage.removeItem(ADMIN_KEY);
        setAdmin(null);
        setEmail('');
        setSenha('');
    }

    // ── Tela de login ──────────────────────────────────────────
    if (!admin) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #c0121e 0%, #e8192c 100%)',
            }}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '2.5rem 2rem', width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--red)', textAlign: 'center', marginBottom: '.25rem' }}>MedExpress</div>
                    <div style={{ textAlign: 'center', fontSize: '.8rem', fontWeight: 700, color: 'var(--gray-600)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '2rem' }}>
                        Painel Administrativo
                    </div>

                    {erro && (
                        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '.85rem' }}>
                            <i className="bi bi-exclamation-circle me-1"></i>{erro}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <label className="form-label small fw-bold">E-mail</label>
                            <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@medexpress.com" />
                        </div>
                        <div className="mb-4">
                            <label className="form-label small fw-bold">Senha</label>
                            <input type="password" className="form-control" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                        </div>
                        <button type="submit" className="btn btn-danger w-100 fw-bold" disabled={loading}>
                            {loading
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Autenticando...</>
                                : <><i className="bi bi-shield-lock me-2"></i>Entrar no Painel</>
                            }
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <a href="/" className="text-muted small text-decoration-none">
                            <i className="bi bi-arrow-left me-1"></i>Voltar à loja
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // ── Painel principal ───────────────────────────────────────
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-100)' }}>

            {/* Sidebar */}
            <aside style={{
                width: 220, background: 'var(--gray-800)', minHeight: '100vh',
                position: 'fixed', top: 0, left: 0,
                display: 'flex', flexDirection: 'column', zIndex: 200,
            }}>
                <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>MedExpress</div>
                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: .5 }}>Admin Panel</div>
                </div>

                <nav style={{ flex: 1, padding: '1rem 0' }}>
                    {SECOES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSecao(s.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '.75rem',
                                width: '100%', padding: '.75rem 1.25rem',
                                color: secao === s.id ? '#fff' : 'rgba(255,255,255,.6)',
                                background: secao === s.id ? 'rgba(232,25,44,.3)' : 'transparent',
                                borderLeft: secao === s.id ? '3px solid var(--red)' : '3px solid transparent',
                                border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '.88rem', fontFamily: 'var(--font)',
                                textAlign: 'left', transition: 'all .15s',
                            }}
                        >
                            <i className={`bi ${s.icon}`}></i>{s.label}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,.1)' }}>
                    <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.45)', marginBottom: '.3rem' }}>Logado como</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '.88rem', marginBottom: '.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {admin.name || admin.email}
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline-light btn-sm w-100 fw-bold">
                        <i className="bi bi-box-arrow-right me-1"></i>Sair
                    </button>
                </div>
            </aside>

            {/* Conteúdo */}
            <div style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {/* Topbar */}
                <div style={{ background: '#fff', padding: '1rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, fontWeight: 800 }}>{TITULOS[secao]}</h5>
                    <a href="/" className="btn btn-outline-secondary btn-sm rounded-pill" style={{ fontSize: '.82rem' }}>
                        <i className="bi bi-shop me-1"></i>Ver loja
                    </a>
                </div>

                {/* Seção ativa */}
                <div style={{ padding: '1.5rem', flex: 1 }}>
                    {secao === 'dashboard' && <Dashboard />}
                    {secao === 'produtos'  && <Produtos />}
                    {secao === 'pedidos'   && <Pedidos />}
                    {secao === 'usuarios'  && <Usuarios />}
                </div>
            </div>

            {/* CSS de animação do toast */}
            <style>{`
        @keyframes slideIn {
          from { transform: translateX(60px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
        </div>
    );
}