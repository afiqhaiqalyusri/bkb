package com.bkb.repository;

import com.bkb.entity.IngredientOutage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IngredientOutageRepository extends JpaRepository<IngredientOutage, String> {
}
