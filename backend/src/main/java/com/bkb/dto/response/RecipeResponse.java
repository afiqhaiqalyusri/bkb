package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RecipeResponse {

    private Long id;
    private Long menuItemId;
    private String menuItemName;
    private String menuItemCategory;
    private String menuItemImageUrl;
    private String notes;
    private LocalDateTime updatedAt;
    private List<RecipeIngredientResponse> ingredients;

    @Data
    @Builder
    public static class RecipeIngredientResponse {
        private Long id;
        private Long inventoryId;
        private String inventoryName;
        private String unit;
        private String trackingType;
        private BigDecimal quantity;
        private boolean isOptional;
        // Snapshot of current stock for display
        private BigDecimal currentStock;
        private String stockStatus;
    }
}
