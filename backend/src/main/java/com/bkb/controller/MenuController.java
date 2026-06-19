package com.bkb.controller;

import com.bkb.dto.request.MenuItemRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.MenuItemResponse;
import com.bkb.dto.response.PromotionResponse;
import com.bkb.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAllItems() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getAllAvailableItems()));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<MenuItemResponse>>> getAllItemsForStaff() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getAllItems()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MenuItemResponse>> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(menuService.getItemById(id)));
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getCategories()));
    }

    @GetMapping("/promotions")
    public ResponseEntity<ApiResponse<List<PromotionResponse>>> getPromotions() {
        return ResponseEntity.ok(ApiResponse.success(menuService.getActivePromotions()));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> createItem(@Valid @RequestBody MenuItemRequest request) {
        MenuItemResponse response = menuService.createItem(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Menu item created", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(menuService.updateItem(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        menuService.deleteItem(id);
        return ResponseEntity.ok(ApiResponse.success("Menu item deactivated", null));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<MenuItemResponse>> toggleItem(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(menuService.toggleAvailability(id)));
    }
}
