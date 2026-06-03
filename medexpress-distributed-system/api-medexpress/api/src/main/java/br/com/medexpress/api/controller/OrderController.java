package br.com.medexpress.api.controller;

import br.com.medexpress.api.domain.Order;
import br.com.medexpress.api.domain.OrderStatus;
import br.com.medexpress.api.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /* GET /orders → lista todos */
    @GetMapping
    public ResponseEntity<List<Order>> findAll() {
        return ResponseEntity.ok(orderService.findAll());
    }

    /* GET /orders/{id} → busca por ID */
    @GetMapping("/{id}")
    public ResponseEntity<Order> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    /* POST /orders → cria pedido */
    @PostMapping
    public ResponseEntity<Order> create(@RequestBody Order order) {
        Order created = orderService.createOrder(order);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {

        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Campo 'status' é obrigatório no body."));
        }

        OrderStatus novoStatus;
        try {
            novoStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Status inválido: '" + statusStr +
                            "'. Valores aceitos: PROCESSANDO, ENVIADO, ENTREGUE."));
        }

        try {
            Order atualizado = orderService.updateStatus(id, novoStatus);
            return ResponseEntity.ok(atualizado);
        } catch (IllegalStateException e) {
            // Transição de status inválida (ex: ENTREGUE → PROCESSANDO)
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            // Pedido não encontrado
            return ResponseEntity.notFound().build();
        }
    }
}