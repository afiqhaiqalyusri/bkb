package com.bkb.event;

import com.bkb.entity.Inventory;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class InventoryDepletedEvent extends ApplicationEvent {
    
    private final Inventory inventory;

    public InventoryDepletedEvent(Object source, Inventory inventory) {
        super(source);
        this.inventory = inventory;
    }
}
