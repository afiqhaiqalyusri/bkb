package com.bkb.service;

import com.bkb.entity.*;
import com.bkb.entity.enums.InventoryStatus;
import com.bkb.entity.enums.InventoryTrackingType;
import com.bkb.entity.enums.InventoryTransactionType;
import com.bkb.dto.request.InventoryAdjustRequest;
import com.bkb.dto.request.InventoryRequest;
import com.bkb.dto.response.InventoryResponse;
import com.bkb.exception.InsufficientStockException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.InventoryRepository;
import com.bkb.repository.InventoryTransactionRepository;
import com.bkb.repository.RecipeRepository;
import com.bkb.repository.CustomizationRuleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.ApplicationEventPublisher;
import com.bkb.event.InventoryDepletedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final RecipeRepository recipeRepository;
    private final CustomizationRuleRepository customizationRuleRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<InventoryResponse> getLowStock() {
        return inventoryRepository
                .findByStatusIn(List.of(InventoryStatus.LOW, InventoryStatus.CRITICAL))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public InventoryResponse createItem(InventoryRequest request) {
        Inventory inv = Inventory.builder()
                .itemName(request.getItemName())
                .category(request.getCategory())
                .unit(request.getUnit())
                .currentStock(request.getCurrentStock())
                .minStock(request.getMinStock())
                .maxStock(request.getMaxStock())
                .unitCost(request.getUnitCost() != null ? request.getUnitCost() : BigDecimal.ZERO)
                .supplier(request.getSupplier())
                .build();
        inv = inventoryRepository.save(inv);
        return toResponse(inv);
    }

    @Transactional
    public InventoryResponse updateItem(Long id, InventoryRequest request) {
        Inventory inv = inventoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));
        inv.setItemName(request.getItemName());
        inv.setCategory(request.getCategory());
        inv.setUnit(request.getUnit());
        inv.setCurrentStock(request.getCurrentStock());
        inv.setMinStock(request.getMinStock());
        inv.setMaxStock(request.getMaxStock());
        if (request.getUnitCost() != null) inv.setUnitCost(request.getUnitCost());
        if (request.getSupplier() != null) inv.setSupplier(request.getSupplier());
        return toResponse(inventoryRepository.save(inv));
    }

    @Transactional
    public InventoryResponse adjustStock(Long id, InventoryAdjustRequest request, User createdBy) {
        Inventory inv = inventoryRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", id));

        InventoryTransactionType type = InventoryTransactionType.valueOf(request.getType());
        BigDecimal qty = request.getQuantity();

        switch (type) {
            case RESTOCK -> inv.setCurrentStock(inv.getCurrentStock().add(qty));
            case DEDUCT, WASTE -> {
                if (inv.getCurrentStock().compareTo(qty) < 0) {
                    throw new InsufficientStockException(inv.getItemName(),
                            qty.doubleValue(), inv.getCurrentStock().doubleValue());
                }
                inv.setCurrentStock(inv.getCurrentStock().subtract(qty));
            }
            case ADJUST -> inv.setCurrentStock(qty); // set absolute value
        }

        inventoryRepository.save(inv);

        BigDecimal transactionCost = inv.getUnitCost() != null ? inv.getUnitCost().multiply(qty) : BigDecimal.ZERO;

        InventoryTransaction tx = InventoryTransaction.builder()
                .inventory(inv)
                .type(type)
                .quantity(qty)
                .transactionCost(transactionCost)
                .reason(request.getReason())
                .createdBy(createdBy)
                .build();
        transactionRepository.save(tx);

        log.info("Inventory adjusted: {} {} {} by {}", inv.getItemName(), type, qty, createdBy.getEmail());
        return toResponse(inv);
    }

    /**
     * Called by OrderService — deducts inventory for each order item.
     * Parses customizations to adjust deduction quantities.
     */
    public void deductByOrderItem(OrderItem orderItem, Order order) {
        Recipe recipe = recipeRepository.findByMenuItemIdWithIngredients(orderItem.getMenuItem().getId())
                .orElse(null);

        if (recipe == null || recipe.getIngredients().isEmpty()) {
            return; // No recipe found, skip deduction
        }

        // Parse customisations from JSON
        List<Map<String, String>> customisations;
        try {
            customisations = objectMapper.readValue(orderItem.getCustomisations(), new TypeReference<List<Map<String, String>>>(){});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse customisations JSON for order item {}: {}", orderItem.getId(), e.getMessage());
            customisations = List.of();
        }

        for (RecipeIngredient recipeIngredient : recipe.getIngredients()) {
            Inventory inv = recipeIngredient.getInventory();

            // Only deduct automatically tracked items
            if (inv.getTrackingType() == InventoryTrackingType.MANUAL) {
                continue;
            }

            // Lock row for concurrent safety
            final Long inventoryId = inv.getId();
            inv = inventoryRepository.findByIdForUpdate(inventoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", inventoryId));

            final Long lockedInvId = inv.getId();
            final int orderQty = orderItem.getQuantity();

            // Base needed quantity
            BigDecimal baseNeeded = recipeIngredient.getQuantity().multiply(BigDecimal.valueOf(orderQty));
            BigDecimal[] finalNeeded = new BigDecimal[] { baseNeeded };

            // Apply customization adjustments
            for (Map<String, String> cust : customisations) {
                String ingredientName = cust.get("ingredient");
                String level = cust.get("level");
                
                customizationRuleRepository.findByIngredientNameAndLevel(ingredientName, level)
                        .ifPresent(rule -> {
                            if (rule.getInventory().getId().equals(lockedInvId)) {
                                BigDecimal adjustment = rule.getAdjustmentQuantity().multiply(BigDecimal.valueOf(orderQty));
                                finalNeeded[0] = finalNeeded[0].add(adjustment);
                            }
                        });
            }

            // Fallback for missing customisation rule but standard level logic mapping
            for (Map<String, String> cust : customisations) {
                String ingredientName = cust.get("ingredient");
                String level = cust.get("level");
                // basic string match for legacy support if rule not created
                if (ingredientName != null && inv.getItemName().toLowerCase().contains(ingredientName.toLowerCase())) {
                    if ("NONE".equalsIgnoreCase(level)) {
                        finalNeeded[0] = BigDecimal.ZERO;
                    }
                }
            }

            if (finalNeeded[0].compareTo(BigDecimal.ZERO) <= 0) {
                continue; // Skip if customization negated the requirement
            }

            if (inv.getCurrentStock().compareTo(finalNeeded[0]) < 0) {
                throw new InsufficientStockException(
                        inv.getItemName(), finalNeeded[0].doubleValue(), inv.getCurrentStock().doubleValue());
            }

            inv.setCurrentStock(inv.getCurrentStock().subtract(finalNeeded[0]));
            inventoryRepository.save(inv);

            BigDecimal transactionCost = inv.getUnitCost() != null ? inv.getUnitCost().multiply(finalNeeded[0]) : BigDecimal.ZERO;

            InventoryTransaction tx = InventoryTransaction.builder()
                    .inventory(inv)
                    .type(InventoryTransactionType.DEDUCT)
                    .quantity(finalNeeded[0])
                    .transactionCost(transactionCost)
                    .reason("Order " + order.getOrderNumber())
                    .order(order)
                    .build();
            transactionRepository.save(tx);

            if (inv.getStatus() == InventoryStatus.LOW || inv.getStatus() == InventoryStatus.CRITICAL) {
                log.warn("⚠️  Stock alert: {} is now {} ({})", inv.getItemName(), inv.getStatus(), inv.getCurrentStock());
            }

            if (inv.getCurrentStock().compareTo(BigDecimal.ZERO) == 0) {
                eventPublisher.publishEvent(new InventoryDepletedEvent(this, inv));
            }
        }
    }

    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public List<com.bkb.dto.response.WasteLogResponse> getWasteLogs(java.time.LocalDate from, java.time.LocalDate to) {
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

        return txList.stream().map(t -> com.bkb.dto.response.WasteLogResponse.builder()
                .id(t.getId())
                .inventoryName(t.getInventory() != null ? t.getInventory().getItemName() : "")
                .unit(t.getInventory() != null ? t.getInventory().getUnit() : "")
                .quantity(t.getQuantity())
                .transactionCost(t.getTransactionCost())
                .reason(t.getReason())
                .createdAt(t.getCreatedAt())
                .loggedBy(t.getCreatedBy() != null ? t.getCreatedBy().getName() : "System")
                .build()
        ).collect(Collectors.toList());
    }

    public InventoryResponse toResponse(Inventory inv) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        BigDecimal totalDeducted = transactionRepository.sumQuantityByInventoryIdAndTypeAndDateRange(
                inv.getId(), InventoryTransactionType.DEDUCT, thirtyDaysAgo, LocalDateTime.now());
        
        BigDecimal avgDailyUsage = totalDeducted.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        
        Integer estimatedDaysRemaining = null;
        if (avgDailyUsage.compareTo(BigDecimal.ZERO) > 0) {
            estimatedDaysRemaining = inv.getCurrentStock().divide(avgDailyUsage, 0, RoundingMode.HALF_UP).intValue();
        } else if (inv.getCurrentStock().compareTo(BigDecimal.ZERO) == 0) {
            estimatedDaysRemaining = 0;
        }

        return InventoryResponse.builder()
                .id(inv.getId())
                .itemName(inv.getItemName())
                .category(inv.getCategory())
                .unit(inv.getUnit())
                .currentStock(inv.getCurrentStock())
                .minStock(inv.getMinStock())
                .maxStock(inv.getMaxStock())
                .unitCost(inv.getUnitCost())
                .supplier(inv.getSupplier())
                .status(inv.getStatus() != null ? inv.getStatus().name() : "GOOD")
                .updatedAt(inv.getUpdatedAt())
                .averageDailyUsage(avgDailyUsage)
                .estimatedDaysRemaining(estimatedDaysRemaining)
                .build();
    }
}
