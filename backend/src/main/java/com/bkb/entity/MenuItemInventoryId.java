package com.bkb.entity;

import java.io.Serializable;
import java.util.Objects;

public class MenuItemInventoryId implements Serializable {
    private Long menuItem;
    private Long inventory;

    public MenuItemInventoryId() {}

    public MenuItemInventoryId(Long menuItem, Long inventory) {
        this.menuItem = menuItem;
        this.inventory = inventory;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MenuItemInventoryId)) return false;
        MenuItemInventoryId that = (MenuItemInventoryId) o;
        return Objects.equals(menuItem, that.menuItem) && Objects.equals(inventory, that.inventory);
    }

    @Override
    public int hashCode() {
        return Objects.hash(menuItem, inventory);
    }
}
