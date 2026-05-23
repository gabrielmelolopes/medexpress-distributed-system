package br.com.medexpress.api.messaging;

import br.com.medexpress.api.domain.OrderStatus;
import br.com.medexpress.api.service.OrderService;
import org.springframework.context.annotation.Lazy;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Consumidor da fila "order-queue" (ActiveMQ).
 *
 * Recebe mensagens publicadas pelo MessageProducer e age sobre elas:
 *
 *   NOVO_PEDIDO      → loga e poderia disparar e-mail, notificação push, etc.
 *   STATUS_ATUALIZADO → loga a mudança de status para auditoria
 *
 * O @Lazy no OrderService evita dependência circular:
 *   OrderService → MessageProducer → MessageConsumer → OrderService
 */
@Component
public class MessageConsumer {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    // @Lazy: o Spring injeta um proxy e só inicializa o OrderService
    // quando updateStatus() for de fato chamado, quebrando o ciclo.
    private final OrderService orderService;

    public MessageConsumer(@Lazy OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Escuta a fila "order-queue".
     * Formato das mensagens:
     *
     *   NOVO_PEDIDO|orderId=5|clientId=1|clientName=João|itens=2|status=PROCESSANDO
     *   STATUS_ATUALIZADO|orderId=5|novoStatus=ENVIADO
     */
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

    /* ── NOVO_PEDIDO ──────────────────────────────────────────── */
    private void processarNovoPedido(Map<String, String> campos) {
        String orderId    = campos.getOrDefault("orderId", "?");
        String clientName = campos.getOrDefault("clientName", "?");
        String itens      = campos.getOrDefault("itens", "?");

        System.out.println("[ActiveMQ] ✔ Novo pedido recebido:");
        System.out.println("           Pedido  : #" + orderId);
        System.out.println("           Cliente : " + clientName);
        System.out.println("           Itens   : " + itens);
        System.out.println("           Status  : PROCESSANDO");

        // ── Aqui você pode expandir: ────────────────────────────
        // emailService.enviarConfirmacao(clientEmail, orderId);
        // pushService.notificar(clientId, "Pedido #" + orderId + " recebido!");
        // ────────────────────────────────────────────────────────
    }

    /* ── STATUS_ATUALIZADO ────────────────────────────────────── */
    private void processarStatusAtualizado(Map<String, String> campos) {
        String orderId    = campos.getOrDefault("orderId", "?");
        String novoStatus = campos.getOrDefault("novoStatus", "?");

        System.out.println("[ActiveMQ] ✔ Status do pedido #" + orderId + " atualizado para: " + novoStatus);

        // ── Aqui você pode expandir: ────────────────────────────
        // pushService.notificar(clientId, "Seu pedido foi " + novoStatus);
        // ────────────────────────────────────────────────────────
    }

    /* ── Parser de mensagem no formato chave=valor|chave=valor ── */
    private Map<String, String> parsear(String mensagem) {
        Map<String, String> map = new java.util.HashMap<>();
        String[] partes = mensagem.split("\\|");

        // O primeiro segmento é o tipo (ex: "NOVO_PEDIDO")
        if (partes.length > 0) {
            map.put("tipo", partes[0].trim());
        }

        // Os demais são chave=valor
        for (int i = 1; i < partes.length; i++) {
            String[] kv = partes[i].split("=", 2);
            if (kv.length == 2) {
                map.put(kv[0].trim(), kv[1].trim());
            }
        }
        return map;
    }
}