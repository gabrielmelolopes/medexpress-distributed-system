// URL base da sua API Spring Boot
const URL_API = "http://localhost:8080/produtos";

// Executa a função assim que a página HTML terminar de carregar na tela
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("produto-form").reset();
    carregarProdutos();
});

// 1. FUNÇÃO GET: Busca os produtos no Spring e renderiza na tabela
function carregarProdutos() {
    // O fetch faz o papel do Postman: vai até a URL disparando um GET
    fetch(URL_API)
        .then(resposta => {
            // Se o Java retornar erro (como estoque vazio), lança uma exceção
            if (!resposta.ok) {
                throw new Error("Erro ao buscar produtos ou estoque vazio.");
            }
            return resposta.json(); // Converte a resposta do Java para JSON
        })
        .then(produtos => {
            const corpoTabela = document.getElementById("tabela-corpo");
            corpoTabela.innerHTML = ""; // Limpa a tabela antes de desenhar

            // Loop que passa por cada produto que veio do banco PostgreSQL
            produtos.forEach(produto => {
                const linha = document.createElement("tr");

                // Monta as colunas com os dados do produto
                linha.innerHTML = `
                    <td>${produto.id}</td>
                    <td>${produto.nome}</td>
                    <td>R$ ${produto.preco.toFixed(2)}</td>
                    <td>${produto.quantidade}</td>
                    <td>
                        <button class="btn-editar" onclick="prepararEdicao(${produto.id}, '${produto.nome}', ${produto.preco}, ${produto.quantidade})">Editar</button>
                        <button class="btn-deletar" onclick="deletarProduto(${produto.id})">Excluir</button>
                    </td>
                `;
                // Injeta a linha criada dentro da tabela do HTML
                corpoTabela.appendChild(linha);
            });
        })
        .catch(erro => {
            console.error("Erro:", erro);
            const corpoTabela = document.getElementById("tabela-corpo");
            corpoTabela.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">${erro.message}</td></tr>`;
        });
}

// Funções de deletar e preparar edição que vamos implementar logo em seguida...
function deletarProduto(id) {
    if(confirm(`Tem certeza que deseja excluir o produto com ID ${id}?`)){
        fetch(`${URL_API}/${id}`, {
            method: "DELETE"
        })
            .then(resposta =>{
                if(!resposta.ok){
                    throw new Error("Erro ao tentar excluir o produto do  banco.");
                }

                alert("Produto removido com sucesso!");
                carregarProdutos();
            })
            .catch(erro =>{
                alert(erro.message);
                console.log("Erro na exclusão:", erro);
            })
    }
}

function prepararEdicao(id, nome, preco, quantidade) {
    document.getElementById("produto-id").value = id;
    document.getElementById("nome").value = nome;
    document.getElementById("preco").value = preco;
    document.getElementById("quantidade").value = quantidade;

    document.getElementById("btn-salvar").innerText = "Atualizar Produto";
}

// Escuta o evento de "submit" (envio) do formulário
document.getElementById("produto-form").addEventListener("submit", (evento) => {
    evento.preventDefault(); // Impede a página de atualizar/recarregar ao clicar no botão

    // 1. Captura os valores que você digitou nas caixinhas do HTML
    const id = document.getElementById("produto-id").value;
    const nome = document.getElementById("nome").value;
    const preco = parseFloat(document.getElementById("preco").value);
    const quantidade = parseInt(document.getElementById("quantidade").value);

    // 2. Monta o objeto exatamente no formato JSON que o seu Spring espera
    const produtoDados = {
        nome: nome,
        preco: preco,
        quantidade: quantidade
    };

    if(id){
        atualizarProduto(id, produtoDados);
    }else{
        cadastrarProduto(produtoDados)
    }
});

function atualizarProduto(id, produto){
    fetch(`${URL_API}/${id}`,
        {method: "PUT",
            headers: { "Content-type": "application/json"},
            body: JSON.stringify(produto)})

        .then(resposta =>{
            if(!resposta.ok){
                throw new Error("Erro ao atualizar o produto. Verifique as regras de negócio.");
            }
            return resposta.json();
        })
        .then(produtoAtualizado =>{
            alert(`Produto "${produtoAtualizado.nome}" atualizado com sucesso!`);
            document.getElementById("produto-form").reset();
            document.getElementById("produto-id").value = "";

            document.getElementById("btn-salvar").innerText = "Salvar Produto";
            carregarProdutos();
        })
        .catch(erro =>{
            alert(erro.message);
            console.log("Erro na atualização:", erro);
        })
}

function cadastrarProduto(produto) {
    limparErro();
    fetch(URL_API, {
        method: "POST", // Altera o método HTTP para POST (o padrão do fetch é GET)
        headers: {
            "Content-Type": "application/json" // Avisa ao Spring que estamos enviando um JSON
        },
        body: JSON.stringify(produto) // Transforma o objeto JavaScript em uma linha de texto JSON
    })
        .then(resposta => {
            if(resposta.ok){return resposta.json();}
            return resposta.json().then(erroDoServidor =>{
                console.log("Erro do java:", erroDoServidor);
                throw new Error(erroDoServidor.message || "Erro desconhecido no servidor.")
            })
        })

        .then(produtoCadastrado => {
            alert(`Produto "${produtoCadastrado.nome}" cadastrado com sucesso!`);

            // Limpa as caixinhas do formulário para o próximo cadastro
            document.getElementById("produto-form").reset();

            // Atualiza a tabela automaticamente para mostrar o novo produto que acabou de ir pro banco
            carregarProdutos();
        })
        .catch(erro => {
            exibirErro(erro.message);
            console.error("Erro no cadastro:", erro);
        });
}

document.getElementById("btn-limpar").addEventListener("click", () =>{
    document.getElementById("produto-form").reset();
})

function exibirErro(mensagem){
    const caixaErro = document.getElementById("mensagem-erro");

    caixaErro.innerHTML = `
    <span>${mensagem}</span>
    <button type="button" class="btn-fechar-erro" onclick="limparErro()">&times;</button>`;

    caixaErro.style.display = "flex";
    caixaErro.style.justifyContent = "space-between";
    caixaErro.style.alignItems = "center";
    window.scrollTo({top: 0, behavior: "smooth"});
}

function limparErro(){
    const caixaErro = document.getElementById("mensagem-erro");
    caixaErro.innerText = "";
    caixaErro.style.display = "none";
}