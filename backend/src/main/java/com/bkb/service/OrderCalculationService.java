package com.bkb.service;

import com.bkb.entity.OrderItem;
import com.bkb.entity.Promotion;
import com.bkb.entity.enums.DiscountType;
import com.bkb.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderCalculationService {

    private final PromotionRepository promotionRepository;

    @Value("${bkb.tax.rate:0.06}")
    private BigDecimal taxRate;

    public CalculationResult calculateTotals(List<OrderItem> orderItems, String promoCode) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalCost = BigDecimal.ZERO;

        for (OrderItem oi : orderItems) {
            subtotal = subtotal.add(oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())));

            BigDecimal itemCost = BigDecimal.ZERO;
            if (oi.getMenuItem().getInventoryLinks() != null) {
                for (com.bkb.entity.MenuItemInventory link : oi.getMenuItem().getInventoryLinks()) {
                    if (link.getInventory() != null && link.getInventory().getUnitCost() != null && link.getQuantityUsed() != null) {
                        itemCost = itemCost.add(link.getInventory().getUnitCost().multiply(link.getQuantityUsed()));
                    }
                }
            }
            oi.setUnitCost(itemCost);
            totalCost = totalCost.add(itemCost.multiply(BigDecimal.valueOf(oi.getQuantity())));
        }

        subtotal = applyPromotion(subtotal, orderItems, promoCode);

        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);
        BigDecimal estimatedProfit = subtotal.subtract(totalCost);

        return new CalculationResult(subtotal, tax, total, totalCost, estimatedProfit);
    }

    private BigDecimal applyPromotion(BigDecimal subtotal, List<OrderItem> orderItems, String promoCode) {
        if (promoCode == null || promoCode.isBlank()) return subtotal;

        Promotion promo = promotionRepository.findByPromoCode(promoCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid promo code: " + promoCode));

        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new IllegalArgumentException("Promo code is no longer active");
        }
        if (promo.getStartDate() != null && promo.getStartDate().isAfter(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Promo code is not yet valid");
        }
        if (promo.getEndDate() != null && promo.getEndDate().isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Promo code has expired");
        }

        BigDecimal discountAmount = BigDecimal.ZERO;

        if (promo.getApplicableItems() == null || promo.getApplicableItems().isEmpty()) {
            if (promo.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = subtotal.multiply(promo.getDiscountValue().divide(new BigDecimal("100")));
            } else if (promo.getDiscountType() == DiscountType.FIXED) {
                discountAmount = promo.getDiscountValue();
            }
        } else {
            BigDecimal applicableSubtotal = BigDecimal.ZERO;
            for (OrderItem oi : orderItems) {
                boolean isApplicable = promo.getApplicableItems().stream()
                        .anyMatch(mi -> mi.getId().equals(oi.getMenuItem().getId()));
                if (isApplicable) {
                    applicableSubtotal = applicableSubtotal.add(oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())));
                }
            }

            if (promo.getDiscountType() == DiscountType.PERCENT) {
                discountAmount = applicableSubtotal.multiply(promo.getDiscountValue().divide(new BigDecimal("100")));
            } else if (promo.getDiscountType() == DiscountType.FIXED) {
                discountAmount = promo.getDiscountValue().min(applicableSubtotal);
            }
        }

        discountAmount = discountAmount.min(subtotal);
        subtotal = subtotal.subtract(discountAmount);

        promo.setUsageCount(promo.getUsageCount() + 1);
        promotionRepository.save(promo);

        return subtotal;
    }

    public record CalculationResult(BigDecimal subtotal, BigDecimal tax, BigDecimal total, BigDecimal totalCost, BigDecimal estimatedProfit) {}
}
