package br.com.medexpress.api.messaging;

import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

@Component
public class MessageProducer {

    // Nome da fila
    public static final String ORDER_QUEUE = "order-queue";

    private final JmsTemplate jmsTemplate;

    public MessageProducer(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    public void sendOrderMessage(String message) {
        jmsTemplate.convertAndSend(ORDER_QUEUE, message);
        System.out.println("[MessageProducer] Mensagem enviada: " + message);
    }
}