package com.bkb.controller;

import com.bkb.entity.CustomizationRule;
import com.bkb.entity.Recipe;
import com.bkb.repository.CustomizationRuleRepository;
import com.bkb.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
public class RecipeController {

    private final RecipeRepository recipeRepository;
    private final CustomizationRuleRepository customizationRuleRepository;

    @GetMapping
    public ResponseEntity<List<Recipe>> getAllRecipes() {
        return ResponseEntity.ok(recipeRepository.findAll());
    }

    @GetMapping("/menu/{menuItemId}")
    public ResponseEntity<Recipe> getRecipeByMenuItem(@PathVariable Long menuItemId) {
        return recipeRepository.findByMenuItemIdWithIngredients(menuItemId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Recipe> saveRecipe(@RequestBody Recipe recipe) {
        return ResponseEntity.ok(recipeRepository.save(recipe));
    }

    @GetMapping("/customization-rules")
    public ResponseEntity<List<CustomizationRule>> getAllCustomizationRules() {
        return ResponseEntity.ok(customizationRuleRepository.findAll());
    }

    @PostMapping("/customization-rules")
    public ResponseEntity<CustomizationRule> saveCustomizationRule(@RequestBody CustomizationRule rule) {
        return ResponseEntity.ok(customizationRuleRepository.save(rule));
    }
}
