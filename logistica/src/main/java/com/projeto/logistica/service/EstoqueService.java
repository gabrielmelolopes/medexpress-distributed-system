package com.projeto.logistica.service;

import org.springframework.stereotype.Service;
import com.projeto.logistica.exception.NegocioException;
import com.projeto.logistica.model.Produto;
import com.projeto.logistica.repository.ProdutoRepository;

import java.util.List;

@Service
public class EstoqueService {
    private final ProdutoRepository repository;

    public EstoqueService(ProdutoRepository repository){
        this.repository = repository;
    }

    public void salvarProduto(Produto produto){
        String nomeCheck = repository.buscarPorNome(produto.getNome());

        if(nomeCheck != null){
            throw new NegocioException("Não foi possivel salvar o produto: '" + produto.getNome() + "' já esta cadastrado.");
        }

        if(produto.getPreco() < 0 || produto.getQuantidade() < 0){
            throw new NegocioException("Preço ou quantidade não podem ser negativos");
        }
        if(produto.getQuantidade() > 250){
            throw new NegocioException("Quantidades acima de 250 exigem aprovação da diretoria");
        }
        if(produto.getPreco() > 5000){
            throw new NegocioException("Produtos acima de R$ 5000 exigem aprovação da diretoria");
        }
        repository.salvar(produto);
        System.out.println("Produto adicionado ao estoque.");
    }

    public List<Produto> listarEstoque(){
        List<Produto> lista = repository.listarTodos();

        if(lista.isEmpty()){
            throw new NegocioException("Estoque vazio");
        }

        return lista;
    }

    public void removerProduto(int id){
        if(repository.buscarPorId(id) == null)
            throw new NegocioException("ID inexistente");
        repository.removerPorId(id);
    }

    public void venderProduto(int id, int quantidadeVendida){
        Produto p = repository.buscarPorId(id);
        if(p == null){
            throw new NegocioException("ID inexistente");
        }
        if(quantidadeVendida > p.getQuantidade()){
            throw new NegocioException("Quantidade excedida");
        }
        int newQNTD = p.getQuantidade() - quantidadeVendida;

        repository.registrarVenda(id, newQNTD, quantidadeVendida);
    }

    public Produto atualizarProduto(int id, Produto novoproduto){
        Produto produtoantigo = repository.buscarPorId(id);
        if(produtoantigo == null){
            throw new NegocioException("Não é possível atualizar: ID inexistente");
        }
        if(novoproduto.getPreco() < 0 || novoproduto.getQuantidade() < 0){
            throw new NegocioException("Preço ou quantidade não podem ser negativos");
        }
        if(novoproduto.getPreco() > 5000){
            throw new NegocioException("Produtos acima de R$ 5000 exigem aprovação da diretoria");
        }
        if(novoproduto.getQuantidade() > 250){
            throw new NegocioException("Quantidades acima de 250 exigem aprovação da diretoria");
        }
        if(!novoproduto.getNome().equals(produtoantigo.getNome())){

            String nomeChecker = repository.buscarPorNome(novoproduto.getNome());

            if(nomeChecker != null){
                throw new NegocioException("Não é possível alterar o nome: '" + novoproduto.getNome() + "' já esta cadastrado.");
            }
        }

        return repository.atualizarProduto(id, novoproduto);
    }
}
