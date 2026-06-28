package com.bkb.controller;

import com.bkb.dto.response.ApiResponse;
import com.bkb.dto.response.OrderResponse;
import com.bkb.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/kitchen")
@RequiredArgsConstructor
public class KitchenController {

    private final OrderService orderService;

    @GetMapping("/incoming")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getIncomingKitchenQueue() {
        return ResponseEntity.ok(ApiResponse.success(orderService.getIncomingKitchenQueue()));
    }
}
