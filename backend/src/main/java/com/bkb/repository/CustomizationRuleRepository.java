package com.bkb.repository;

import com.bkb.entity.CustomizationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomizationRuleRepository extends JpaRepository<CustomizationRule, Long> {

    Optional<CustomizationRule> findByIngredientNameAndLevel(String ingredientName, String level);

    List<CustomizationRule> findByIngredientName(String ingredientName);

}
