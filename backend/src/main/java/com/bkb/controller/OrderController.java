package com.bkb.controller;

import com.bkb.dto.request.PlaceOrderRequest;
import com.bkb.dto.request.UpdateOrderStatusRequest;
import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.OrderResponse;
import com.bkb.entity.User;
import com.bkb.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.bkb.service.SecurityLogService securityLogService;
    private final com.bkb.repository.StoreSettingRepository storeSettingRepository;

    @GetMapping("/store-status")
    public ResponseEntity<ApiResponse<Boolean>> getStoreStatus() {
        boolean isOpen = storeSettingRepository.findById("STORE_OPEN")
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(true);
        return ResponseEntity.ok(ApiResponse.success(isOpen));
    }

    @PostMapping("/store-status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> updateStoreStatus(
            @RequestBody java.util.Map<String, Object> body,
            @AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest request) {
        
        boolean oldStatus = storeSettingRepository.findById("STORE_OPEN")
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(true);

        boolean newStatus = oldStatus;
        if (body.containsKey("open")) {
            newStatus = (Boolean) body.get("open");
            com.bkb.entity.StoreSetting setting = storeSettingRepository.findById("STORE_OPEN")
                    .orElse(new com.bkb.entity.StoreSetting("STORE_OPEN", "true", "Global store open/close status"));
            setting.setSettingValue(String.valueOf(newStatus));
            storeSettingRepository.save(setting);
        }
        securityLogService.log(user, "Store Operations Toggle",
                String.format("Toggled store operations from %s to %s.", oldStatus ? "OPEN" : "CLOSED", newStatus ? "OPEN" : "CLOSED"),
                String.valueOf(oldStatus), String.valueOf(newStatus), request);
        return ResponseEntity.ok(ApiResponse.success("Store status updated successfully", newStatus));
    }

    @PostMapping({"", "/create"})
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            @AuthenticationPrincipal User user) {
        boolean isStoreOpen = storeSettingRepository.findById("STORE_OPEN")
                .map(setting -> Boolean.parseBoolean(setting.getSettingValue()))
                .orElse(true);
        if (!isStoreOpen) {
            throw new com.bkb.exception.BkbException("Store is closed. We are not accepting new orders at this time.");
        }
        OrderResponse response = orderService.placeOrder(request, user);
        return ResponseEntity.status(201).body(ApiResponse.success("Order placed successfully", response));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrdersForUser(user)));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(id)));
    }

    @GetMapping("/ref/{ref}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByRef(
            @PathVariable String ref,
            @RequestParam(required = false) String token) {
        OrderResponse order = orderService.getOrderByRef(ref);
        if (order.getPaymentMethod().equals("ONLINE")) {
            if (token == null || token.isEmpty() || !token.equals(order.getPaymentToken())) {
                throw new com.bkb.exception.BkbException("Access Denied: Invalid or missing secure payment token");
            }
        }
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @GetMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(required = false) String status) {
        List<OrderResponse> orders = status != null
                ? orderService.getOrdersByStatus(status)
                : orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        String newStatus = request.getStatus();
        OrderResponse oldOrder = orderService.getOrderById(id);
        String oldStatus = oldOrder.getStatus();
        
        OrderResponse updated = orderService.updateOrderStatus(id, newStatus, user);
        
        if ("COMPLETED".equalsIgnoreCase(newStatus)) {
            securityLogService.log(user, "Manual Order Completion",
                    String.format("Manually completed order %s (ID: %d).", updated.getOrderNumber(), id),
                    oldStatus, newStatus, servletRequest);
        }
        
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/{id}/details")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderDetails(
            @PathVariable Long id,
            @RequestBody com.bkb.dto.request.UpdateOrderDetailsRequest request) {
        return ResponseEntity.ok(ApiResponse.success(orderService.updateOrderDetails(id, request)));
    }

    @DeleteMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        OrderResponse oldOrder = orderService.getOrderById(id);
        String oldStatus = oldOrder.getStatus();
        
        OrderResponse response = orderService.cancelOrder(id, user);
        
        securityLogService.log(user, "Order Cancellation",
                String.format("Cancelled order %s (ID: %d).", response.getOrderNumber(), id),
                oldStatus, "CANCELLED", servletRequest);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/on-hold")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOnHoldOrders() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOnHoldOrders()));
    }

    @GetMapping("/on-hold/count")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getOnHoldCount() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOnHoldCount()));
    }

    @DeleteMapping("/on-hold/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOnHoldOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            jakarta.servlet.http.HttpServletRequest servletRequest) {
        OrderResponse oldOrder = orderService.getOrderById(id);
        String oldStatus = oldOrder.getStatus();

        OrderResponse response = orderService.cancelOnHoldOrder(id);

        securityLogService.log(user, "On-Hold Order Cancellation",
                String.format("Manager/Admin cancelled scheduled order %s (ID: %d).", response.getOrderNumber(), id),
                oldStatus, "CANCELLED", servletRequest);
        return ResponseEntity.ok(ApiResponse.success("Scheduled order cancelled successfully", response));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<OrderResponse>> submitFeedback(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> body) {
        Integer rating = body.get("rating") != null ? Integer.valueOf(body.get("rating").toString()) : null;
        String feedback = body.get("feedback") != null ? body.get("feedback").toString() : null;
        return ResponseEntity.ok(ApiResponse.success(orderService.submitFeedback(id, user, rating, feedback)));
    }
}
