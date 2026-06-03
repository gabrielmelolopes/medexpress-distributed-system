import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE, KEY_USUARIO, KEY_REDIRECT } from '../api';
import { useCart } from '../CartContext';

export default function Login() {
  const navigate = useNavigate();
  const { recarregarUsuario } = useCart();
  const [modoCadastro, setModoCadastro] = useState(false);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState({});
  const [alertaErro, setAlertaErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [emailCadastrado, setEmailCadastrado] = useState('');

  const validar = () => {
    const novosErros = {};
    if (modoCadastro && nome.trim().length < 3) novosErros.nome = true;
    if (!email.trim()) novosErros.email = true;
    if (senha.length < 6) novosErros.senha = true;
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlertaErro('');
    if (!validar()) return;
    setLoading(true);
    try {
      if (modoCadastro) {
        await fazerCadastro();
      } else {
        await fazerLogin();
      }
    } catch (err) {
      setAlertaErro(err.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fazerLogin = async () => {
    let res;
    try {
      res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: senha }),
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor (localhost:8080).');
    }
    if (res.status === 400 || res.status === 401) throw new Error('E-mail ou senha incorretos.');
    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      let msg = `Erro ${res.status}`;
      try { msg = JSON.parse(raw).message || msg; } catch { msg = raw || msg; }
      throw new Error(msg);
    }
    const usuario = await res.json();
    if (!usuario?.id) throw new Error('Resposta inesperada do servidor.');
    localStorage.setItem(KEY_USUARIO, JSON.stringify({ id: usuario.id, name: usuario.name, email: usuario.email }));
    recarregarUsuario();
    const destino = localStorage.getItem(KEY_REDIRECT);
    localStorage.removeItem(KEY_REDIRECT);
    navigate(destino === 'checkout' ? '/checkout' : '/');
  };

  const fazerCadastro = async () => {
    let res;
    try {
      res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nome.trim(), email: email.trim(), password: senha }),
      });
    } catch {
      throw new Error('Não foi possível conectar ao servidor (localhost:8080).');
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      if (txt.toLowerCase().includes('já está cadastrado') || res.status === 409)
        throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
      throw new Error(txt || `Erro ${res.status} ao criar conta.`);
    }
    setEmailCadastrado(email.trim());
    setCadastroSucesso(true);
  };

  const toggleModo = (e) => {
    e.preventDefault();
    setModoCadastro(m => !m);
    setAlertaErro('');
    setErros({});
    setNome('');
    setSenha('');
  };

  const voltarParaLogin = () => {
    setCadastroSucesso(false);
    setModoCadastro(false);
    setEmail(emailCadastrado);
    setSenha('');
    setErros({});
  };

  return (
    <div>
      <header className="site-header border-bottom bg-white">
        <div className="container-fluid px-4">
          <div className="d-flex align-items-center justify-content-between py-3">
            <a href="/" onClick={e => { e.preventDefault(); navigate('/'); }} className="text-decoration-none">
              <span className="logo-text">MedExpress</span>
            </a>
            <div className="d-none d-md-flex align-items-center gap-4">
              <div className="d-flex align-items-center gap-2 header-info">
                <i className="bi bi-headset fs-5"></i>
                <span>Central de Atendimento</span>
              </div>
              <div className="d-flex align-items-center gap-2 header-info">
                <i className="bi bi-shield-check fs-5"></i>
                <span>Ambiente 100% seguro</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main-login" style={{ background: '#f5f6fa' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">
              <div className="login-card">

                {cadastroSucesso ? (
                  <div className="text-center py-2">
                    <div style={{ fontSize: '3rem' }}>✅</div>
                    <h5 className="mt-3 mb-1" style={{ fontWeight: 800 }}>Conta criada!</h5>
                    <p className="text-muted mb-1" style={{ fontSize: '.88rem' }}>Seu cadastro foi salvo com sucesso.</p>
                    <p className="text-muted mb-4" style={{ fontSize: '.88rem' }}>Agora entre com seu e-mail e senha para acessar a MedExpress.</p>
                    <button className="btn btn-entrar" onClick={voltarParaLogin}>
                      <i className="bi bi-box-arrow-in-right me-2"></i>Fazer login
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="login-title">{modoCadastro ? 'Criar conta' : 'Olá! Bem-vindo'}</h1>
                    <p className="login-subtitle">{modoCadastro ? 'Preencha os dados para se cadastrar' : 'Acesse sua conta para continuar'}</p>

                    {alertaErro && (
                      <div className="alert alert-danger py-2" role="alert">
                        <i className="bi bi-exclamation-circle me-1"></i>
                        {alertaErro}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                      {modoCadastro && (
                        <div className="mb-3">
                          <label className="form-label field-label">Nome completo</label>
                          <input
                            type="text"
                            className={`field-input ${erros.nome ? 'is-invalid' : ''}`}
                            value={nome}
                            onChange={e => { setNome(e.target.value); setErros(p => ({ ...p, nome: false })); }}
                            placeholder="Digite seu nome"
                            minLength={3}
                          />
                          {erros.nome && <div className="invalid-feedback d-block" style={{ fontSize: '.8rem', color: '#dc3545' }}>Informe seu nome (mínimo 3 caracteres).</div>}
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label field-label">E-mail</label>
                        <input
                          type="email"
                          className={`field-input ${erros.email ? 'is-invalid' : ''}`}
                          value={email}
                          onChange={e => { setEmail(e.target.value); setErros(p => ({ ...p, email: false })); }}
                          placeholder="seu@email.com"
                        />
                        {erros.email && <div className="invalid-feedback d-block" style={{ fontSize: '.8rem', color: '#dc3545' }}>Informe seu e-mail.</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label field-label">Senha</label>
                        <div className="input-password-wrapper">
                          <input
                            type={senhaVisivel ? 'text' : 'password'}
                            className={`field-input ${erros.senha ? 'is-invalid' : ''}`}
                            value={senha}
                            onChange={e => { setSenha(e.target.value); setErros(p => ({ ...p, senha: false })); }}
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                          />
                          <button type="button" className="btn-toggle-senha" onClick={() => setSenhaVisivel(v => !v)} tabIndex={-1}>
                            <i className={`bi ${senhaVisivel ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                          </button>
                        </div>
                        {erros.senha && <div className="invalid-feedback d-block" style={{ fontSize: '.8rem', color: '#dc3545' }}>A senha precisa ter pelo menos 6 caracteres.</div>}
                      </div>

                      {!modoCadastro && (
                        <div className="text-end mb-3">
                          <a href="#" className="link-vermelho small">Esqueci a senha</a>
                        </div>
                      )}

                      <button type="submit" className="btn btn-entrar" disabled={loading}>
                        {loading
                          ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Aguarde...</>
                          : modoCadastro ? 'Cadastrar' : 'Entrar'
                        }
                      </button>

                      <p className="toggle-texto mt-4">
                        <span>{modoCadastro ? 'Já tem conta?' : 'Não tem conta?'}</span>
                        <a href="#" className="link-vermelho fw-bold ms-1" onClick={toggleModo}>
                          {modoCadastro ? 'Entrar' : 'Cadastre-se'}
                        </a>
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
