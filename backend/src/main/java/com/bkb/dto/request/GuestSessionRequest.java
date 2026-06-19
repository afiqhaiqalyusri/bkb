package com.bkb.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GuestSessionRequest {
    @NotBlank(message = "Guest name is required")
    private String name;
    private String phone;
}
