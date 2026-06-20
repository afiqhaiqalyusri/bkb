package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal total;
    private LocalDateTime pickupTime;
    private LocalDateTime scheduledTime;
    private LocalDateTime queueEnteredAt;
    private String notes;
    private String guestPhone;
    private LocalDateTime createdAt;
    private String customerName;
    private Long customerId;
    private String paymentToken;
    private String paymentChannel;
    private String guestToken;
    private Integer rating;
    private String feedback;
    private List<OrderItemResponse> items;

    @Data
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String menuItemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String customisations;
    }
}
