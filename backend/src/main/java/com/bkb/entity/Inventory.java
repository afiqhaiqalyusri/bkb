package com.bkb.entity;

import com.bkb.entity.enums.InventoryStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;


    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(length = 100)
    private String supplier;

    @Column(length = 20)
    private String unit;

    @Column(length = 80)
    private String category;

    @Column(name = "current_stock", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentStock;

    @Column(name = "min_stock", nullable = false, precision = 10, scale = 2)
    private BigDecimal minStock;

    @Column(name = "max_stock", nullable = false, precision = 10, scale = 2)
    private BigDecimal maxStock;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "inventory_status")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private InventoryStatus status = InventoryStatus.GOOD;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "inventory", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<InventoryTransaction> transactions = new ArrayList<>();
}
