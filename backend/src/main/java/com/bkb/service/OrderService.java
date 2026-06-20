package com.bkb.service;

import com.bkb.dto.request.PlaceOrderRequest;
import com.bkb.dto.response.OrderResponse;
import com.bkb.entity.*;
import com.bkb.entity.enums.*;
import com.bkb.exception.InvalidOrderStateException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.OrderRepository;
import com.bkb.util.OrderNumberGenerator;
import com.bkb.util.OrderRef;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private static final String PAYMENT_TOKEN_PREFIX = "token_";

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final InventoryService inventoryService;
    private final LoyaltyService loyaltyService;
    private final OrderNumberGenerator orderNumberGenerator;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final ReceiptService receiptService;

    @Value("${bkb.tax.rate:0.06}")
    private BigDecimal taxRate;

    // ─── Place Order ─────────────────────────────────────────────

    /**
     * Main order placement logic:
     * 1. Validate items and stock
     * 2. Persist Order + OrderItems
     * 3. Deduct inventory per item
     * 4. Award loyalty points (CUSTOMER only)
     * 5. For CASH orders → immediately ACCEPTED
     * 6. For ONLINE orders → stub (payment to be added later)
     */
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request, User user) {
        // 1. Build OrderItems and validate
        List<OrderItem> orderItems = buildOrderItems(request.getItems());

        // 2. Calculate totals
        BigDecimal subtotal = orderItems.stream()
                .map(oi -> oi.getUnitPrice().multiply(BigDecimal.valueOf(oi.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal tax = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax);

        // 3. Determine payment method
        PaymentMethod paymentMethod;
        try {
            paymentMethod = PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase());
        } catch (Exception e) {
            paymentMethod = PaymentMethod.CASH;
        }

        // 4. Determine initial status — Scheduled vs Now
        OrderStatus initialStatus = OrderStatus.INCOMING_ORDER;
        java.time.LocalDateTime scheduledTime = null;
        java.time.LocalDateTime queueEnteredAt = null;

        if (request.getPickupTime() != null && request.getPickupTime().isAfter(java.time.LocalDateTime.now())) {
            initialStatus = OrderStatus.ON_HOLD;
            scheduledTime = request.getPickupTime();
        } else {
            queueEnteredAt = java.time.LocalDateTime.now();
        }

        PaymentStatus initialPaymentStatus = PaymentStatus.UNPAID;

        String paymentToken = null;
        if (paymentMethod == PaymentMethod.ONLINE) {
            paymentToken = PAYMENT_TOKEN_PREFIX + java.util.UUID.randomUUID().toString().replace("-", "");
            if (initialStatus == OrderStatus.INCOMING_ORDER) {
                initialStatus = OrderStatus.PENDING_PAYMENT;
            }
        }

        // 5. Build and persist Order
        Order order = Order.builder()
                .orderNumber(orderNumberGenerator.generate())
                .user(user != null && user.getRole() != UserRole.GUEST ? user : null)
                .guestName(request.getGuestName())
                .guestPhone(request.getGuestPhone())
                .status(initialStatus)
                .paymentMethod(paymentMethod)
                .paymentStatus(initialPaymentStatus)
                .paymentToken(paymentToken)
                .paymentChannel(request.getPaymentChannel())
                .subtotal(subtotal)
                .tax(tax)
                .total(total)
                .pickupTime(request.getPickupTime())
                .scheduledTime(scheduledTime)
                .queueEnteredAt(queueEnteredAt)
                .notes(request.getNotes())
                .items(new ArrayList<>())
                .build();

        // Link guest info from user if not explicitly provided
        if (user != null && user.getRole() == UserRole.GUEST) {
            if (order.getGuestName() == null) order.setGuestName(user.getName());
            if (order.getGuestPhone() == null) order.setGuestPhone(user.getPhone());
        }

        final Order savedOrder = orderRepository.save(order);

        // 6. Persist OrderItems and link to order
        orderItems.forEach(oi -> {
            oi.setOrder(savedOrder);
            savedOrder.getItems().add(oi);
        });
        orderRepository.save(savedOrder);

        // Immediate inventory deduction and loyalty award removed.
        // These are now deferred until the order is COMPLETED.

        log.info("Order placed: {} for {}", savedOrder.getOrderNumber(),
                user != null ? user.getEmail() : "guest");

        // Send Email Notification
        if (savedOrder.getUser() != null && savedOrder.getUser().getEmail() != null) {
            try {
                if (savedOrder.getStatus() == OrderStatus.ON_HOLD) {
                    emailService.sendOrderScheduledEmail(
                            savedOrder.getUser().getEmail(),
                            savedOrder.getUser().getName(),
                            savedOrder.getOrderNumber(),
                            savedOrder.getScheduledTime(),
                            savedOrder.getTotal()
                    );
                } else if (savedOrder.getStatus() == OrderStatus.INCOMING_ORDER) {
                    emailService.sendOrderEnteredQueueEmail(
                            savedOrder.getUser().getEmail(),
                            savedOrder.getUser().getName(),
                            savedOrder.getOrderNumber()
                    );
                }
            } catch (Exception e) {
                log.error("Failed to send placement email: {}", e.getMessage());
            }
        }

        return toResponse(savedOrder);
    }

    // ─── Order Queries ───────────────────────────────────────────

    public List<OrderResponse> getOrdersForUser(User user) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        return toResponse(order);
    }

    public OrderResponse getOrderByRef(String ref) {
        Order order = OrderRef.resolveWithItems(ref, orderRepository);
        return toResponse(order);
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<OrderResponse> getOrdersByStatus(String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            return orderRepository.findByStatusOrderByCreatedAtAsc(orderStatus)
                    .stream().map(this::toResponse).collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            return getAllOrders();
        }
    }

    // ─── Order Updates ───────────────────────────────────────────

    @Transactional
    public OrderResponse updateOrderStatus(Long id, String newStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOrderStateException("Invalid order status: " + newStatus);
        }

        order.setStatus(status);

        // When ACCEPTED and ONLINE payment → auto-mark PAID
        if (status == OrderStatus.ACCEPTED && order.getPaymentMethod() == PaymentMethod.ONLINE) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        // If marked COMPLETED and CASH payment → auto-mark as PAID
        if (status == OrderStatus.COMPLETED && order.getPaymentMethod() == PaymentMethod.CASH) {
            order.setPaymentStatus(PaymentStatus.PAID);
        }

        // Defer inventory and loyalty processing until the order is COMPLETED
        if (status == OrderStatus.COMPLETED) {
            for (OrderItem oi : order.getItems()) {
                inventoryService.deductByOrderItem(oi, order);
            }
            if (order.getUser() != null && order.getUser().getRole() == UserRole.CUSTOMER) {
                loyaltyService.awardPoints(order.getUser(), order);
            }
        }

        // Send Email Ready notification
        if (status == OrderStatus.READY && order.getUser() != null && order.getUser().getEmail() != null) {
            try {
                emailService.sendOrderReadyEmail(
                        order.getUser().getEmail(),
                        order.getUser().getName(),
                        order.getOrderNumber()
                );
            } catch (Exception e) {
                log.error("Failed to send ready email for order {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, User user) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        // Validate ownership (only for customers/guests)
        if (user != null && (user.getRole() == UserRole.CUSTOMER || user.getRole() == UserRole.GUEST)) {
            if (order.getStatus() != OrderStatus.ON_HOLD) {
                throw new InvalidOrderStateException("Only scheduled orders can be cancelled");
            }
            if (order.getScheduledTime() == null || order.getScheduledTime().isBefore(java.time.LocalDateTime.now().plusMinutes(30))) {
                throw new InvalidOrderStateException("Orders can only be cancelled more than 30 minutes before the scheduled time");
            }
            if (order.getUser() != null && !order.getUser().getId().equals(user.getId())) {
                throw new InvalidOrderStateException("You can only cancel your own orders");
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateOrderDetails(Long id, com.bkb.dto.request.UpdateOrderDetailsRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        if (request.getGuestName() != null) {
            order.setGuestName(request.getGuestName());
        }
        if (request.getGuestPhone() != null) {
            order.setGuestPhone(request.getGuestPhone());
        }
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        if (request.getPickupTime() != null) {
            try {
                String time = request.getPickupTime();
                if (time.length() == 5 && time.contains(":")) {
                    java.time.LocalDate today = java.time.LocalDate.now();
                    java.time.LocalTime localTime = java.time.LocalTime.parse(time);
                    order.setPickupTime(java.time.LocalDateTime.of(today, localTime));
                } else {
                    order.setPickupTime(java.time.LocalDateTime.parse(time));
                }
            } catch (Exception e) {
                log.error("Failed to parse pickup time: {}", request.getPickupTime());
            }
        }

        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse confirmCashPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        order.setPaymentStatus(PaymentStatus.PAID);
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public void unconfirmCashPayment(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getPaymentMethod() == PaymentMethod.CASH) {
            order.setPaymentStatus(PaymentStatus.UNPAID);
            orderRepository.save(order);
        }
    }

    // ─── Mapping ─────────────────────────────────────────────────

    private List<OrderItem> buildOrderItems(List<PlaceOrderRequest.OrderItemRequest> itemRequests) {
        List<OrderItem> items = new ArrayList<>();
        for (PlaceOrderRequest.OrderItemRequest req : itemRequests) {
            MenuItem menuItem = menuItemRepository.findById(req.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", req.getMenuItemId()));

            if (!Boolean.TRUE.equals(menuItem.getIsAvailable())) {
                throw new InvalidOrderStateException("Menu item not available: " + menuItem.getName());
            }

            // Use promo price if available, or 0 if free/redeemed item
            BigDecimal unitPrice = Boolean.TRUE.equals(req.getIsFree())
                    ? BigDecimal.ZERO
                    : (menuItem.getPromoPrice() != null ? menuItem.getPromoPrice() : menuItem.getPrice());

            String customisationsJson = "[]";
            if (req.getCustomisations() != null && !req.getCustomisations().isEmpty()) {
                try {
                    customisationsJson = objectMapper.writeValueAsString(req.getCustomisations());
                } catch (Exception e) {
                    log.error("Failed to serialise customisations to JSON: {}", req.getCustomisations(), e);
                }
            }

            items.add(OrderItem.builder()
                    .menuItem(menuItem)
                    .quantity(req.getQuantity())
                    .unitPrice(unitPrice)
                    .customisations(customisationsJson)
                    .build());
        }
        return items;
    }

    public OrderResponse toResponse(Order order) {
        String customerName = "Guest";
        if (order.getUser() != null) {
            customerName = order.getUser().getName();
        } else if (order.getGuestName() != null) {
            customerName = order.getGuestName();
        }

        List<OrderResponse.OrderItemResponse> itemResponses = order.getItems() == null
                ? List.of()
                : order.getItems().stream().map(oi -> OrderResponse.OrderItemResponse.builder()
                        .id(oi.getId())
                        .menuItemId(oi.getMenuItem() != null ? oi.getMenuItem().getId() : null)
                        .menuItemName(oi.getMenuItem() != null ? oi.getMenuItem().getName() : "Unknown")
                        .quantity(oi.getQuantity())
                        .unitPrice(oi.getUnitPrice())
                        .customisations(oi.getCustomisations())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus() != null ? order.getStatus().name() : null)
                .paymentMethod(order.getPaymentMethod() != null ? order.getPaymentMethod().name() : null)
                .paymentStatus(order.getPaymentStatus() != null ? order.getPaymentStatus().name() : null)
                .subtotal(order.getSubtotal())
                .tax(order.getTax())
                .total(order.getTotal())
                .pickupTime(order.getPickupTime())
                .scheduledTime(order.getScheduledTime())
                .queueEnteredAt(order.getQueueEnteredAt())
                .notes(order.getNotes())
                .guestPhone(order.getGuestPhone())
                .createdAt(order.getCreatedAt())
                .customerName(customerName)
                .customerId(order.getUser() != null ? order.getUser().getId() : null)
                .paymentToken(order.getPaymentToken())
                .paymentChannel(order.getPaymentChannel())
                .items(itemResponses)
                .build();
    }

    public List<OrderResponse> getIncomingKitchenQueue() {
        return orderRepository.findByStatusOrderByQueueEnteredAtAsc(OrderStatus.INCOMING_ORDER)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<OrderResponse> getOnHoldOrders() {
        return orderRepository.findByStatusOrderByScheduledTimeAsc(OrderStatus.ON_HOLD)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public long getOnHoldCount() {
        return orderRepository.countByStatus(OrderStatus.ON_HOLD);
    }

    @Transactional
    public OrderResponse cancelOnHoldOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        if (order.getStatus() != OrderStatus.ON_HOLD) {
            throw new InvalidOrderStateException("Only ON_HOLD orders can be cancelled through this endpoint");
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toResponse(orderRepository.save(order));
    }

    // ─── Payment Callbacks ───────────────────────────────────────

    @Transactional
    public void handlePaymentSuccess(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        order.setPaymentStatus(PaymentStatus.PAID);
        order.setStatus(OrderStatus.ACCEPTED);
        orderRepository.save(order);

        // Notify customer and generate receipt
        if (order.getUser() != null && order.getUser().getEmail() != null) {
            emailService.sendPaymentSuccessEmail(
                    order.getUser().getEmail(),
                    order.getUser().getName(),
                    order.getOrderNumber(),
                    order.getTotal()
            );
        }
        receiptService.generateReceipt(order);
    }

    @Transactional
    public void handlePaymentFailure(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        order.setPaymentStatus(PaymentStatus.UNPAID); // Or FAILED based on PaymentStatusEnum
        order.setStatus(OrderStatus.PENDING_PAYMENT); // Ensure PENDING_PAYMENT exists in OrderStatus
        orderRepository.save(order);
    }
}
