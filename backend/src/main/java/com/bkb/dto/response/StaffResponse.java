package com.bkb.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Typed response DTO for staff members, including optional {@code StaffDocument} fields.
 * Replaces raw {@code Map<String, Object>} returns in {@code StaffController} to provide
 * compile-time type safety and consistent serialisation.
 *
 * Document fields (icNumber, typhoidExpiry, etc.) are null when no document record exists.
 */
@Data
@Builder
public class StaffResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // Optional StaffDocument fields — null when no document record has been created
    private String icNumber;
    private LocalDate typhoidExpiry;
    private LocalDate foodHandlerExpiry;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String notes;
}
