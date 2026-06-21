package com.bkb.controller;

import com.bkb.dto.request.RedeemRewardRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.LoyaltyAccountResponse;
import com.bkb.dto.response.LoyaltyRewardResponse;
import com.bkb.entity.User;
import com.bkb.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Handles HTTP concerns for loyalty programme endpoints.
 * All business logic is delegated to {@link LoyaltyService}.
 */
@RestController
@RequestMapping("/api/loyalty")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    // ─── Customer endpoints ──────────────────────────────────────

    @GetMapping("/account")
    @PreAuthorize("hasRole('CUSTOMER') and !hasRole('STAFF')")
    public ResponseEntity<ApiResponse<LoyaltyAccountResponse>> getAccount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(loyaltyService.getAccountForUser(user)));
    }

    @GetMapping("/rewards")
    public ResponseEntity<ApiResponse<List<LoyaltyRewardResponse>>> getRewards() {
        return ResponseEntity.ok(ApiResponse.success(loyaltyService.getAllActiveRewards()));
    }

    @PostMapping("/redeem")
    @PreAuthorize("hasRole('CUSTOMER') and !hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Void>> redeemReward(
            @Valid @RequestBody RedeemRewardRequest request,
            @AuthenticationPrincipal User user) {
        loyaltyService.redeemReward(user, request.getRewardId());
        return ResponseEntity.ok(ApiResponse.success("Reward redeemed successfully!", null));
    }

    // ─── Manager endpoints ───────────────────────────────────────

    @GetMapping("/rewards/all")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<LoyaltyRewardResponse>>> getAllRewards() {
        return ResponseEntity.ok(ApiResponse.success(loyaltyService.getAllRewards()));
    }

    @PostMapping("/rewards")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<LoyaltyRewardResponse>> createReward(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        int pointsCost = Integer.parseInt(body.get("pointsCost").toString());
        String description = body.containsKey("description") ? (String) body.get("description") : null;
        String imageUrl = body.containsKey("imageUrl") ? (String) body.get("imageUrl") : null;
        Long menuItemId = body.containsKey("menuItemId") && body.get("menuItemId") != null
                ? Long.parseLong(body.get("menuItemId").toString()) : null;
        return ResponseEntity.ok(ApiResponse.success(
                loyaltyService.createReward(name, pointsCost, menuItemId, description, imageUrl)));
    }

    @PutMapping("/rewards/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<LoyaltyRewardResponse>> updateReward(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(loyaltyService.updateReward(id, body)));
    }

    @DeleteMapping("/rewards/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteReward(@PathVariable Long id) {
        loyaltyService.deleteReward(id);
        return ResponseEntity.ok(ApiResponse.success("Reward deleted", null));
    }

    @GetMapping("/accounts")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<List<com.bkb.dto.response.LoyaltyAccountManagerResponse>>> getAllAccounts() {
        return ResponseEntity.ok(ApiResponse.success(loyaltyService.getAllAccountsForManager()));
    }

    @PostMapping("/accounts/{id}/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adjustPoints(
            @PathVariable Long id, @RequestBody Map<String, Object> body) {
        int points = Integer.parseInt(body.get("points").toString());
        String reason = body.containsKey("reason") ? (String) body.get("reason") : "Manual Adjustment";
        loyaltyService.adjustPoints(id, points, reason);
        return ResponseEntity.ok(ApiResponse.success("Points adjusted successfully", null));
    }
}
