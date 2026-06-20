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
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getAllInventory() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getAllInventory()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<InventoryResponse>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.getLowStock()));
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse>> createItem(
            @Valid @RequestBody InventoryRequest request) {
        InventoryResponse response = inventoryService.createItem(request);
        return ResponseEntity.status(201).body(ApiResponse.success("Inventory item created", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<InventoryResponse>> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody InventoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.updateItem(id, request)));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<InventoryResponse>> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody InventoryAdjustRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(inventoryService.adjustStock(id, request, user)));
    }

    @PostMapping("/{id}/waste")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<InventoryResponse>> recordWaste(
            @PathVariable Long id,
            @Valid @RequestBody InventoryAdjustRequest request,
            @AuthenticationPrincipal User user) {
        request.setType("WASTE");
        return ResponseEntity.ok(ApiResponse.success(inventoryService.adjustStock(id, request, user)));
    }

    @GetMapping("/transactions/waste")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWasteLog(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<InventoryTransaction> txList;
        if (from != null && to != null) {
            txList = transactionRepository.findByTypeAndDateRange(
                InventoryTransactionType.WASTE,
                from.atStartOfDay(),
                to.plusDays(1).atStartOfDay()
            );
        } else {
            txList = transactionRepository.findByType(InventoryTransactionType.WASTE);
        }

        List<Map<String, Object>> result = txList.stream().map(t -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("inventoryName", t.getInventory() != null ? t.getInventory().getItemName() : "");
            map.put("unit", t.getInventory() != null ? t.getInventory().getUnit() : "");
            map.put("quantity", t.getQuantity());
            map.put("transactionCost", t.getTransactionCost());
            map.put("reason", t.getReason());
            map.put("createdAt", t.getCreatedAt());
            map.put("loggedBy", t.getCreatedBy() != null ? t.getCreatedBy().getName() : "System");
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
