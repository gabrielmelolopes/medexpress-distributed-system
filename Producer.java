import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.Session;
import javax.jms.MessageProducer;
import javax.jms.TextMessage;

import org.apache.activemq.ActiveMQConnectionFactory;

public class Producer {

    public static void main(String[] args) throws Exception {

        ConnectionFactory cf = new ActiveMQConnectionFactory("tcp://localhost:61616");
        Connection conn = cf.createConnection();
        conn.start();
        Session session = conn.createSession(false, Session.AUTO_ACKNOWLEDGE);
        Destination queue = session.createQueue("medexpress.queue");
        MessageProducer producer = session.createProducer(queue);
        String msg = "Hello World MedExpress";
        TextMessage message = session.createTextMessage(msg);
        producer.send(message);
        System.out.println("Mensagem enviada com sucesso!");
        session.close();
        conn.close();
    }
}