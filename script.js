// Produtos existentes na loja
const produtos = [
    {
        id: 1,
        nome: "Paracetamol 500mg",
        preco: 9.90,
        imagem: "https://media.istockphoto.com/id/1022216070/pt/foto/packet-of-generic-paracetamol-tablets.webp?a=1&b=1&s=612x612&w=0&k=20&c=k6Lu6Q_bie87z9YGNIRVMireQWLsfl3rC81wchH9mTI="
    },
    {
        id: 2,
        nome: "Vitamina C",
        preco: 19.90,
        imagem: "https://images.unsplash.com/photo-1596177583101-26b7dada4f5c?w=500&auto=format&fit=crop&q=60"
    },
    {
        id: 3,
        nome: "Dipirona",
        preco: 7.50,
        imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60"
    },
    {
        id: 4,
        nome: "Shampoo Anticaspa",
        preco: 24.90,
        imagem: "https://images.unsplash.com/photo-1660090455967-24cf8b0eb58d?w=500&auto=format&fit=crop&q=60"
    }
];

// Estado do carrinho
let carrinho = [];

/*
 CARRINHO -> ABRIR / FECHAR */
function abrirCarrinho() {
    document.getElementById('sidebarCarrinho').classList.add('aberto');
    document.getElementById('overlay').classList.add('ativo');
}

function fecharCarrinho() {
    document.getElementById('sidebarCarrinho').classList.remove('aberto');
    document.getElementById('overlay').classList.remove('ativo');
}

/* CARRINHO — OPERAÇÕES */
function adicionarAoCarrinho(idProduto) {
    const produto = produtos.find(p => p.id === idProduto);
    if (!produto) return;

    const itemExistente = carrinho.find(item => item.produto.id === idProduto);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ produto, quantidade: 1 });
    }

    atualizarBadge();
    renderizarCarrinho();
    abrirCarrinho();
}

function alterarQuantidade(idProduto, num) {
    const item = carrinho.find(i => i.produto.id === idProduto);
    if (!item) return;

    item.quantidade += num;

    if (item.quantidade <= 0) {
        removerDoCarrinho(idProduto);
        return;
    }

    atualizarBadge();
    renderizarCarrinho();
}

function removerDoCarrinho(idProduto) {
    carrinho = carrinho.filter(i => i.produto.id !== idProduto);
    atualizarBadge();
    renderizarCarrinho();
}

/* CARRINHO — RENDERIZAÇÃO */
function renderizarCarrinho() {
    const lista = document.getElementById('listaCarrinho');
    const totalEl = document.getElementById('totalCarrinho');

    if (carrinho.length === 0) {
        lista.innerHTML = `
            <div class="carrinho-vazio">
                <span>🛒</span>
                Seu carrinho está vazio.
            </div>`;
        totalEl.textContent = '0,00';
        return;
    }

    lista.innerHTML = carrinho.map(item => `
        <div class="item-carrinho">
            <img src="${item.produto.imagem}" alt="${item.produto.nome}">
            <div class="item-info">
                <div class="item-nome">${item.produto.nome}</div>
                <div class="item-preco">R$ ${(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}</div>
                <div class="item-quantidade">
                    <button class="btn-qtd" onclick="alterarQuantidade(${item.produto.id}, -1)">−</button>
                    <span class="qtd-valor">${item.quantidade}</span>
                    <button class="btn-qtd" onclick="alterarQuantidade(${item.produto.id}, +1)">+</button>
                </div>
            </div>
            <button class="btn-remover" onclick="removerDoCarrinho(${item.produto.id})" title="Remover">✕</button>
        </div>
    `).join('');

    const total = carrinho.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0);
    totalEl.textContent = total.toFixed(2).replace('.', ',');
}

/* BADGE DO ÍCONE DE CARRINHO */
function atualizarBadge() {
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    document.querySelector('.badge').textContent = totalItens;
}

/* INICIALIZAÇÃO */
document.addEventListener("DOMContentLoaded", () => {

    // Botões "+" nos cards
    document.querySelectorAll('.botao-adicionar-produto').forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = parseInt(botao.dataset.id);
            adicionarAoCarrinho(id);
        });
    });

    // Ícone do carrinho no header
    document.getElementById('btnAbrirCarrinho').addEventListener('click', (e) => {
        e.preventDefault();
        abrirCarrinho();
    });

    // Botão fechar (×)
    document.getElementById('btnFecharCarrinho').addEventListener('click', fecharCarrinho);

    // Clicar no overlay fecha o carrinho
    document.getElementById('overlay').addEventListener('click', fecharCarrinho);

    // Carousel
    const heroCarousel = document.querySelector('#heroCarousel');
    if (heroCarousel) {
        new bootstrap.Carousel(heroCarousel, { interval: 3000, ride: 'carousel' });
    }

    // Renderiza estado inicial (vazio)
    renderizarCarrinho();
});

function chamarBackend() {
    fetch("http://localhost:8080/hello")
        .then(res => res.text())
        .then(data => alert(data))
        .catch(err => console.log(err));
}