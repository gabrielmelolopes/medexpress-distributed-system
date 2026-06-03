package br.com.medexpress.api.controller;

import br.com.medexpress.api.domain.CartItem;
import br.com.medexpress.api.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItem>> getCart(@PathVariable Integer userId) {
        return ResponseEntity.ok(cartService.getCartByUserId(userId));
    }

    @PostMapping("/{userId}/add/{productId}")
    public ResponseEntity<CartItem> addItem(@PathVariable Integer userId,
                                            @PathVariable Integer productId,
                                            @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.addItem(userId, productId, quantity));
    }
    @DeleteMapping("/{userId}/{productId}")
    public ResponseEntity<Void> removeItem(@PathVariable Integer userId, @PathVariable Integer productId) {
        cartService.removeItem(userId, productId);
        return ResponseEntity.noContent().build();
    }
}
