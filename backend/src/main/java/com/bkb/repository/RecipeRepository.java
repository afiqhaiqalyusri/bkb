package com.bkb.repository;

import com.bkb.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    @Query("SELECT r FROM Recipe r LEFT JOIN FETCH r.ingredients ri LEFT JOIN FETCH ri.inventory WHERE r.menuItem.id = :menuItemId")
    Optional<Recipe> findByMenuItemIdWithIngredients(@Param("menuItemId") Long menuItemId);

}
