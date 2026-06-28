package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.IngredientOutage;
import com.bkb.repository.IngredientOutageRepository;
import com.bkb.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredients/outage")
@RequiredArgsConstructor
public class IngredientOutageController {

    private final IngredientOutageRepository ingredientOutageRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<IngredientOutage>>> getAllOutages() {
        return ResponseEntity.ok(ApiResponse.success(ingredientOutageRepository.findAll()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<IngredientOutage>>> getActiveOutages() {
        List<IngredientOutage> active = ingredientOutageRepository.findAll().stream()
                .filter(IngredientOutage::getOutOfStock)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(active));
    }

    @PatchMapping("/{name}/toggle")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<IngredientOutage>> toggleOutage(@PathVariable String name) {
        IngredientOutage outage = ingredientOutageRepository.findById(name)
                .orElseThrow(() -> new ResourceNotFoundException("Ingredient " + name + " not found"));
        outage.setOutOfStock(!outage.getOutOfStock());
        IngredientOutage saved = ingredientOutageRepository.save(outage);
        return ResponseEntity.ok(ApiResponse.success("Ingredient availability updated", saved));
    }
}
