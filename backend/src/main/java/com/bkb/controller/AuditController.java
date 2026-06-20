package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.SecurityLog;
import com.bkb.repository.SecurityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {

    private final SecurityLogRepository securityLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<SecurityLog>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecurityLog> logs = securityLogRepository.findAllByOrderByCreatedAtDesc(pageable);
        return ResponseEntity.ok(ApiResponse.success("Audit logs fetched", logs));
    }
}
