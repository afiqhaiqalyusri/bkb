package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class LoyaltyAccountManagerResponse {
    private Long id;
    private String userName;
    private String userEmail;
    private int points;
    private int totalEarned;
    private LocalDateTime updatedAt;
    private String userRole;
    private String phone;
}
