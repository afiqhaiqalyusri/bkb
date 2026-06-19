package com.bkb.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class MenuItemRequest {
    @NotBlank
    private String name;
    private String description;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    private BigDecimal promoPrice;
    private String category;
    private String imageUrl;
    private Boolean isAvailable = true;
    private List<IngredientRequest> ingredients;

    @Data
    public static class IngredientRequest {
        private String ingredientName;
        private String defaultLevel;
    }
}
