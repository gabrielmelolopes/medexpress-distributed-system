package br.com.medexpress.api.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tb_order_item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private Integer quantity;

    private BigDecimal price;


    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    private Product product;

    public OrderItem() {}

    public Integer getId()                      { return id; }
    public void setId(Integer id)               { this.id = id; }

    public Integer getQuantity()                { return quantity; }
    public void setQuantity(Integer quantity)   { this.quantity = quantity; }

    public BigDecimal getPrice()                { return price; }
    public void setPrice(BigDecimal price)      { this.price = price; }

    public Order getOrder()                     { return order; }
    public void setOrder(Order order)           { this.order = order; }

    public Product getProduct()                 { return product; }
    public void setProduct(Product product)     { this.product = product; }
}