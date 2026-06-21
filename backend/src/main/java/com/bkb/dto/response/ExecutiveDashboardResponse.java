package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ExecutiveDashboardResponse {
    private MetricCard revenue;
    private MetricCard profit;
    private MetricCard orders;
    private MetricCard customers;

    private List<PeakHour> peakHours;
    private List<LowStockAlert> lowStockAlerts;
    private List<TopItemEntry> topItems;

    @Data
    @Builder
    public static class MetricCard {
        private String value;
        private BigDecimal percentChange;
        private boolean isPositive;
    }

    @Data
    @Builder
    public static class PeakHour {
        private String hour;
        private long orderCount;
    }

    @Data
    @Builder
    public static class LowStockAlert {
        private String itemName;
        private BigDecimal currentStock;
        private BigDecimal minStock;
    }

    @Data
    @Builder
    public static class TopItemEntry {
        private String itemName;
        private Long totalQuantity;
        private BigDecimal totalRevenue;
    }
}
