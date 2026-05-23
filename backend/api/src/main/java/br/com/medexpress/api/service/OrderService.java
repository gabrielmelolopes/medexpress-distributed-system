package br.com.medexpress.api.service;

import br.com.medexpress.api.domain.Order;
import br.com.medexpress.api.domain.OrderStatus;

import java.util.List;

public interface OrderService {

    Order createOrder(Order order);

    Order findById(Integer id);

    List<Order> findAll();

    // Atualiza o status de um pedido existente
    Order updateStatus(Integer orderId, OrderStatus novoStatus);
}