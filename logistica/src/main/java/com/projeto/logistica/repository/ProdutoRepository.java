package com.projeto.logistica.repository;

import com.projeto.logistica.model.Produto;

import java.util.List;

public interface ProdutoRepository {
    void salvar(Produto p);
    void removerPorId(int id);
    Produto buscarPorId(int id);
    List<Produto> listarTodos();
    void registrarVenda(int id, int novaQuantidade, int quantidadeVendida);
    Produto atualizarProduto(int id, Produto produto);
}
