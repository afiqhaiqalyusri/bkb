package com.bkb.event;

import com.bkb.entity.Order;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.entity.enums.UserRole;
import com.bkb.service.LoyaltyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderLoyaltyListener {

    private final LoyaltyService loyaltyService;

    @EventListener
    public void handleOrderStatusChangedEvent(OrderStatusChangedEvent event) {
        Order order = event.getOrder();
        if (event.getNewStatus() == OrderStatus.COMPLETED) {
            if (order.getUser() != null && order.getUser().getRole() == UserRole.CUSTOMER) {
                try {
                    log.info("Awarding loyalty points for completed order {}", order.getOrderNumber());
                    loyaltyService.awardPoints(order.getUser(), order);
                } catch (Exception e) {
                    log.error("Failed to award loyalty points for order {}: {}", order.getOrderNumber(), e.getMessage());
                }
            }
        }
    }
}
