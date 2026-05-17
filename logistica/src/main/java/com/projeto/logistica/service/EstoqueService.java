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
        if(repository.buscarPorId(produto.getId()) != null){
            throw new NegocioException("Não é possível salvar: ID " + produto.getId() + " já está em uso.");
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

        return repository.atualizarProduto(id, novoproduto);
    }
}
