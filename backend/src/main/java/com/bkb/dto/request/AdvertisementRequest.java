package com.bkb.dto.request;

import com.bkb.entity.enums.AdType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdvertisementRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String subtitle;

    @NotBlank(message = "Image URL is required")
    private String imageUrl;

    private String targetPage;

    @NotNull(message = "Ad Type is required")
    private AdType type;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    private Integer displayPriority;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
