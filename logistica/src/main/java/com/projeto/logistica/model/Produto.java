package com.projeto.logistica.model;

import com.projeto.logistica.exception.NegocioException;

public class Produto {
    private int id;
    private String nome;
    private double preco;
    private int quantidade;

    public Produto(String nome, double preco, int quantidade){
        if(nome == null || nome.trim().isBlank()){
            throw new NegocioException("Nome do produto é obrigatório");
        }
        if(preco < 0){
            throw new NegocioException("Preço não pode ser negativo.");
        }
        this.nome = nome;
        this.preco = preco;
        this.quantidade = quantidade;
    }

    public void setPreco(double novoValor){
        if(novoValor <= 0){
            throw new NegocioException("Valor inválido.");
        }
        this.preco = novoValor;
    }

    public void setId(int idBD){
        if(idBD<=0){
            throw new NegocioException("ID inválido");
        }
        this.id = idBD;
    }

    // Getter(s)
    public int getId(){return id;}
    public String getNome() {return nome;}
    public int getQuantidade() {return quantidade;}
    public double getPreco(){
        return preco;
    }


    public String toString(){
        return "[" + id + "]\nProduto: " + nome +
                "\nPreço: " + preco +
                "\nQuantidade: " + quantidade;
    }
}
