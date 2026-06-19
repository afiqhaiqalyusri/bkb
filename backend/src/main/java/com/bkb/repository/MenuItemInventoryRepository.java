package com.bkb.repository;

import com.bkb.entity.MenuItemInventory;
import com.bkb.entity.MenuItemInventoryId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemInventoryRepository extends JpaRepository<MenuItemInventory, MenuItemInventoryId> {
    @Query("SELECT mii FROM MenuItemInventory mii JOIN FETCH mii.inventory WHERE mii.menuItem.id = :menuItemId")
    List<MenuItemInventory> findByMenuItemIdWithInventory(@Param("menuItemId") Long menuItemId);
}
