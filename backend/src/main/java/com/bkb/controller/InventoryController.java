package com.bkb.controller;

import com.bkb.dto.request.InventoryAdjustRequest;
import com.bkb.dto.request.InventoryRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.InventoryResponse;
import com.bkb.entity.InventoryTransaction;
import com.bkb.entity.User;
import com.bkb.entity.enums.InventoryTransactionType;
import com.bkb.repository.InventoryTransactionRepository;
import com.bkb.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryTransactionRepository transactionRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getAllInventory() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllInventory()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStock()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> createItem(
            @Valid @RequestBody InventoryRequest request) {
        InventoryResponse response = inventoryService.createItem(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Inventory item created", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateItem(id, request)));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody InventoryAdjustRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.adjustStock(id, request, user)));
    }

    @PostMapping("/{id}/waste")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<InventoryResponse>> recordWaste(
            @PathVariable Long id,
            @Valid @RequestBody InventoryAdjustRequest request,
            @AuthenticationPrincipal User user) {
        request.setType("WASTE");
        return ResponseEntity.ok(ApiResponse.success(inventoryService.adjustStock(id, request, user)));
    }

    @GetMapping("/transactions/waste")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<com.bkb.dto.response.WasteLogResponse>>> getWasteLog(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        return ResponseEntity.ok(ApiResponse.success(inventoryService.getWasteLogs(from, to)));
    }
}
