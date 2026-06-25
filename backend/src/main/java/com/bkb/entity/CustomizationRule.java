package com.bkb.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "customization_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomizationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Matches the "ingredient" field sent from the frontend Customisation JSON
    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    // Matches the "level" field sent from the frontend Customisation JSON
    @Column(name = "customization_level", nullable = false, length = 50)
    private String level;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

    // The quantity to add (or subtract if negative) to the required base amount
    @Column(name = "adjustment_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal adjustmentQuantity;
}
