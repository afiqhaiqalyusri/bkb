package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.service.PaymentService;
import com.bkb.service.OrderService;
import com.bkb.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final com.bkb.service.SecurityLogService securityLogService;
    private final com.bkb.service.ToyyibPayService toyyibPayService;

    @PostMapping(value = "/callback", consumes = org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<String> handleCallback(@RequestParam java.util.Map<String, String> payload) {
        toyyibPayService.verifyPayment(payload);
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/verify-redirect")
    public ResponseEntity<ApiResponse<Void>> verifyRedirect(@RequestBody java.util.Map<String, String> payload) {
        toyyibPayService.verifyPayment(payload);
        return ResponseEntity.ok(ApiResponse.success("Payment verified from redirect", null));
    }

    @PostMapping("/toyyibpay/{orderId}")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> createToyyibPayBill(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.success("Bill created", toyyibPayService.createBill(orderId)));
    }

    @PatchMapping("/{orderId}/cash-confirm")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> confirmCashPayment(
            @PathVariable Long orderId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest request) {
        paymentService.confirmCashPayment(orderId);
        orderService.confirmCashPayment(orderId);
        securityLogService.log(user, "Payment Status Override",
                String.format("Overrode cash payment status to PAID for order ID %d.", orderId),
                "UNPAID", "PAID", request);
        return ResponseEntity.ok(ApiResponse.success("Cash payment confirmed", null));
    }

    @PatchMapping("/{orderId}/cash-unconfirm")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unconfirmCashPayment(
            @PathVariable Long orderId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest request) {
        orderService.unconfirmCashPayment(orderId);
        securityLogService.log(user, "Payment Status Override",
                String.format("Overrode cash payment status to UNPAID for order ID %d.", orderId),
                "PAID", "UNPAID", request);
        return ResponseEntity.ok(ApiResponse.success("Cash payment reset to unpaid", null));
    }

    @PatchMapping("/{orderId}/online-confirm")
    public ResponseEntity<ApiResponse<Void>> confirmOnlinePayment(@PathVariable Long orderId) {
        paymentService.confirmOnlinePayment(orderId);
        return ResponseEntity.ok(ApiResponse.success("Online payment confirmed", null));
    }

    @PostMapping("/{orderId}/online-confirm")
    public ResponseEntity<ApiResponse<Void>> confirmOnlinePaymentPost(@PathVariable String orderId) {
        paymentService.confirmOnlinePaymentByRef(orderId);
        return ResponseEntity.ok(ApiResponse.success("Online payment confirmed", null));
    }

    @PostMapping("/{orderId}/simulate-success")
    public ResponseEntity<ApiResponse<Void>> simulateSuccess(@PathVariable String orderId) {
        paymentService.confirmOnlinePaymentByRef(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment simulated successfully", null));
    }

    @PostMapping("/{orderId}/simulate-failure")
    public ResponseEntity<ApiResponse<Void>> simulateFailure(@PathVariable String orderId) {
        paymentService.failOnlinePaymentByRef(orderId);
        return ResponseEntity.ok(ApiResponse.success("Payment simulation failure recorded", null));
    }

    @GetMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getPaymentStatus(@PathVariable String orderId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPaymentStatusByRef(orderId)));
    }
}
