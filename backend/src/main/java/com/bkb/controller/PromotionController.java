package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.entity.Promotion;
import com.bkb.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionRepository promotionRepository;

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<Object>> validatePromo(@RequestParam String code) {
        Promotion promo = promotionRepository.findByPromoCode(code).orElse(null);
        if (promo == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid promo code"));
        }
        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Promo code is no longer active"));
        }
        if (promo.getStartDate() != null && promo.getStartDate().isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Promo code is not yet valid"));
        }
        if (promo.getEndDate() != null && promo.getEndDate().isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Promo code has expired"));
        }

        return ResponseEntity.ok(ApiResponse.success("Promo code valid", new ValidatePromoResponse(
                promo.getPromoCode(),
                promo.getDiscountType().name(),
                promo.getDiscountValue(),
                promo.getApplicableItems().stream().map(mi -> mi.getId()).collect(Collectors.toList())
        )));
    }

    public record ValidatePromoResponse(String code, String type, BigDecimal value, java.util.List<Long> applicableItemIds) {}
}
