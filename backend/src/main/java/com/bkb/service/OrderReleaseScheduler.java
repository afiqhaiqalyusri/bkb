package com.bkb.service;

import com.bkb.entity.Order;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderReleaseScheduler {

    private final OrderRepository orderRepository;
    private final EmailService emailService;

    /**
     * Run every 15 minutes (900000ms) to check for ON_HOLD orders
     * whose scheduled pickup time is within 15 minutes of current time.
     */
    @Scheduled(fixedRate = 900000)
    @Transactional
    public void releaseScheduledOrders() {
        log.info("Running scheduled check to release on-hold orders...");
        LocalDateTime now = LocalDateTime.now();
        List<Order> onHoldOrders = orderRepository.findByStatusOrderByCreatedAtAsc(OrderStatus.ON_HOLD);

        for (Order order : onHoldOrders) {
            if (order.getScheduledTime() != null) {
                // If scheduledTime is before (now + 15 minutes), release it
                if (order.getScheduledTime().isBefore(now.plusMinutes(15))) {
                    log.info("Promoting order {} from ON_HOLD to INCOMING_ORDER (Scheduled: {})", 
                            order.getOrderNumber(), order.getScheduledTime());
                    order.setStatus(OrderStatus.INCOMING_ORDER);
                    order.setQueueEnteredAt(now);
                    orderRepository.save(order);

                    // Send email notification about entering the kitchen queue
                    if (order.getUser() != null && order.getUser().getEmail() != null) {
                        try {
                            emailService.sendOrderEnteredQueueEmail(
                                    order.getUser().getEmail(),
                                    order.getUser().getName(),
                                    order.getOrderNumber()
                            );
                        } catch (Exception e) {
                            log.error("Failed to send queue email for order {}: {}", order.getOrderNumber(), e.getMessage());
                        }
                    }
                }
            }
        }
    }
}
