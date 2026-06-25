package com.bkb.entity;

import com.bkb.entity.enums.OrderStatus;
import com.bkb.entity.enums.PaymentMethod;
import com.bkb.entity.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_number", unique = true, nullable = false, length = 20)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "guest_name", length = 100)
    private String guestName;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "guest_token", length = 255)
    private String guestToken;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "order_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private OrderStatus status = OrderStatus.PENDING;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", columnDefinition = "payment_method_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", columnDefinition = "payment_status_type")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal tax = BigDecimal.ZERO;

    @Builder.Default
    @Column(precision = 10, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_cost", precision = 10, scale = 2)
    private BigDecimal totalCost = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "estimated_profit", precision = 10, scale = 2)
    private BigDecimal estimatedProfit = BigDecimal.ZERO;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @Column(name = "scheduled_time")
    private LocalDateTime scheduledTime;

    @Column(name = "queue_entered_at")
    private LocalDateTime queueEnteredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "completed_by_id")
    private Long completedById;

    @Column(name = "completed_by_name")
    private String completedByName;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(name = "inventory_deducted", nullable = false)
    private boolean inventoryDeducted = false;

    @Column(name = "payment_token", length = 100)
    private String paymentToken;

    @Column(name = "payment_channel", length = 50)
    private String paymentChannel;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
