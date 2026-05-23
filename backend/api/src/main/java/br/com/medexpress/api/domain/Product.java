package br.com.medexpress.api.domain;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "tb_product") // tb -> abreviação de table
public class Product{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    private BigDecimal price;

    @JsonProperty("url_image")
    private String URL_IMAGE;

    private String description;

    public Product(){}

    public Integer getId(){ return id; }
    public void setId(Integer id){ this.id = id; }

    public String getName(){ return name; }
    public void setName(String name){ this.name = name; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getURL_IMAGE() { return URL_IMAGE; }
    public void setURL_IMAGE(String URL_IMAGE) { this.URL_IMAGE = URL_IMAGE; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}