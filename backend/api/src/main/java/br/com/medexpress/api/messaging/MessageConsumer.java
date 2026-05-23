package br.com.medexpress.api.messaging;

import br.com.medexpress.api.domain.OrderStatus;
import br.com.medexpress.api.service.OrderService;
import org.springframework.context.annotation.Lazy;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Component
public class MessageConsumer {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final OrderService orderService;

    public MessageConsumer(@Lazy OrderService orderService) {
        this.orderService = orderService;
    }

    @JmsListener(destination = MessageProducer.ORDER_QUEUE)
    public void processar(String mensagem) {
        String ts = LocalDateTime.now().format(FMT);
        System.out.println("\n[ActiveMQ ▶ MessageConsumer] " + ts);
        System.out.println("[ActiveMQ] Mensagem: " + mensagem);

        try {
            Map<String, String> campos = parsear(mensagem);
            String tipo = campos.getOrDefault("tipo", "");

            switch (tipo) {
                case "NOVO_PEDIDO" -> processarNovoPedido(campos);
                case "STATUS_ATUALIZADO" -> processarStatusAtualizado(campos);
                default -> System.out.println("[ActiveMQ] Tipo desconhecido: " + tipo);
            }
        } catch (Exception e) {
            System.err.println("[ActiveMQ] Erro ao processar mensagem: " + e.getMessage());
        }
    }

    /* NOVO_PEDIDO */
    private void processarNovoPedido(Map<String, String> campos) {
        String orderId    = campos.getOrDefault("orderId", "?");
        String clientName = campos.getOrDefault("clientName", "?");
        String itens      = campos.getOrDefault("itens", "?");

        System.out.println("[ActiveMQ] ✔ Novo pedido recebido:");
        System.out.println("           Pedido  : #" + orderId);
        System.out.println("           Cliente : " + clientName);
        System.out.println("           Itens   : " + itens);
        System.out.println("           Status  : PROCESSANDO");
    }

    /* STATUS_ATUALIZADO  */
    private void processarStatusAtualizado(Map<String, String> campos) {
        String orderId    = campos.getOrDefault("orderId", "?");
        String novoStatus = campos.getOrDefault("novoStatus", "?");

        System.out.println("[ActiveMQ] ✔ Status do pedido #" + orderId + " atualizado para: " + novoStatus);
    }

    private Map<String, String> parsear(String mensagem) {
        Map<String, String> map = new java.util.HashMap<>();
        String[] partes = mensagem.split("\\|");

        if (partes.length > 0) {
            map.put("tipo", partes[0].trim());
        }

        for (int i = 1; i < partes.length; i++) {
            String[] kv = partes[i].split("=", 2);
            if (kv.length == 2) {
                map.put(kv[0].trim(), kv[1].trim());
            }
        }
        return map;
    }
}
