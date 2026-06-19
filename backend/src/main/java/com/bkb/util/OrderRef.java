package com.bkb.util;

import com.bkb.entity.Order;
import com.bkb.exception.ResourceNotFoundException;
import com.bkb.repository.OrderRepository;

/**
 * Utility for resolving an Order from a flexible reference string, which may be either:
 * - A numeric string (treated as a database ID first, then falls back to order number)
 * - An alphanumeric order number (e.g. "ORD-20240614-001")
 *
 * This pattern appears in multiple payment-related services and is centralised here
 * to avoid DRY violations.
 */
public final class OrderRef {

    private OrderRef() {}

    /**
     * Resolves an Order from a reference string using standard {@link OrderRepository#findById}.
     * Suitable for payment operations that do not require eager-loaded items.
     *
     * @param ref the reference string — numeric ID or alphanumeric order number
     * @param orderRepository the repository to query
     * @return the matched Order
     * @throws ResourceNotFoundException if no order matches the reference
     */
    public static Order resolve(String ref, OrderRepository orderRepository) {
        if (ref.matches("\\d+")) {
            return orderRepository.findById(Long.parseLong(ref))
                    .orElseGet(() -> orderRepository.findByOrderNumber(ref)
                            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ref: " + ref)));
        }
        return orderRepository.findByOrderNumber(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ref: " + ref));
    }

    /**
     * Resolves an Order and eagerly loads its items using {@link OrderRepository#findByIdWithItems}.
     * Suitable for order query operations that require the items to be loaded.
     *
     * @param ref the reference string — numeric ID or alphanumeric order number
     * @param orderRepository the repository to query
     * @return the matched Order with items eagerly fetched
     * @throws ResourceNotFoundException if no order matches the reference
     */
    public static Order resolveWithItems(String ref, OrderRepository orderRepository) {
        if (ref.matches("\\d+")) {
            return orderRepository.findByIdWithItems(Long.parseLong(ref))
                    .orElseGet(() -> orderRepository.findByOrderNumber(ref)
                            .orElseThrow(() -> new ResourceNotFoundException("Order ref: " + ref)));
        }
        return orderRepository.findByOrderNumber(ref)
                .orElseThrow(() -> new ResourceNotFoundException("Order ref: " + ref));
    }
}
