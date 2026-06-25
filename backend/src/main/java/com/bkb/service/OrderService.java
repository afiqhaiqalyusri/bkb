package com.bkb.service;

import com.bkb.dto.request.PlaceOrderRequest;
import com.bkb.dto.response.OrderResponse;
import com.bkb.entity.*;
import com.bkb.entity.enums.*;
import com.bkb.event.OrderPaidEvent;
import com.bkb.exception.InvalidOrderStateException;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.OrderRepository;
import com.bkb.repository.PromotionRepository;
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
@org.springframework.transaction.annotation.Transactional(readOnly = true)
@Slf4j
public class OrderService {

    private static final String PAYMENT_TOKEN_PREFIX = "token_";

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final InventoryService inventoryService;
    private final OrderNumberGenerator orderNumberGenerator;
    private final ObjectMapper objectMapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final ReceiptService receiptService;
    private final PromotionRepository promotionRepository;
    private final OrderCalculationService orderCalculationService;

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

        // 2. Calculate totals and cost
        OrderCalculationService.CalculationResult calcResult = orderCalculationService.calculateTotals(orderItems, request.getPromoCode());
        BigDecimal subtotal = calcResult.subtotal();
        BigDecimal tax = calcResult.tax();
        BigDecimal total = calcResult.total();
        BigDecimal totalCost = calcResult.totalCost();
        BigDecimal estimatedProfit = calcResult.estimatedProfit();

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

        boolean isScheduled = request.getPickupTime() != null && request.getPickupTime().isAfter(java.time.LocalDateTime.now().plusMinutes(30));

        if (isScheduled) {
            initialStatus = OrderStatus.ON_HOLD;
            scheduledTime = request.getPickupTime();
        } else {
            queueEnteredAt = java.time.LocalDateTime.now();
        }

        PaymentStatus initialPaymentStatus = PaymentStatus.UNPAID;

        String paymentToken = null;
        if (paymentMethod == PaymentMethod.ONLINE) {
            paymentToken = PAYMENT_TOKEN_PREFIX + java.util.UUID.randomUUID().toString().replace("-", "");
            // All online orders start as PENDING_PAYMENT until paid
            initialStatus = OrderStatus.PENDING_PAYMENT;
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
                .totalCost(totalCost)
                .estimatedProfit(estimatedProfit)
                .pickupTime(request.getPickupTime())
                .scheduledTime(scheduledTime)
                .queueEnteredAt(queueEnteredAt)
                .notes(request.getNotes())
                .guestToken(java.util.UUID.randomUUID().toString())
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

        // Send Event
        eventPublisher.publishEvent(new com.bkb.event.OrderPlacedEvent(this, savedOrder));

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

    public Order getOrderByGuestToken(String guestToken) {
        return orderRepository.findByGuestToken(guestToken)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with tracking token"));
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
    public OrderResponse updateOrderStatus(Long id, String newStatus, User user) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new InvalidOrderStateException("Invalid order status: " + newStatus);
        }

        // --- ORDER STATE MACHINE VALIDATION ---
        OrderStatus currentStatus = order.getStatus();
        if (currentStatus != status && currentStatus != OrderStatus.CANCELLED) {
            boolean validTransition = false;
            switch (currentStatus) {
                case INCOMING_ORDER:
                    if (status == OrderStatus.ACCEPTED || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case PENDING_PAYMENT:
                    if (status == OrderStatus.ACCEPTED || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case ON_HOLD:
                    if (status == OrderStatus.INCOMING_ORDER || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case ACCEPTED:
                    if (status == OrderStatus.GRILLING || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case GRILLING:
                    if (status == OrderStatus.ASSEMBLING || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case ASSEMBLING:
                    if (status == OrderStatus.READY || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case READY:
                    if (status == OrderStatus.COMPLETED || status == OrderStatus.CANCELLED) validTransition = true;
                    break;
                case COMPLETED:
                case CANCELLED:
                    validTransition = false; // Terminal states
                    break;
            }
            if (!validTransition && user != null && user.getRole() != UserRole.ADMIN) {
                throw new InvalidOrderStateException("Cannot transition order from " + currentStatus + " to " + status);
            }
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

        // Track who completed the order
        if (status == OrderStatus.COMPLETED) {
            if (user != null) {
                order.setCompletedById(user.getId());
                order.setCompletedByName(user.getName());
            }
            order.setCompletedAt(java.time.LocalDateTime.now());
        }

        evaluateInventoryDeduction(order);

        // Publish Status Changed Event
        eventPublisher.publishEvent(new com.bkb.event.OrderStatusChangedEvent(this, order, currentStatus, status));

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

    @Transactional
    public OrderResponse submitFeedback(Long id, User user, Integer rating, String feedback) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        // Validate user
        if (user != null && (user.getRole() == UserRole.CUSTOMER || user.getRole() == UserRole.GUEST)) {
            if (order.getUser() != null && !order.getUser().getId().equals(user.getId())) {
                throw new InvalidOrderStateException("You can only rate your own orders");
            }
        }

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new InvalidOrderStateException("You can only rate completed orders");
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }

        order.setRating(rating);
        order.setFeedback(feedback);

        return toResponse(orderRepository.save(order));
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
                .guestToken(order.getGuestToken())
                .rating(order.getRating())
                .feedback(order.getFeedback())
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
        
        if (order.getStatus() == OrderStatus.PENDING_PAYMENT || order.getStatus() == OrderStatus.PENDING) {
            boolean isScheduled = order.getPickupTime() != null && order.getPickupTime().isAfter(java.time.LocalDateTime.now().plusMinutes(30));
            if (isScheduled) {
                order.setStatus(OrderStatus.ON_HOLD);
            } else {
                order.setStatus(OrderStatus.INCOMING_ORDER);
            }
        }
        
        orderRepository.save(order);

        // Notify customer and generate receipt via Events
        eventPublisher.publishEvent(new com.bkb.event.OrderPaidEvent(this, order));
        receiptService.generateReceipt(order);
    }

    @Transactional
    public void handlePaymentFailure(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        orderRepository.save(order);
    }

    @Transactional
    public void evaluateInventoryDeduction(Order order) {
        if (order.isInventoryDeducted()) {
            return;
        }

        boolean isPaid = order.getPaymentStatus() == PaymentStatus.PAID;
        boolean isAcceptedOrBeyond = order.getStatus() != OrderStatus.PENDING 
                && order.getStatus() != OrderStatus.CANCELLED 
                && order.getStatus() != OrderStatus.ON_HOLD;

        if (isPaid && isAcceptedOrBeyond) {
            for (OrderItem oi : order.getItems()) {
                inventoryService.deductByOrderItem(oi, order);
            }
            order.setInventoryDeducted(true);
            orderRepository.save(order);
            log.info("Inventory successfully deducted for Order {}", order.getOrderNumber());
        }
    }
}
