package com.bkb.service;

import com.bkb.entity.Order;
import com.bkb.entity.Payment;
import com.bkb.entity.enums.PaymentMethodEnum;
import com.bkb.entity.enums.PaymentStatusEnum;
import com.bkb.entity.enums.PaymentStatus;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.OrderRepository;
import com.bkb.repository.PaymentRepository;
import com.bkb.util.OrderRef;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    /**
     * TODO: ToyyibPay integration — to be implemented in Phase 2.
     * This stub creates a Payment record with PENDING status.
     */
    @Transactional
    public Payment initiateCashPayment(Order order) {
        Payment payment = Payment.builder()
                .order(order)
                .method(PaymentMethodEnum.CASH)
                .amount(order.getTotal())
                .status(PaymentStatusEnum.PENDING)
                .build();
        return paymentRepository.save(payment);
    }

    /**
     * Staff confirms cash received at counter.
     */
    @Transactional
    public Payment confirmCashPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethodEnum.CASH)
                        .amount(order.getTotal())
                        .build());

        payment.setStatus(PaymentStatusEnum.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        order.setPaymentStatus(PaymentStatus.PAID);

        orderRepository.save(order);
        return paymentRepository.save(payment);
    }

    /**
     * TODO: ToyyibPay webhook callback — to be implemented in Phase 2.
     * Will validate HMAC signature, update payment + order status.
     */
    /**
     * Confirms online payment for an order (simulated gateway callback).
     */
    @Transactional
    public Payment confirmOnlinePayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethodEnum.FPX)
                        .amount(order.getTotal())
                        .build());

        payment.setStatus(PaymentStatusEnum.SUCCESS);
        payment.setMethod(PaymentMethodEnum.FPX);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionRef("TXN-" + System.currentTimeMillis());
        order.setPaymentStatus(PaymentStatus.PAID);

        orderRepository.save(order);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment confirmOnlinePaymentByRef(String ref) {
        Order order = OrderRef.resolve(ref, orderRepository);

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethodEnum.CASH)
                        .amount(order.getTotal())
                        .build());

        payment.setStatus(PaymentStatusEnum.SUCCESS);
        payment.setMethod(PaymentMethodEnum.FPX);
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionRef("TXN-" + System.currentTimeMillis());
        order.setPaymentStatus(PaymentStatus.PAID);

        orderRepository.save(order);
        return paymentRepository.save(payment);
    }

    @Transactional
    public Payment failOnlinePaymentByRef(String ref) {
        Order order = OrderRef.resolve(ref, orderRepository);

        Payment payment = paymentRepository.findByOrderId(order.getId())
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .method(PaymentMethodEnum.CASH)
                        .amount(order.getTotal())
                        .build());

        payment.setStatus(PaymentStatusEnum.FAILED);
        payment.setMethod(PaymentMethodEnum.FPX);
        order.setPaymentStatus(PaymentStatus.FAILED);

        orderRepository.save(order);
        return paymentRepository.save(payment);
    }

    public Map<String, Object> getPaymentStatusByRef(String ref) {
        Order order = OrderRef.resolve(ref, orderRepository);

        Map<String, Object> status = new HashMap<>();
        status.put("orderId", order.getId());
        status.put("orderNumber", order.getOrderNumber());
        status.put("paymentStatus", order.getPaymentStatus().name());
        status.put("orderStatus", order.getStatus().name());
        status.put("paymentChannel", order.getPaymentChannel());

        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            status.put("transactionRef", payment.getTransactionRef());
            status.put("paidAt", payment.getPaidAt());
        });

        return status;
    }

    public void handleToyyibPayCallback(Object callbackPayload) {
        // TODO: implement ToyyibPay webhook handling
        log.warn("ToyyibPay callback received but handler not yet implemented.");
    }
}
