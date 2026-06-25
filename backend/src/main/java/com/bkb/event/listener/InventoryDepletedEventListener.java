package com.bkb.event.listener;

import com.bkb.entity.MenuItem;
import com.bkb.entity.RecipeIngredient;
import com.bkb.event.InventoryDepletedEvent;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.RecipeIngredientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class InventoryDepletedEventListener {

    private final RecipeIngredientRepository recipeIngredientRepository;
    private final MenuItemRepository menuItemRepository;

    @EventListener
    @Transactional
    public void handleInventoryDepleted(InventoryDepletedEvent event) {
        log.warn("Inventory Depleted Event received for {}", event.getInventory().getItemName());

        List<RecipeIngredient> usages = recipeIngredientRepository.findByInventoryId(event.getInventory().getId());
        
        for (RecipeIngredient usage : usages) {
            MenuItem menuItem = usage.getRecipe().getMenuItem();
            if (menuItem.getIsAvailable()) {
                menuItem.setIsAvailable(false);
                menuItemRepository.save(menuItem);
                log.info("Auto-disabled MenuItem '{}' due to out-of-stock ingredient '{}'", 
                        menuItem.getName(), event.getInventory().getItemName());
            }
        }
    }
}
