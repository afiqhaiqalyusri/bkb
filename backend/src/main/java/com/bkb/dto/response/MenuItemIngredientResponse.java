package com.bkb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemIngredientResponse {
    private Long id;
    private Long menuItemId;
    private String menuItemName;
    private String ingredientName;
    private String defaultLevel;
}
