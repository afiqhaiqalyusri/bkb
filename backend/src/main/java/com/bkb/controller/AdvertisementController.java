package com.bkb.controller;

import com.bkb.dto.request.AdvertisementRequest;
import com.bkb.dto.response.AdvertisementResponse;
import com.bkb.service.AdvertisementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/advertisements")
@RequiredArgsConstructor
public class AdvertisementController {

    private final AdvertisementService advertisementService;

    // Public endpoint for frontend
    @GetMapping
    public ResponseEntity<List<AdvertisementResponse>> getAdvertisements(
            @RequestParam(required = false, defaultValue = "true") Boolean activeOnly,
            @RequestParam(required = false) String targetPage) {
        return ResponseEntity.ok(advertisementService.getAdvertisements(activeOnly, targetPage));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<AdvertisementResponse> createAdvertisement(@Valid @RequestBody AdvertisementRequest request) {
        return new ResponseEntity<>(advertisementService.createAdvertisement(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<AdvertisementResponse> updateAdvertisement(
            @PathVariable UUID id,
            @Valid @RequestBody AdvertisementRequest request) {
        return ResponseEntity.ok(advertisementService.updateAdvertisement(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAdvertisement(@PathVariable UUID id) {
        advertisementService.deleteAdvertisement(id);
        return ResponseEntity.noContent().build();
    }
}
