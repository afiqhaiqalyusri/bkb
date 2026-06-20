package com.bkb.event;

import com.bkb.entity.Order;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationListener {

    private final EmailService emailService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderPlacedEvent(OrderPlacedEvent event) {
        Order order = event.getOrder();
        log.info("Sending order confirmation email for order {}", order.getOrderNumber());
        try {
            if (order.getUser() != null && order.getUser().getEmail() != null) {
                if (order.getStatus() == OrderStatus.ON_HOLD) {
                    emailService.sendOrderScheduledEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getOrderNumber(),
                            order.getScheduledTime(),
                            order.getTotal()
                    );
                } else if (order.getStatus() == OrderStatus.INCOMING_ORDER) {
                    emailService.sendOrderEnteredQueueEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getOrderNumber()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to send order confirmation for order {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderPaidEvent(OrderPaidEvent event) {
        Order order = event.getOrder();
        log.info("Sending payment receipt email for order {}", order.getOrderNumber());
        try {
            if (order.getUser() != null && order.getUser().getEmail() != null) {
                emailService.sendPaymentSuccessEmail(
                        order.getUser().getEmail(),
                        order.getUser().getName(),
                        order.getOrderNumber(),
                        order.getTotal()
                );
            }
        } catch (Exception e) {
            log.error("Failed to send payment receipt for order {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderStatusChangedEvent(OrderStatusChangedEvent event) {
        Order order = event.getOrder();
        log.info("Sending status update email for order {} to status {}", order.getOrderNumber(), event.getNewStatus());
        try {
            if (order.getUser() != null && order.getUser().getEmail() != null) {
                if (event.getNewStatus() == OrderStatus.READY) {
                    emailService.sendOrderReadyEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getOrderNumber()
                    );
                } else if (event.getNewStatus() == OrderStatus.COMPLETED) {
                    emailService.sendOrderCompletedEmail(
                            order.getUser().getEmail(),
                            order.getUser().getName(),
                            order.getOrderNumber()
                    );
                }
            }
        } catch (Exception e) {
            log.error("Failed to send status update for order {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }
}
