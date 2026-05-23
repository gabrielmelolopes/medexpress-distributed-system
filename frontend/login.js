"use strict";

/* ============================================================
   login.js — MedExpress
   Depende de shared.js (carregado antes no HTML).
   NÃO redeclara nenhuma const de shared.js.

   Fluxo cadastro: POST /users → sucesso → tela de confirmação
                   → usuário clica "Fazer login" → modo login
   Fluxo login:    POST /users/login → salva user → redireciona
   ============================================================ */

const form         = document.getElementById('form');
const titulo       = document.getElementById('titulo');
const subtitulo    = document.getElementById('subtitulo');
const botao        = document.getElementById('botaoPrincipal');
const textoToggle  = document.getElementById('textoToggle');
const toggleLink   = document.getElementById('toggleModo');
const campoNome    = document.getElementById('campoNome');
const inputNome    = document.getElementById('nome');
const inputEmail   = document.getElementById('email');
const inputSenha   = document.getElementById('senha');
const toggleSenha  = document.getElementById('toggleSenha');
const iconeSenha   = document.getElementById('iconeSenha');
const linkEsqueci  = document.getElementById('linkEsqueci');
const alertaErro   = document.getElementById('alertaErro');
const mensagemErro = document.getElementById('mensagemErro');

let modoCadastro = false;

/* ── Toggle Login ↔ Cadastro ───────────────────────────────*/
toggleLink.addEventListener('click', e => {
    e.preventDefault();
    modoCadastro = !modoCadastro;
    esconderAlerta();
    limparValidacoes();

    if (modoCadastro) {
        titulo.textContent        = 'Criar conta';
        subtitulo.textContent     = 'Preencha os dados para se cadastrar';
        botao.textContent         = 'Cadastrar';
        textoToggle.textContent   = 'Já tem conta?';
        toggleLink.textContent    = 'Entrar';
        linkEsqueci.style.display = 'none';
        campoNome.style.display   = 'block';
        requestAnimationFrame(() => campoNome.classList.add('visivel'));
        inputNome.setAttribute('required', '');
    } else {
        titulo.textContent        = 'Olá! Bem-vindo';
        subtitulo.textContent     = 'Acesse sua conta para continuar';
        botao.textContent         = 'Entrar';
        textoToggle.textContent   = 'Não tem conta?';
        toggleLink.textContent    = 'Cadastre-se';
        linkEsqueci.style.display = '';
        campoNome.classList.remove('visivel');
        campoNome.addEventListener('transitionend', function h() {
            if (!modoCadastro) campoNome.style.display = 'none';
            campoNome.removeEventListener('transitionend', h);
        });
        inputNome.removeAttribute('required');
        inputNome.value = '';
    }
});

/* ── Mostrar/ocultar senha ──────────────────────────────────*/
toggleSenha.addEventListener('click', () => {
    const visivel        = inputSenha.type === 'text';
    inputSenha.type      = visivel ? 'password' : 'text';
    iconeSenha.className = visivel ? 'bi bi-eye' : 'bi bi-eye-slash';
});

/* ── Submissão ──────────────────────────────────────────────*/
form.addEventListener('submit', async e => {
    e.preventDefault();
    esconderAlerta();
    if (!validarCampos()) return;

    const textoOriginal = botao.textContent;
    botao.disabled  = true;
    botao.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Aguarde...`;

    try {
        if (modoCadastro) {
            await fazerCadastro();
        } else {
            await fazerLogin();
        }
    } catch (err) {
        exibirAlerta(err.message || 'Erro ao conectar com o servidor.');
    } finally {
        botao.disabled    = false;
        botao.textContent = textoOriginal;
    }
});

/* ── LOGIN ──────────────────────────────────────────────────
   POST /users/login
   Body:    { email, password }
   200  →   { id, name, email, password }  → salva e redireciona
   401  →   credenciais inválidas
   ─────────────────────────────────────────────────────────*/
async function fazerLogin() {
    let res;
    try {
        res = await fetch(`${API_BASE}/users/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                email:    inputEmail.value.trim(),
                password: inputSenha.value,
            }),
        });
    } catch {
        throw new Error('Não foi possível conectar ao servidor (localhost:8080).');
    }

    // 400 = usuário não encontrado (Spring lança IllegalArgumentException)
    // 401 = senha incorreta
    if (res.status === 400 || res.status === 401) {
        throw new Error('E-mail ou senha incorretos.');
    }
    if (!res.ok) {
        const raw = await res.text().catch(() => '');
        let msg = `Erro ${res.status}`;
        try { msg = JSON.parse(raw).message || msg; } catch { msg = raw || msg; }
        throw new Error(msg);
    }

    const usuario = await res.json();
    if (!usuario?.id) throw new Error('Resposta inesperada do servidor.');

    // Salva no localStorage SEM a senha
    localStorage.setItem('medexpress_usuario', JSON.stringify({
        id:    usuario.id,
        name:  usuario.name,
        email: usuario.email,
    }));

    // Redireciona: volta para checkout se veio de lá, senão index
    const destino = localStorage.getItem('medexpress_redirect');
    localStorage.removeItem('medexpress_redirect');
    window.location.href = (destino === 'checkout') ? 'checkout.html' : 'index.html';
}

/* ── CADASTRO ───────────────────────────────────────────────
   POST /users
   Body:    { name, email, password }
   200  →   { id, name, email, password }
   400/500 → e-mail duplicado ou dados inválidos

   IMPORTANTE: NÃO faz login automático após cadastro.
   Exibe tela de confirmação e pede para o usuário fazer login.
   ─────────────────────────────────────────────────────────*/
async function fazerCadastro() {
    let res;
    try {
        res = await fetch(`${API_BASE}/users`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
                name:     inputNome.value.trim(),
                email:    inputEmail.value.trim(),
                password: inputSenha.value,
            }),
        });
    } catch {
        throw new Error('Não foi possível conectar ao servidor (localhost:8080).');
    }

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        if (txt.toLowerCase().includes('já está cadastrado') || res.status === 409) {
            throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
        }
        throw new Error(txt || `Erro ${res.status} ao criar conta.`);
    }

    // Cadastro salvo no banco. Não loga automaticamente.
    const emailSalvo = inputEmail.value.trim();
    mostrarConfirmacaoCadastro(emailSalvo);
}

/* ── Tela de confirmação pós-cadastro ───────────────────────
   Substitui o form por uma mensagem de sucesso.
   O botão "Fazer login" restaura o form no modo login
   com o e-mail já preenchido.
   ─────────────────────────────────────────────────────────*/
function mostrarConfirmacaoCadastro(emailCadastrado) {
    // Esconde o formulário
    form.style.display = 'none';

    // Cria e insere o card de sucesso
    const card = document.createElement('div');
    card.id = 'cardSucesso';
    card.innerHTML = `
        <div class="text-center py-2">
            <div style="font-size:3rem;">✅</div>
            <h5 class="mt-3 mb-1" style="font-weight:800;">Conta criada!</h5>
            <p class="text-muted mb-1" style="font-size:.88rem;">
                Seu cadastro foi salvo com sucesso.
            </p>
            <p class="text-muted mb-4" style="font-size:.88rem;">
                Agora entre com seu e-mail e senha para acessar a MedExpress.
            </p>
            <button class="btn btn-entrar w-100" id="btnVoltarLogin">
                <i class="bi bi-box-arrow-in-right me-2"></i>Fazer login
            </button>
        </div>`;
    form.parentElement.appendChild(card);

    document.getElementById('btnVoltarLogin').addEventListener('click', () => {
        // Remove o card de sucesso
        card.remove();

        // Restaura o formulário
        form.style.display = '';

        // Se ainda estiver em modo cadastro, volta para login
        if (modoCadastro) toggleLink.click();

        // Preenche o e-mail automaticamente para facilitar
        inputEmail.value = emailCadastrado;
        inputSenha.value = '';
        limparValidacoes();
        inputSenha.focus();
    });
}

/* ── Validação ──────────────────────────────────────────────*/
function validarCampos() {
    let valido = true;

    if (modoCadastro) {
        if (inputNome.value.trim().length < 3) {
            marcarInvalido(inputNome); valido = false;
        } else {
            marcarValido(inputNome);
        }
    }

    if (!inputEmail.value.trim()) {
        marcarInvalido(inputEmail); valido = false;
    } else {
        marcarValido(inputEmail);
    }

    if (inputSenha.value.length < 6) {
        marcarInvalido(inputSenha); valido = false;
    } else {
        marcarValido(inputSenha);
    }

    return valido;
}

function marcarInvalido(el) { el.classList.add('is-invalid'); el.classList.remove('is-valid'); }
function marcarValido(el)   { el.classList.remove('is-invalid'); el.classList.add('is-valid'); }
function limparValidacoes() {
    [inputNome, inputEmail, inputSenha].forEach(el => el.classList.remove('is-invalid', 'is-valid'));
}
function exibirAlerta(msg) { mensagemErro.textContent = msg; alertaErro.classList.remove('d-none'); }
function esconderAlerta()  { alertaErro.classList.add('d-none'); }

[inputNome, inputEmail, inputSenha].forEach(el =>
    el.addEventListener('input', () => el.classList.remove('is-invalid')));