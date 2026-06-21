package com.bkb.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiErrorResponse {
    @Builder.Default
    private boolean success = false;
    private String errorCode;
    private String message;
    private Object details;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    private String path;
}
