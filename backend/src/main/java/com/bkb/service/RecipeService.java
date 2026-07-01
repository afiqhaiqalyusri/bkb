package com.bkb.service;

import com.bkb.dto.request.RecipeIngredientRequest;
import com.bkb.dto.response.RecipeResponse;
import com.bkb.entity.Inventory;
import com.bkb.entity.MenuItem;
import com.bkb.entity.Recipe;
import com.bkb.entity.RecipeIngredient;
import com.bkb.exception.BkbException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.InventoryRepository;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.RecipeIngredientRepository;
import com.bkb.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for Recipe management.
 *
 * A Recipe defines the standard ingredients required to prepare a MenuItem.
 * This is separate from customer customisations (ingredient level overrides at order time).
 *
 * Workflow:
 *   Recipe (standard ingredients) → Customer Customisation → Final Ingredients → Inventory Deduction
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final MenuItemRepository menuItemRepository;
    private final InventoryRepository inventoryRepository;

    // ─── Read ──────────────────────────────────────────────────────────────────

    /**
     * Get the recipe for a given menu item. Creates an empty recipe if none exists yet.
     */
    @Transactional
    public RecipeResponse getOrCreateRecipe(Long menuItemId) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", menuItemId));

        Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(menuItemId)
                .orElseGet(() -> {
                    log.info("Creating empty recipe for menu item id={}", menuItemId);
                    Recipe newRecipe = Recipe.builder()
                            .menuItem(menuItem)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return recipeRepository.save(newRecipe);
                });

        return toResponse(recipe);
    }

    /**
     * Get recipes for all non-deleted menu items (pageable summary for listing).
     */
    public List<RecipeResponse> getAllRecipeSummaries() {
        return menuItemRepository.findByDeletedFalse()
                .stream()
                .map(item -> {
                    Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(item.getId()).orElse(null);
                    if (recipe == null) {
                        // Return a stub with zero ingredients
                        return RecipeResponse.builder()
                                .menuItemId(item.getId())
                                .menuItemName(item.getName())
                                .menuItemCategory(item.getCategory())
                                .menuItemImageUrl(item.getImageUrl())
                                .ingredients(List.of())
                                .build();
                    }
                    return toResponse(recipe);
                })
                .collect(Collectors.toList());
    }

    // ─── Write ─────────────────────────────────────────────────────────────────

    /**
     * Update recipe notes for a menu item.
     */
    @Transactional
    public RecipeResponse updateNotes(Long menuItemId, String notes) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", menuItemId));

        Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(menuItemId)
                .orElseGet(() -> Recipe.builder()
                        .menuItem(menuItem)
                        .build());

        recipe.setNotes(notes);
        recipe.setUpdatedAt(LocalDateTime.now());
        return toResponse(recipeRepository.save(recipe));
    }

    /**
     * Add an ingredient to a menu item's recipe.
     * Prevents duplicate inventory items in the same recipe.
     */
    @Transactional
    public RecipeResponse addIngredient(Long menuItemId, RecipeIngredientRequest request) {
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", menuItemId));

        Inventory inventory = inventoryRepository.findById(request.getInventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item", request.getInventoryId()));

        Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(menuItemId)
                .orElseGet(() -> {
                    Recipe newRecipe = Recipe.builder()
                            .menuItem(menuItem)
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return recipeRepository.save(newRecipe);
                });

        // Guard: prevent duplicate inventory in the same recipe
        boolean alreadyExists = recipe.getIngredients().stream()
                .anyMatch(ri -> ri.getInventory().getId().equals(request.getInventoryId()));
        if (alreadyExists) {
            throw new BkbException("'" + inventory.getItemName() + "' is already in this recipe. Use the edit action to change the quantity.");
        }

        RecipeIngredient ingredient = RecipeIngredient.builder()
                .recipe(recipe)
                .inventory(inventory)
                .quantity(request.getQuantity())
                .isOptional(request.isOptional())
                .build();

        recipe.getIngredients().add(ingredient);
        recipe.setUpdatedAt(LocalDateTime.now());

        return toResponse(recipeRepository.save(recipe));
    }

    /**
     * Add multiple ingredients to all menu items in a specific category.
     * Skips items where the ingredient already exists.
     */
    @Transactional
    public List<RecipeResponse> addIngredientsToCategory(String category, List<RecipeIngredientRequest> requests) {
        List<MenuItem> items = menuItemRepository.findByCategoryAndDeletedFalse(category);
        List<RecipeResponse> responses = new java.util.ArrayList<>();
        
        for (MenuItem item : items) {
            // Ensure recipe exists
            Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(item.getId())
                    .orElseGet(() -> {
                        Recipe newRecipe = Recipe.builder()
                                .menuItem(item)
                                .updatedAt(LocalDateTime.now())
                                .build();
                        return recipeRepository.save(newRecipe);
                    });

            boolean updated = false;

            for (RecipeIngredientRequest request : requests) {
                Inventory inventory = inventoryRepository.findById(request.getInventoryId())
                        .orElseThrow(() -> new ResourceNotFoundException("Inventory item", request.getInventoryId()));

                boolean alreadyExists = recipe.getIngredients().stream()
                        .anyMatch(ri -> ri.getInventory().getId().equals(request.getInventoryId()));

                if (!alreadyExists) {
                    RecipeIngredient ingredient = RecipeIngredient.builder()
                            .recipe(recipe)
                            .inventory(inventory)
                            .quantity(request.getQuantity())
                            .isOptional(request.isOptional())
                            .build();
                    recipe.getIngredients().add(ingredient);
                    updated = true;
                }
            }

            if (updated) {
                recipe.setUpdatedAt(LocalDateTime.now());
                recipe = recipeRepository.save(recipe);
            }
            responses.add(toResponse(recipe));
        }
        
        return responses;
    }

    /**
     * Update quantity or optional flag for an existing recipe ingredient.
     */
    @Transactional
    public RecipeResponse updateIngredient(Long menuItemId, Long ingredientId, RecipeIngredientRequest request) {
        // Validate menu item exists
        menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", menuItemId));

        RecipeIngredient ingredient = recipeIngredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe ingredient", ingredientId));

        // Verify ingredient belongs to this menu item's recipe
        if (!ingredient.getRecipe().getMenuItem().getId().equals(menuItemId)) {
            throw new BkbException("Recipe ingredient does not belong to this menu item.");
        }

        // If swapping inventory item, check for duplicates
        if (!ingredient.getInventory().getId().equals(request.getInventoryId())) {
            Inventory newInventory = inventoryRepository.findById(request.getInventoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory item", request.getInventoryId()));

            Recipe recipe = ingredient.getRecipe();
            boolean duplicateExists = recipe.getIngredients().stream()
                    .filter(ri -> !ri.getId().equals(ingredientId))
                    .anyMatch(ri -> ri.getInventory().getId().equals(request.getInventoryId()));
            if (duplicateExists) {
                throw new BkbException("'" + newInventory.getItemName() + "' is already in this recipe.");
            }
            ingredient.setInventory(newInventory);
        }

        ingredient.setQuantity(request.getQuantity());
        ingredient.setOptional(request.isOptional());

        RecipeIngredient saved = recipeIngredientRepository.save(ingredient);
        saved.getRecipe().setUpdatedAt(LocalDateTime.now());
        recipeRepository.save(saved.getRecipe());

        return getOrCreateRecipe(menuItemId);
    }

    /**
     * Remove an ingredient from a recipe.
     */
    @Transactional
    public RecipeResponse removeIngredient(Long menuItemId, Long ingredientId) {
        // Validate menu item exists
        menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item", menuItemId));

        RecipeIngredient ingredient = recipeIngredientRepository.findById(ingredientId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe ingredient", ingredientId));

        if (!ingredient.getRecipe().getMenuItem().getId().equals(menuItemId)) {
            throw new BkbException("Recipe ingredient does not belong to this menu item.");
        }

        Recipe recipe = ingredient.getRecipe();
        recipeIngredientRepository.delete(ingredient);
        recipe.setUpdatedAt(LocalDateTime.now());
        recipeRepository.save(recipe);

        return getOrCreateRecipe(menuItemId);
    }

    // ─── Mapper ────────────────────────────────────────────────────────────────

    public RecipeResponse toResponse(Recipe recipe) {
        List<RecipeResponse.RecipeIngredientResponse> ingredients = recipe.getIngredients()
                .stream()
                .map(ri -> {
                    Inventory inv = ri.getInventory();
                    return RecipeResponse.RecipeIngredientResponse.builder()
                            .id(ri.getId())
                            .inventoryId(inv.getId())
                            .inventoryName(inv.getItemName())
                            .unit(inv.getUnit())
                            .trackingType(inv.getTrackingType() != null ? inv.getTrackingType().name() : "AUTO")
                            .quantity(ri.getQuantity())
                            .isOptional(ri.isOptional())
                            .currentStock(inv.getCurrentStock())
                            .stockStatus(inv.getStatus() != null ? inv.getStatus().name() : "GOOD")
                            .build();
                })
                .collect(Collectors.toList());

        MenuItem menuItem = recipe.getMenuItem();
        return RecipeResponse.builder()
                .id(recipe.getId())
                .menuItemId(menuItem.getId())
                .menuItemName(menuItem.getName())
                .menuItemCategory(menuItem.getCategory())
                .menuItemImageUrl(menuItem.getImageUrl())
                .notes(recipe.getNotes())
                .updatedAt(recipe.getUpdatedAt())
                .ingredients(ingredients)
                .build();
    }
}
