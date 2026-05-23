package br.com.medexpress.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tb_order")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private LocalDateTime moment;

    /*
     * @JsonIgnoreProperties("password"): serializa o cliente mas omite a senha.
     * Evita expor dados sensíveis na resposta do POST /orders.
     */
    @JsonIgnoreProperties({"password", "hibernateLazyInitializer"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User client;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @JsonIgnoreProperties({"order", "hibernateLazyInitializer"})
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {}

    public Integer getId()                      { return id; }
    public void setId(Integer id)               { this.id = id; }

    public LocalDateTime getMoment()            { return moment; }
    public void setMoment(LocalDateTime moment) { this.moment = moment; }

    public User getClient()                     { return client; }
    public void setClient(User client)          { this.client = client; }

    public OrderStatus getStatus()              { return status; }
    public void setStatus(OrderStatus status)   { this.status = status; }

    public List<OrderItem> getItems()           { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}