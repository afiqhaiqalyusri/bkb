package com.bkb.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class InventoryRequest {
    @NotBlank
    private String itemName;
    private String category;
    private String unit;

    @NotNull
    @DecimalMin("0")
    private BigDecimal currentStock;

    @NotNull
    @DecimalMin("0")
    private BigDecimal minStock;

    @NotNull
    @DecimalMin("0")
    private BigDecimal maxStock;
}
