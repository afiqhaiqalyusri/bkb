package com.bkb.service;

import com.bkb.config.ToyyibPayProperties;
import com.bkb.entity.Order;
import com.bkb.entity.Payment;
import com.bkb.entity.User;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.entity.enums.PaymentMethodEnum;
import com.bkb.entity.enums.PaymentStatusEnum;
import com.bkb.entity.enums.PaymentStatus;
import com.bkb.exception.InvalidOrderStateException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.OrderRepository;
import com.bkb.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ToyyibPayService {

    private final ToyyibPayProperties properties;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Transactional
    public Map<String, String> createBill(Long orderId) {
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            throw new InvalidOrderStateException("Order is already paid.");
        }

        // Calculate amount in cents
        int amountInCents = order.getTotal().multiply(new BigDecimal(100)).intValue();
        
        String customerName = order.getGuestName() != null ? order.getGuestName() : (order.getUser() != null ? order.getUser().getName() : "Customer");
        String customerEmail = order.getUser() != null && order.getUser().getEmail() != null ? order.getUser().getEmail() : "no-reply@domain.com";
        String customerPhone = order.getGuestPhone() != null ? order.getGuestPhone() : (order.getUser() != null ? order.getUser().getPhone() : "0123456789");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("userSecretKey", properties.getSecretKey());
        body.add("categoryCode", properties.getCategoryCode());
        body.add("billName", "BKB Order #" + order.getOrderNumber());
        body.add("billDescription", "Payment for BKB Order #" + order.getOrderNumber());
        body.add("billPriceSetting", "1");
        body.add("billPayorInfo", "1");
        body.add("billAmount", String.valueOf(amountInCents));
        body.add("billReturnUrl", properties.getReturnUrl() + "?order_id=" + order.getOrderNumber());
        body.add("billCallbackUrl", properties.getCallbackUrl());
        body.add("billExternalReferenceNo", order.getOrderNumber());
        body.add("billTo", customerName);
        body.add("billEmail", customerEmail);
        body.add("billPhone", customerPhone);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
        String url = properties.getBaseUrl() + "/index.php/api/createBill";

        try {
            ResponseEntity<List> response = restTemplate.postForEntity(url, request, List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null && !response.getBody().isEmpty()) {
                Map<String, Object> responseData = (Map<String, Object>) response.getBody().get(0);
                String billCode = (String) responseData.get("BillCode");

                // Save Payment Record
                Payment payment = Payment.builder()
                        .order(order)
                        .method(PaymentMethodEnum.ONLINE)
                        .amount(order.getTotal())
                        .status(PaymentStatusEnum.PENDING)
                        .billCode(billCode)
                        .build();
                paymentRepository.save(payment);

                String paymentUrl = properties.getBaseUrl() + "/" + billCode;
                return Map.of(
                        "paymentUrl", paymentUrl,
                        "billCode", billCode
                );
            } else {
                log.error("Failed to create ToyyibPay bill: {}", response.getBody());
                throw new RuntimeException("Failed to create payment gateway bill");
            }
        } catch (Exception e) {
            log.error("Error calling ToyyibPay API: {}", e.getMessage());
            throw new RuntimeException("Payment gateway integration error", e);
        }
    }

    @Transactional
    public void verifyPayment(Map<String, String> payload) {
        String billCode = payload.get("billcode");
        String status = payload.get("status_id"); // 1 = Success, 2 = Pending, 3 = Fail
        String transactionId = payload.get("transaction_id");
        String externalRef = payload.get("order_id"); // In callback it's usually order_id
        String amountStr = payload.get("amount");

        log.info("Received ToyyibPay callback: {}", payload);

        if (billCode == null) return;

        Payment payment = paymentRepository.findByBillCode(billCode)
                .orElse(null);

        if (payment == null) {
            log.error("Payment not found for billCode: {}", billCode);
            return;
        }

        if (payment.getStatus() == PaymentStatusEnum.PAID || payment.getStatus() == PaymentStatusEnum.SUCCESS) {
            log.info("Duplicate callback ignored for billCode: {}", billCode);
            return;
        }

        payment.setTransactionId(transactionId);
        payment.setGatewayResponse(payload.toString());

        Order order = payment.getOrder();

        if ("1".equals(status)) {
            payment.setStatus(PaymentStatusEnum.PAID);
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);
            
            // Delegate successful flow logic
            orderService.handlePaymentSuccess(order.getId());
        } else if ("3".equals(status)) {
            payment.setStatus(PaymentStatusEnum.FAILED);
            paymentRepository.save(payment);
            
            // Delegate failure flow logic
            orderService.handlePaymentFailure(order.getId());
        }
    }
}
