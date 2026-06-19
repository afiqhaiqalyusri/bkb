package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoyaltyRewardResponse {
    private Long id;
    private String name;
    private Integer pointsCost;
    private Boolean isActive;
    private Long menuItemId;
    private String menuItemName;
    private String menuItemImageUrl;
    private String description;
    private String imageUrl;
}
