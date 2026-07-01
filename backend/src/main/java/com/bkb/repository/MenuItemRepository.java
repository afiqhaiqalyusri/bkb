package com.bkb.repository;

import com.bkb.entity.MenuItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    @EntityGraph(attributePaths = {"recipe", "recipe.ingredients", "recipe.ingredients.inventory"})
    List<MenuItem> findByDeletedFalse();

    @EntityGraph(attributePaths = {"recipe", "recipe.ingredients", "recipe.ingredients.inventory"})
    java.util.Optional<MenuItem> findById(Long id);

    List<MenuItem> findByCategoryAndDeletedFalse(String category);

    @Query("SELECT DISTINCT m.category FROM MenuItem m WHERE m.deleted = false ORDER BY m.category")
    List<String> findDistinctCategories();


}
