package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.CartItem;
import java.util.List;

public interface CartService {
    List<CartItem> getCartByUserId(Integer userId);

    CartItem addItem(Integer userId, Integer productId, Integer quantity);

    void removeItem(Integer userId, Integer productId);

    void clearCart(Integer userId);
}