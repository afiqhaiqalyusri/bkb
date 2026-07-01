package com.bkb.controller;

import com.bkb.service.MockDataSeederService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@Slf4j
public class DevSeederController {

    private final MockDataSeederService seederService;

    @PostMapping("/seed-mock-data")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> seedMockData() {
        log.info("Manager requested mock data seeding.");
        try {
            seederService.seedMockData();
            return ResponseEntity.ok(Map.of("message", "Successfully seeded mock data (Users & Orders)."));
        } catch (Exception e) {
            log.error("Failed to seed data", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
