package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class LoyaltyAccountResponse {
    private Long id;
    private Integer points;
    private Integer totalEarned;
    private LocalDateTime updatedAt;
    private List<LoyaltyTransactionResponse> transactions;

    @Data
    @Builder
    public static class LoyaltyTransactionResponse {
        private Long id;
        private String type;
        private Integer points;
        private String orderNumber;
        private LocalDateTime createdAt;
    }
}
