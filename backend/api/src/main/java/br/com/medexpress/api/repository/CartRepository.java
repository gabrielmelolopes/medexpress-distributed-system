package br.com.medexpress.api.repository;

import br.com.medexpress.api.domain.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<CartItem, Integer> {

    // Busca todos os itens de um usuário específico
    List<CartItem> findByUserId(Integer userId);

    // Busca um item específico no carrinho
    Optional<CartItem> findByUserIdAndProductId(Integer userId, Integer productId);

    // Remove todos os itens do carrinho de um usuário
    void deleteByUserId(Integer userId);
}