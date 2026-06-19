package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class SalesReportResponse {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private BigDecimal avgOrderValue;
    private List<DailyRevenueEntry> dailyRevenue;
    private List<TopItemEntry> topItems;

    @Data
    @Builder
    public static class DailyRevenueEntry {
        private String date;
        private BigDecimal revenue;
        private Long orders;
    }

    @Data
    @Builder
    public static class TopItemEntry {
        private String itemName;
        private Long totalQuantity;
        private BigDecimal totalRevenue;
    }
}
