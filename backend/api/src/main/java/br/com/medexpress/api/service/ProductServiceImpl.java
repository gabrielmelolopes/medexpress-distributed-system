package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.Product;
import br.com.medexpress.api.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService{
    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository){
        this.productRepository = productRepository;
    }
    @Override
    public Product save(Product product) {
        if(product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0){
            throw new IllegalArgumentException("O preço do produto deve ser maior que zero");
        }

        if(product.getName() == null || product.getName().trim().isEmpty()){
            throw new IllegalArgumentException("O nome do produto é obrigatório");
        }
        return productRepository.save(product);
    }

    @Override
    public List<Product> findAll() {
        return productRepository.findAll();
    }

    @Override
    public Optional<Product> findById(Integer id){
        return productRepository.findById(id);
    }

    @Override
    public List<Product> findByName(String name) {
        return productRepository.findByNameContainingIgnoreCase(name);
    }
}
