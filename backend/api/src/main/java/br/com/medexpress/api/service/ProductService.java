package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.Product;

import java.util.List;
import java.util.Optional;

public interface ProductService {

    Product save(Product product);

    List<Product> findAll();

    Optional<Product> findById(Integer id);

    List<Product> findByName(String name);
}