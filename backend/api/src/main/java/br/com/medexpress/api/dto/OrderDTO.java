package br.com.medexpress.api.dto;

import java.util.List;

public class OrderDTO {
    private Integer userId;
    private List<OrderItemDTO> items;

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}