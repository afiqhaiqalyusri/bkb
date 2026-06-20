package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class MenuAnalyticsResponse {
    private List<MenuItemPerformance> topSellers;
    private List<MenuItemPerformance> worstSellers;

    @Data
    @Builder
    public static class MenuItemPerformance {
        private String itemName;
        private long totalSold;
        private BigDecimal totalRevenue;
        private BigDecimal estimatedProfit;
    }
}
