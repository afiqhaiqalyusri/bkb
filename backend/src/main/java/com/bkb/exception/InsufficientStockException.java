package com.bkb.exception;

public class InsufficientStockException extends BkbException {
    public InsufficientStockException(String itemName) {
        super("Insufficient stock for: " + itemName);
    }

    public InsufficientStockException(String itemName, double required, double available) {
        super(String.format("Insufficient stock for '%s'. Required: %.2f, Available: %.2f",
                itemName, required, available));
    }
}
