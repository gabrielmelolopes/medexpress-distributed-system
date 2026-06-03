package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.*;
import br.com.medexpress.api.messaging.MessageProducer;
import br.com.medexpress.api.repository.OrderRepository;
import br.com.medexpress.api.repository.ProductRepository;
import br.com.medexpress.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository   orderRepository;
    private final UserRepository    userRepository;
    private final ProductRepository productRepository;
    private final MessageProducer   messageProducer;

    public OrderServiceImpl(OrderRepository orderRepository,
                            UserRepository userRepository,
                            ProductRepository productRepository,
                            MessageProducer messageProducer) {
        this.orderRepository   = orderRepository;
        this.userRepository    = userRepository;
        this.productRepository = productRepository;
        this.messageProducer   = messageProducer;
    }

    // Criar pedido
    @Override
    @Transactional
    public Order createOrder(Order order) {

        User client = userRepository.findById(order.getClient().getId())
                .orElseThrow(() -> new RuntimeException(
                        "Usuário não encontrado: ID " + order.getClient().getId()));

        order.setClient(client);
        order.setMoment(LocalDateTime.now());
        order.setStatus(OrderStatus.PROCESSANDO);

        order.getItems().forEach(item -> {
            Product product = productRepository.findById(item.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException(
                            "Produto não encontrado: ID " + item.getProduct().getId()));
            item.setProduct(product);
            item.setOrder(order);
            item.setPrice(product.getPrice());
        });

        Order saved = orderRepository.save(order);

        // Publica na fila — MessageConsumer processa de forma assíncrona.
        try {
            String msg = String.format(
                    "NOVO_PEDIDO|orderId=%d|clientId=%d|clientName=%s|itens=%d|status=%s",
                    saved.getId(),
                    client.getId(),
                    client.getName(),
                    saved.getItems().size(),
                    saved.getStatus().name()
            );
            messageProducer.sendOrderMessage(msg);
        } catch (Exception e) {
            System.err.println("[OrderService] Aviso: falha ao enviar para fila: " + e.getMessage());
        }

        return saved;
    }

    @Override
    public Order findById(Integer id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado: ID " + id));
    }

    @Override
    public List<Order> findAll() {
        return orderRepository.findAll();
    }

    @Override
    @Transactional
    public Order updateStatus(Integer orderId, OrderStatus novoStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado: ID " + orderId));

        validarTransicao(order.getStatus(), novoStatus);
        order.setStatus(novoStatus);
        Order atualizado = orderRepository.save(order);

        // Notifica a fila sobre a mudança
        try {
            String msg = String.format(
                    "STATUS_ATUALIZADO|orderId=%d|novoStatus=%s",
                    orderId, novoStatus.name()
            );
            messageProducer.sendOrderMessage(msg);
        } catch (Exception e) {
            System.err.println("[OrderService] Aviso: falha ao notificar fila: " + e.getMessage());
        }

        return atualizado;
    }

    private void validarTransicao(OrderStatus atual, OrderStatus novo) {
        boolean valido = switch (atual) {
            case PROCESSANDO -> novo == OrderStatus.ENVIADO;
            case ENVIADO     -> novo == OrderStatus.ENTREGUE;
            case ENTREGUE    -> false;
        };
        if (!valido) {
            throw new IllegalStateException(String.format(
                    "Transição inválida: %s → %s. Permitido: PROCESSANDO→ENVIADO, ENVIADO→ENTREGUE.", atual, novo));
        }
    }
}