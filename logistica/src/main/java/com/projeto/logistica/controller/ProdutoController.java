package com.projeto.logistica.controller;

import com.projeto.logistica.model.Produto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.projeto.logistica.service.EstoqueService;

import java.util.List;

@RestController
@RequestMapping("/produtos")
@CrossOrigin("*")
public class ProdutoController {
    private final EstoqueService service;

    public ProdutoController(EstoqueService service){
        this.service = service;
    }

    @GetMapping
    public List<Produto> listar(){
        return service.listarEstoque();
    }

    @PostMapping
    public ResponseEntity<Produto> criar(@RequestBody Produto produto){
        service.salvarProduto(produto);
        return ResponseEntity.ok(produto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable int id){
    service.removerProduto(id);

    return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vender")
    public ResponseEntity<Void> vender(@PathVariable int id, @RequestParam int quantidade) {
        service.venderProduto(id, quantidade);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Produto> atualizarProduto(@PathVariable int id, @RequestBody Produto produto){
        Produto produtoatualizado = service.atualizarProduto(id, produto);

        return ResponseEntity.ok(produtoatualizado);
    }
}
