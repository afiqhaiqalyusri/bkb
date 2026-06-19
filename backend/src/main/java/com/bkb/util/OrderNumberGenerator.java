package com.bkb.util;

import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
public class OrderNumberGenerator {

    /**
     * Generates a unique order number like ORD547831
     * Format: ORD + 6 random digits
     */
    public String generate() {
        int number = ThreadLocalRandom.current().nextInt(100000, 999999);
        return "ORD" + number;
    }
}
