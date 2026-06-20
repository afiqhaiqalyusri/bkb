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
    private final SecurityLogService securityLogService;
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

        log.info("ToyyibPay createBill: secretKey length={}, categoryCode={}, amount={}",
                properties.getSecretKey() != null ? properties.getSecretKey().length() : 0,
                properties.getCategoryCode(), amountInCents);

        try {
            // Try to parse as List (normal success response)
            ResponseEntity<String> rawResponse = restTemplate.postForEntity(url, request, String.class);
            String rawBody = rawResponse.getBody();
            log.info("ToyyibPay raw response: {}", rawBody);

            if (rawBody == null || rawBody.isBlank()) {
                throw new RuntimeException("ToyyibPay returned empty response");
            }

            // If ToyyibPay returns an error string (not JSON array), throw with the message
            if (!rawBody.trim().startsWith("[")) {
                log.error("ToyyibPay error response: {}", rawBody);
                throw new RuntimeException("ToyyibPay error: " + rawBody.trim());
            }

            // Parse as JSON array
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<java.util.Map<String, Object>> list =
                    mapper.readValue(rawBody, mapper.getTypeFactory().constructCollectionType(java.util.List.class, java.util.Map.class));

            if (list.isEmpty()) {
                throw new RuntimeException("ToyyibPay returned empty list");
            }

            Map<String, Object> responseData = list.get(0);
            String billCode = (String) responseData.get("BillCode");

            if (billCode == null || billCode.isBlank()) {
                log.error("ToyyibPay response missing BillCode: {}", responseData);
                throw new RuntimeException("ToyyibPay did not return a bill code. Response: " + responseData);
            }

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
            log.info("ToyyibPay bill created successfully. billCode={}, paymentUrl={}", billCode, paymentUrl);
            return Map.of(
                    "paymentUrl", paymentUrl,
                    "billCode", billCode
            );
        } catch (Exception e) {
            log.error("Error calling ToyyibPay API: {}", e.getMessage(), e);
            throw new RuntimeException("Payment gateway error: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void verifyPayment(Map<String, String> payload) {
        String billCode = payload.get("billcode");
        String status = payload.get("status_id"); // 1 = Success, 2 = Pending, 3 = Fail
        String statusId = payload.get("status_id"); // 1 = Success, 2 = Pending, 3 = Fail
        String transactionId = payload.get("transaction_id");
        String amountStr = payload.get("amount");
        String msg = payload.get("msg");

        log.info("Received ToyyibPay callback: {}", payload);

        // 1. Verify Bill Code Exists
        Payment payment = paymentRepository.findByBillCode(billCode).orElse(null);

        if (payment == null) {
            log.error("SECURITY ALERT: Callback received for unknown billCode: {}", billCode);
            securityLogService.log(null, "PAYMENT_SPOOFING", "Unknown billCode: " + billCode, null, null, "ToyyibPay Callback");
            return;
        }

        Order order = payment.getOrder();
        if (order == null) {
            log.error("SECURITY ALERT: Payment {} has no associated order", billCode);
            return;
        }

        if (payment.getStatus() == PaymentStatusEnum.PAID || payment.getStatus() == PaymentStatusEnum.SUCCESS) {
            log.info("Duplicate callback ignored for billCode: {}", billCode);
            return;
        }

        payment.setTransactionId(transactionId);
        payment.setGatewayResponse(payload.toString());

        // 3. Verify Payment Status with ToyyibPay
        if (!verifyWithToyyibPay(billCode, amountStr)) {
            log.error("SECURITY ALERT: ToyyibPay verification failed for order {}. Possible spoofing attempt.", order.getOrderNumber());
            securityLogService.log(order.getUser(), "PAYMENT_SPOOFING", "Verification failed for amount: " + amountStr + " and msg: " + msg, null, null, "ToyyibPay Callback");
            return;
        }

        if ("1".equals(statusId)) {
            payment.setStatus(PaymentStatusEnum.PAID);
            payment.setPaidAt(LocalDateTime.now());
            paymentRepository.save(payment);
            
            orderService.handlePaymentSuccess(order.getId());
            securityLogService.log(order.getUser(), "PAYMENT_SUCCESS", "ToyyibPay payment success for RM " + order.getTotal(), null, null, "ToyyibPay Callback");
        } else if ("2".equals(statusId) || "3".equals(statusId)) {
            payment.setStatus(PaymentStatusEnum.FAILED);
            paymentRepository.save(payment);
            
            // Delegate failure flow logic
            orderService.handlePaymentFailure(order.getId());
        }
    }

    private boolean verifyWithToyyibPay(String billCode, String expectedAmount) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("billCode", billCode);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            String url = properties.getBaseUrl() + "/index.php/api/getBillTransactions";

            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            String rawBody = response.getBody();

            if (rawBody == null || !rawBody.trim().startsWith("[")) {
                return false;
            }

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.List<java.util.Map<String, Object>> list =
                    mapper.readValue(rawBody, mapper.getTypeFactory().constructCollectionType(java.util.List.class, java.util.Map.class));

            for (Map<String, Object> tx : list) {
                String txStatus = String.valueOf(tx.get("billpaymentStatus"));
                String txAmount = String.valueOf(tx.get("billpaymentAmount"));
                if ("1".equals(txStatus) && (expectedAmount == null || expectedAmount.equals(txAmount))) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Error verifying payment with ToyyibPay: {}", e.getMessage(), e);
            return false;
        }
    }
}
