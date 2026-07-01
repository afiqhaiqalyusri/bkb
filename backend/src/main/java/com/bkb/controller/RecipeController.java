package com.bkb.controller;

import com.bkb.dto.request.RecipeIngredientRequest;
import com.bkb.dto.request.RecipeNotesRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.RecipeResponse;
import com.bkb.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Menu Recipe management.
 *
 * A Recipe links Inventory items to a MenuItem with required quantities.
 * This is distinct from customer-facing customisation options (ingredient level overrides).
 *
 * All endpoints require MANAGER or ADMIN role.
 */
@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class RecipeController {

    private final RecipeService recipeService;

    /**
     * GET /api/recipes
     * List all menu items with their recipe ingredient counts (summary view for listing page).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecipeResponse>>> getAllRecipes() {
        return ResponseEntity.ok(ApiResponse.success(recipeService.getAllRecipeSummaries()));
    }

    /**
     * GET /api/recipes/menu/{menuItemId}
     * Get the full recipe (with ingredients) for a specific menu item.
     * Auto-creates an empty recipe record if none exists.
     */
    @GetMapping("/menu/{menuItemId}")
    public ResponseEntity<ApiResponse<RecipeResponse>> getRecipeByMenuItem(
            @PathVariable Long menuItemId) {
        return ResponseEntity.ok(ApiResponse.success(recipeService.getOrCreateRecipe(menuItemId)));
    }

    /**
     * PATCH /api/recipes/menu/{menuItemId}/notes
     * Update the preparation notes for a recipe.
     */
    @PatchMapping("/menu/{menuItemId}/notes")
    public ResponseEntity<ApiResponse<RecipeResponse>> updateNotes(
            @PathVariable Long menuItemId,
            @RequestBody RecipeNotesRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                recipeService.updateNotes(menuItemId, request.getNotes())));
    }

    /**
     * POST /api/recipes/menu/{menuItemId}/ingredients
     * Add an ingredient to a menu item's recipe.
     */
    @PostMapping("/menu/{menuItemId}/ingredients")
    public ResponseEntity<ApiResponse<RecipeResponse>> addIngredient(
            @PathVariable Long menuItemId,
            @Valid @RequestBody RecipeIngredientRequest request) {
        RecipeResponse response = recipeService.addIngredient(menuItemId, request);
        return ResponseEntity.status(201).body(ApiResponse.success("Ingredient added to recipe", response));
    }

    /**
     * POST /api/recipes/category/{category}/ingredients
     * Add multiple ingredients to all menu items in a specific category.
     */
    @PostMapping("/category/{category}/ingredients")
    public ResponseEntity<ApiResponse<List<RecipeResponse>>> addIngredientsToCategory(
            @PathVariable String category,
            @Valid @RequestBody List<RecipeIngredientRequest> requests) {
        List<RecipeResponse> responses = recipeService.addIngredientsToCategory(category, requests);
        return ResponseEntity.status(201).body(ApiResponse.success("Ingredients added to category " + category, responses));
    }

    /**
     * PUT /api/recipes/menu/{menuItemId}/ingredients/{ingredientId}
     * Update an existing recipe ingredient (quantity, inventory item, or optional flag).
     */
    @PutMapping("/menu/{menuItemId}/ingredients/{ingredientId}")
    public ResponseEntity<ApiResponse<RecipeResponse>> updateIngredient(
            @PathVariable Long menuItemId,
            @PathVariable Long ingredientId,
            @Valid @RequestBody RecipeIngredientRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                recipeService.updateIngredient(menuItemId, ingredientId, request)));
    }

    /**
     * DELETE /api/recipes/menu/{menuItemId}/ingredients/{ingredientId}
     * Remove an ingredient from a recipe.
     */
    @DeleteMapping("/menu/{menuItemId}/ingredients/{ingredientId}")
    public ResponseEntity<ApiResponse<RecipeResponse>> removeIngredient(
            @PathVariable Long menuItemId,
            @PathVariable Long ingredientId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Ingredient removed from recipe",
                recipeService.removeIngredient(menuItemId, ingredientId)));
    }
}
