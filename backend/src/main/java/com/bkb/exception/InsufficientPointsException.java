package com.bkb.exception;

public class InsufficientPointsException extends BkbException {
    public InsufficientPointsException(int required, int available) {
        super(String.format("Insufficient loyalty points. Required: %d, Available: %d",
                required, available));
    }
}
