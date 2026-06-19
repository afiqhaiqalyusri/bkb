package com.bkb.entity;

import com.bkb.entity.enums.IngredientLevel;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_item_ingredients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItemIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(name = "ingredient_name", nullable = false, length = 100)
    private String ingredientName;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_level", columnDefinition = "ingredient_level")
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.NAMED_ENUM)
    private IngredientLevel defaultLevel = IngredientLevel.MEDIUM;
}
