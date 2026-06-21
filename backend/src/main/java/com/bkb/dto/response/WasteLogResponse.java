package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class WasteLogResponse {
    private Long id;
    private String inventoryName;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal transactionCost;
    private String reason;
    private LocalDateTime createdAt;
    private String loggedBy;
}
