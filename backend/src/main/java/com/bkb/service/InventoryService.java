package com.bkb.service;

import com.bkb.entity.Inventory;
import com.bkb.entity.InventoryTransaction;
import com.bkb.entity.MenuItemInventory;
import com.bkb.entity.Order;
import com.bkb.entity.OrderItem;
import com.bkb.entity.User;
import com.bkb.entity.enums.InventoryStatus;
import com.bkb.entity.enums.InventoryTransactionType;
import com.bkb.dto.request.InventoryAdjustRequest;
import com.bkb.dto.request.InventoryRequest;
import com.bkb.dto.response.InventoryResponse;
import com.bkb.exception.InsufficientStockException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.InventoryRepository;
import com.bkb.repository.InventoryTransactionRepository;
import com.bkb.repository.MenuItemInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final MenuItemInventoryRepository menuItemInventoryRepository;

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
     * Must be called inside an existing @Transactional context.
     */
    public void deductByOrderItem(OrderItem orderItem, Order order) {
        List<MenuItemInventory> recipeLinks =
                menuItemInventoryRepository.findByMenuItemIdWithInventory(orderItem.getMenuItem().getId());

        for (MenuItemInventory link : recipeLinks) {
            Inventory inv = inventoryRepository.findByIdForUpdate(link.getInventory().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory", link.getInventory().getId()));
            BigDecimal needed = link.getQuantityUsed()
                    .multiply(BigDecimal.valueOf(orderItem.getQuantity()));

            // Lock row for concurrent safety (done via @Transactional + DB constraint)
            if (inv.getCurrentStock().compareTo(needed) < 0) {
                throw new InsufficientStockException(
                        inv.getItemName(), needed.doubleValue(), inv.getCurrentStock().doubleValue());
            }

            inv.setCurrentStock(inv.getCurrentStock().subtract(needed));
            inventoryRepository.save(inv);

            BigDecimal transactionCost = inv.getUnitCost() != null ? inv.getUnitCost().multiply(needed) : BigDecimal.ZERO;

            InventoryTransaction tx = InventoryTransaction.builder()
                    .inventory(inv)
                    .type(InventoryTransactionType.DEDUCT)
                    .quantity(needed)
                    .transactionCost(transactionCost)
                    .reason("Order " + order.getOrderNumber())
                    .order(order)
                    .build();
            transactionRepository.save(tx);

            // Alert if stock dropped to LOW or CRITICAL
            if (inv.getStatus() == InventoryStatus.LOW || inv.getStatus() == InventoryStatus.CRITICAL) {
                log.warn("⚠️  Stock alert: {} is now {} ({})", inv.getItemName(), inv.getStatus(), inv.getCurrentStock());
            }
        }
    }

    public List<InventoryTransaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public InventoryResponse toResponse(Inventory inv) {
        // Calculate average daily usage over the last 30 days
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
