package com.bkb.dto.response;

import com.bkb.entity.enums.AdType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdvertisementResponse {
    private UUID id;
    private String title;
    private String subtitle;
    private String imageUrl;
    private String targetPage;
    private AdType type;
    private Boolean isActive;
    private Integer displayPriority;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
