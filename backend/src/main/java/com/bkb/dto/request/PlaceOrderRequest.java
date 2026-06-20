package com.bkb.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PlaceOrderRequest {
    @NotEmpty(message = "Order must have at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @NotNull(message = "Payment method is required")
    private String paymentMethod; // ONLINE or CASH

    private String paymentChannel; // e.g. TNG, SHOPEEPAY, etc.
    private LocalDateTime pickupTime;
    private String notes;
    private String guestName;
    private String guestPhone;
    private Long loyaltyRedemptionId;
    private String promoCode;

    @Data
    public static class OrderItemRequest {
        @NotNull
        private Long menuItemId;
        @NotNull
        private Integer quantity;
        private List<CustomisationRequest> customisations;
        private Boolean isFree;
    }

    @Data
    public static class CustomisationRequest {
        private String ingredient;
        private String level;
    }
}
