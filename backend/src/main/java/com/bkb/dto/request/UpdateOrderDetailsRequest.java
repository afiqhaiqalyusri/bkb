package com.bkb.dto.request;

import lombok.Data;

@Data
public class UpdateOrderDetailsRequest {
    private String guestName;
    private String guestPhone;
    private String notes;
    private String pickupTime;
}
