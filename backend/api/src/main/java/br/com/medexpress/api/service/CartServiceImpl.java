package br.com.medexpress.api.service.impl;

import br.com.medexpress.api.domain.*;
import br.com.medexpress.api.repository.*;
import br.com.medexpress.api.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // Construtor para Injeção de Dependência
    public CartServiceImpl(CartRepository cartRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Override
    public List<CartItem> getCartByUserId(Integer userId) {
        return cartRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public CartItem addItem(Integer userId, Integer productId, Integer quantity) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado"));

        // Se o item já existe no carrinho, apenas atualizamos a quantidade
        return cartRepository.findByUserIdAndProductId(userId, productId)
                .map(existingItem -> {
                    existingItem.setQuantity(existingItem.getQuantity() + quantity);
                    return cartRepository.save(existingItem);
                })
                .orElseGet(() -> {
                    // Se não existe, criamos um novo
                    CartItem newItem = new CartItem();
                    newItem.setUser(user);
                    newItem.setProduct(product);
                    newItem.setQuantity(quantity);
                    return cartRepository.save(newItem);
                });
    }

    @Override
    @Transactional
    public void removeItem(Integer userId, Integer productId) {
        cartRepository.findByUserIdAndProductId(userId, productId)
                .ifPresent(cartRepository::delete);
    }

    @Override
    @Transactional
    public void clearCart(Integer userId) {
        cartRepository.deleteByUserId(userId);
    }
}