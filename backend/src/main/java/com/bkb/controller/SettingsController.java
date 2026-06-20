package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.StoreSetting;
import com.bkb.repository.StoreSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final StoreSettingRepository storeSettingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StoreSetting>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success("Settings fetched", storeSettingRepository.findAll()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<StoreSetting>>> updateSettings(@RequestBody List<StoreSetting> settings) {
        List<StoreSetting> updated = storeSettingRepository.saveAll(settings);
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully", updated));
    }
}
