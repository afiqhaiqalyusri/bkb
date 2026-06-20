package com.bkb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerInsightsResponse {
    private Long totalUniqueCustomers;
    private Long repeatCustomers;
    private BigDecimal averageCustomerLtv;
    private BigDecimal averageRating;

    private List<FeedbackEntry> recentFeedback;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeedbackEntry {
        private String customerName;
        private String orderNumber;
        private Integer rating;
        private String feedback;
        private String date;
    }
}
