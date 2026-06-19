package com.bkb.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RedeemRewardRequest {
    @NotNull
    private Long rewardId;
}
