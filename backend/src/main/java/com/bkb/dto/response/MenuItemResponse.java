package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MenuItemResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal promoPrice;
    private String category;
    private String imageUrl;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    private List<IngredientResponse> ingredients;

    @Data
    @Builder
    public static class IngredientResponse {
        private Long id;
        private String ingredientName;
        private String defaultLevel;
    }
}
