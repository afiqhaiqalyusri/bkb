package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PromotionResponse {
    private Long id;
    private String title;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;
}
