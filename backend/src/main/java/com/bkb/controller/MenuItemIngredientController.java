package com.bkb.controller;

import com.bkb.dto.request.MenuItemIngredientRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.MenuItemIngredientResponse;
import com.bkb.entity.MenuItem;
import com.bkb.entity.MenuItemIngredient;
import com.bkb.entity.enums.IngredientLevel;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.MenuItemIngredientRepository;
import com.bkb.repository.MenuItemRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
public class MenuItemIngredientController {

    private final MenuItemIngredientRepository ingredientRepository;
    private final MenuItemRepository menuItemRepository;

    @GetMapping("/item/{menuItemId}")
    public ResponseEntity<ApiResponse<List<MenuItemIngredientResponse>>> getByMenuItem(@PathVariable Long menuItemId) {
        List<MenuItemIngredientResponse> responses = ingredientRepository.findByMenuItemId(menuItemId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Customizations retrieved successfully", responses));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemIngredientResponse>> create(@Valid @RequestBody MenuItemIngredientRequest request) {
        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Menu Item", request.getMenuItemId()));

        IngredientLevel level;
        try {
            level = IngredientLevel.valueOf(request.getDefaultLevel().toUpperCase());
        } catch (Exception e) {
            level = IngredientLevel.MEDIUM;
        }

        MenuItemIngredient ingredient = MenuItemIngredient.builder()
                .menuItem(menuItem)
                .ingredientName(request.getIngredientName())
                .defaultLevel(level)
                .build();

        ingredient = ingredientRepository.save(ingredient);
        return ResponseEntity.ok(ApiResponse.success("Customization created successfully", toResponse(ingredient)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemIngredientResponse>> update(@PathVariable Long id, @Valid @RequestBody MenuItemIngredientRequest request) {
        MenuItemIngredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customization Option", id));

        IngredientLevel level;
        try {
            level = IngredientLevel.valueOf(request.getDefaultLevel().toUpperCase());
        } catch (Exception e) {
            level = IngredientLevel.MEDIUM;
        }

        ingredient.setIngredientName(request.getIngredientName());
        ingredient.setDefaultLevel(level);

        ingredient = ingredientRepository.save(ingredient);
        return ResponseEntity.ok(ApiResponse.success("Customization updated successfully", toResponse(ingredient)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!ingredientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customization Option", id);
        }
        ingredientRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Customization deleted successfully", null));
    }

    private MenuItemIngredientResponse toResponse(MenuItemIngredient ingredient) {
        return MenuItemIngredientResponse.builder()
                .id(ingredient.getId())
                .menuItemId(ingredient.getMenuItem().getId())
                .menuItemName(ingredient.getMenuItem().getName())
                .ingredientName(ingredient.getIngredientName())
                .defaultLevel(ingredient.getDefaultLevel().name())
                .build();
    }
}
