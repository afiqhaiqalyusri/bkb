package com.bkb.exception;

public class BkbException extends RuntimeException {
    public BkbException(String message) {
        super(message);
    }

    public BkbException(String message, Throwable cause) {
        super(message, cause);
    }
}
