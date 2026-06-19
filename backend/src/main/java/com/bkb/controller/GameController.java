package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.User;
import com.bkb.repository.OrderRepository;
import com.bkb.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@Slf4j
public class GameController {

    private final LoyaltyService loyaltyService;
    private final OrderRepository orderRepository;

    // In-memory dedup: "userId:orderId" → prevents farming per server session
    private final Set<String> claimedSessions = Collections.newSetFromMap(new ConcurrentHashMap<>());

    private static final int MAX_POINTS_PER_SESSION = 20;
    private static final int SCORE_PER_POINT = 100;

    /**
     * Submit a mini-game score and award loyalty points.
     * Only logged-in CUSTOMER users can earn points.
     * Points are awarded once per order session.
     */
    @PostMapping("/submit")
    @PreAuthorize("hasRole('CUSTOMER') and !hasRole('STAFF')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> submitScore(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("pointsAwarded", 0, "message", "Login to earn loyalty points!")));
        }

        Long orderId = body.containsKey("orderId")
                ? Long.parseLong(body.get("orderId").toString()) : null;
        int score = body.containsKey("score")
                ? Integer.parseInt(body.get("score").toString()) : 0;

        // Validate orderId belongs to this user
        if (orderId != null) {
            boolean isOwnOrder = orderRepository.findById(orderId)
                    .map(o -> o.getUser() != null && o.getUser().getId().equals(user.getId()))
                    .orElse(false);
            if (!isOwnOrder) {
                return ResponseEntity.ok(ApiResponse.success(
                        Map.of("pointsAwarded", 0, "message", "Invalid order session.")));
            }
        }

        // Dedup check: one reward per user per order
        String sessionKey = user.getId() + ":" + (orderId != null ? orderId : "guest");
        if (claimedSessions.contains(sessionKey)) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("pointsAwarded", 0, "message", "Points already claimed for this order session!")));
        }

        // Calculate points: 1 point per 100 score, max 20
        int rawPoints = Math.max(0, score / SCORE_PER_POINT);
        int pointsToAward = Math.min(rawPoints, MAX_POINTS_PER_SESSION);

        if (pointsToAward <= 0) {
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("pointsAwarded", 0, "message", "Score too low to earn points. Keep playing!")));
        }

        // Find or create loyalty account and award points
        com.bkb.entity.LoyaltyAccount account = loyaltyService.getOrCreateAccount(user);
        loyaltyService.adjustPoints(account.getId(), pointsToAward,
                "Burger Stack Mini Game Bonus" + (orderId != null ? " (Order #" + orderId + ")" : ""));

        // Mark as claimed
        claimedSessions.add(sessionKey);

        log.info("Awarded {} game bonus points to user {} for order {}", pointsToAward, user.getEmail(), orderId);

        return ResponseEntity.ok(ApiResponse.success(
                Map.of("pointsAwarded", pointsToAward,
                       "message", "🎉 " + pointsToAward + " bonus loyalty points added to your account!")));
    }
}
