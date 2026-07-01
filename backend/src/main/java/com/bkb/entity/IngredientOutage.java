package com.bkb.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ingredient_outages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IngredientOutage {

    @Id
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "out_of_stock", nullable = false)
    @Builder.Default
    private Boolean outOfStock = false;
}
