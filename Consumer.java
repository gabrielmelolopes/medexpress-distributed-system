import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.Session;
import javax.jms.MessageConsumer;
import javax.jms.TextMessage;

import org.apache.activemq.ActiveMQConnectionFactory;

public class Consumer {

    public static void main(String[] args) throws Exception {

        ConnectionFactory factory = new ActiveMQConnectionFactory("tcp://localhost:61616");

        Connection connection = factory.createConnection();
        connection.start();

        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);

        Destination queue = session.createQueue("medexpress.queue");

        MessageConsumer consumer = session.createConsumer(queue);

        System.out.println("Aguardando mensagens...");
        TextMessage message = (TextMessage) consumer.receive();
        String json = message.getText();
        session.close();
        connection.close();
    }
}