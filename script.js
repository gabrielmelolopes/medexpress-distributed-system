// Produtos existentes na loja
const produtos = [
    { id: 1, nome: "Paracetamol 500mg", preco: 9.90 },
    { id: 2, nome: "Vitamina C", preco: 19.90 },
    { id: 3, nome: "Dipirona", preco: 7.50 },
    { id: 4, nome: "Shampoo Anticaspa", preco: 24.90 }
]
// Carrinho começa vazio, será adicionado produtos depois
let carrinho = [];

function adicionarAoCarrinho(idProduto) {
    // Encontra o produto no array pelo Id
    const produto = produtos.find(p => p.id === idProduto);
    // Verificar no carrinho se o produto existe
    const itemExistente = carrinho.find(item => item.produto.id === idProduto);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({ produto: produto, quantidade: 1 });
    }
    atualizarBadge();
}

function atualizarBadge() {
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

    const badge = document.querySelector('.badge');
    badge.textContent = totalItens;
}

document.addEventListener("DOMContentLoaded", () => {
    const botoes = document.querySelectorAll('.botao');

    botoes.forEach((botao) => {
        botao.addEventListener('click', () => {
            const id = parseInt(botao.getAttribute('data-id'));
            adicionarAoCarrinho(id);
        });
    });
});