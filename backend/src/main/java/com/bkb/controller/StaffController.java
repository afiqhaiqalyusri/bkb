package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.StaffResponse;
import com.bkb.entity.SecurityLog;
import com.bkb.entity.User;
import com.bkb.repository.SecurityLogRepository;
import com.bkb.service.StaffService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Handles HTTP concerns for staff management endpoints.
 * All business logic is delegated to {@link StaffService}.
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;
    private final SecurityLogRepository securityLogRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StaffResponse>>> getAllStaff() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        return ResponseEntity.ok(ApiResponse.success(staffService.getAllStaff(isAdmin)));
    }

    @GetMapping("/security-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<SecurityLog>>> getSecurityLogs(
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                securityLogRepository.findAllByOrderByCreatedAtDesc(pageable)));
    }

    @PutMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateDocuments(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        staffService.updateDocuments(id, body);
        return ResponseEntity.ok(ApiResponse.success("Documents updated", null));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> toggleStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller,
            HttpServletRequest request) {
        staffService.toggleStatus(id, caller, request);
        return ResponseEntity.ok(ApiResponse.success("Status updated", null));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> addStaff(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        StaffResponse staff = staffService.addStaff(body, isAdmin);
        return ResponseEntity.status(201).body(ApiResponse.success("User registered successfully", staff));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StaffResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User caller,
            HttpServletRequest request) {
        StaffResponse staff = staffService.updateUser(id, body, caller, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", staff));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller,
            HttpServletRequest request) {
        staffService.deleteUser(id, caller, request);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
