package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class InventoryResponse {
    private Long id;
    private String itemName;
    private String category;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal minStock;
    private BigDecimal maxStock;
    private BigDecimal unitCost;
    private String supplier;
    private String status;
    private LocalDateTime updatedAt;
    
    private BigDecimal averageDailyUsage;
    private Integer estimatedDaysRemaining;
}
