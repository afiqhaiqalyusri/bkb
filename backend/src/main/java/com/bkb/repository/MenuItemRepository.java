package com.bkb.repository;

import com.bkb.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByDeletedFalse();

    @Query("SELECT DISTINCT m.category FROM MenuItem m WHERE m.deleted = false ORDER BY m.category")
    List<String> findDistinctCategories();

    @Query("SELECT m FROM MenuItem m LEFT JOIN FETCH m.ingredients WHERE m.id = :id")
    java.util.Optional<MenuItem> findByIdWithIngredients(Long id);
}
