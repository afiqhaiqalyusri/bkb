package com.bkb.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MenuItemIngredientRequest {
    @NotNull(message = "Menu item ID is required")
    private Long menuItemId;

    @NotBlank(message = "Ingredient name is required")
    private String ingredientName;

    @NotBlank(message = "Default level is required")
    private String defaultLevel;
}
