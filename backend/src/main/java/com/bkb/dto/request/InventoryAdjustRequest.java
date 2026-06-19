package com.bkb.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryAdjustRequest {
    @NotNull
    private BigDecimal quantity;
    @NotBlank
    private String type;  // RESTOCK, WASTE, ADJUST
    private String reason;
}
