package com.bkb.service;

import com.bkb.entity.Order;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ReceiptService {

    /**
     * Stub for generating a receipt for a paid order.
     * To be implemented in the future.
     */
    public void generateReceipt(Order order) {
        log.info("Generating receipt for order: {}", order.getOrderNumber());
        // TODO: Implement PDF generation or other receipt generation logic
    }
}
