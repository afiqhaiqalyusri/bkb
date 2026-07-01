package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.IngredientOutage;
import com.bkb.repository.IngredientOutageRepository;
import com.bkb.repository.RecipeIngredientRepository;
import com.bkb.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ingredients/outage")
@RequiredArgsConstructor
public class IngredientOutageController {

    private final IngredientOutageRepository ingredientOutageRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IngredientOutage>>> getAllOutages() {
        syncOutages();
        return ResponseEntity.ok(ApiResponse.success(ingredientOutageRepository.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<IngredientOutage>>> getActiveOutages() {
        syncOutages();
        List<IngredientOutage> active = ingredientOutageRepository.findAll().stream()
                .filter(IngredientOutage::getOutOfStock)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(active));
    }

    @PatchMapping("/{name}/toggle")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IngredientOutage>> toggleOutage(@PathVariable String name) {
        IngredientOutage outage = ingredientOutageRepository.findById(name)
                .orElseGet(() -> IngredientOutage.builder().name(name).outOfStock(false).build());
        
        outage.setOutOfStock(!outage.getOutOfStock());
        IngredientOutage saved = ingredientOutageRepository.save(outage);
        return ResponseEntity.ok(ApiResponse.success("Ingredient availability updated", saved));
    }

    private void syncOutages() {
        List<String> recipeIngredientNames = recipeIngredientRepository.findAll().stream()
                .map(ri -> ri.getInventory().getItemName())
                .distinct()
                .toList();

        List<IngredientOutage> existingOutages = ingredientOutageRepository.findAll();
        List<String> existingNames = existingOutages.stream().map(IngredientOutage::getName).toList();

        List<IngredientOutage> newOutages = recipeIngredientNames.stream()
                .filter(name -> !existingNames.contains(name))
                .map(name -> IngredientOutage.builder().name(name).outOfStock(false).build())
                .toList();

        if (!newOutages.isEmpty()) {
            ingredientOutageRepository.saveAll(newOutages);
        }
    }
}
