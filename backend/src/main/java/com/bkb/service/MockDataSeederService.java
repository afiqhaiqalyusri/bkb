package com.bkb.service;

import com.bkb.entity.MenuItem;
import com.bkb.entity.Order;
import com.bkb.entity.OrderItem;
import com.bkb.entity.User;
import com.bkb.entity.enums.OrderStatus;
import com.bkb.entity.enums.PaymentStatus;
import com.bkb.entity.enums.UserRole;
import com.bkb.repository.MenuItemRepository;
import com.bkb.repository.OrderItemRepository;
import com.bkb.repository.OrderRepository;
import com.bkb.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class MockDataSeederService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String[] MALAYSIAN_NAMES = {
            "Ahmad Faris", "Nurul Huda", "Siti Aishah", "Ali Hassan", "Chong Wei",
            "Kavitha Raman", "Wei Jian", "Mohd Syazwan", "Fatimah Zahra", "Lim Ah Beng",
            "Afiq Haiqal", "Nurul Izzah", "Amirul Amin", "Tan Mei Ling", "Prakash",
            "Siti Nuralya", "Zarith Sofia", "Hafizudin", "Syed Saddiq", "Lee Zii Jia",
            "Muhammad Danial", "Puteri Sarah", "Azman Hashim", "Ong Kim Swee", "Goh Liu Ying",
            "Muthu Kumar", "Saraswathy", "Khairul Aming", "Nabil Ahmad", "Janna Nick",
            "Aiman Tino", "Wany Hasrita", "Siti Nurhaliza", "Ziana Zain", "Awang",
            "Dayang Nurfaizah", "Farah Ann", "Pandelela", "Nicol David", "Azizulhasni",
            "Aishah Sinclair", "Loke Siew Fook", "Syamsul Yusof", "Maya Karin", "Nora Danish",
            "Faizal Tahir", "Yuna", "Zee Avi", "Joe Flizzow", "Altimet"
    };

    private static final String[] VARIATIONS = {
            "+ Extra Cheese", "- No Onions", "+ Extra Patty", "- No Pickles",
            "+ Extra Spicy Sauce", "- No Sauce", "+ Add Egg", "+ Extra Mayo",
            "- No Lettuce", "+ Upgrade Fries"
    };

    @Transactional
    public void seedMockData() {
        log.info("Starting mock data seeding...");

        // 1. Create 50 Users
        List<User> users = new ArrayList<>();
        String defaultPassword = passwordEncoder.encode("Password123!");
        
        for (int i = 0; i < 50; i++) {
            String name = MALAYSIAN_NAMES[i % MALAYSIAN_NAMES.length];
            // Format email (e.g., ahmad.faris.1@example.com)
            String email = name.toLowerCase().replace(" ", ".") + "." + (i + 1) + "@example.com";
            
            // Check if user exists
            User existing = userRepository.findByEmail(email).orElse(null);
            if (existing == null) {
                User user = User.builder()
                        .name(name)
                        .email(email)
                        .phone("01" + (ThreadLocalRandom.current().nextInt(10000000, 99999999)))
                        .passwordHash(defaultPassword)
                        .role(UserRole.CUSTOMER)
                        .isActive(true)
                        .emailVerified(true) // Bypass OTP
                        .failedAttempts(0)
                        .accountLocked(false)
                        .build();
                users.add(userRepository.save(user));
            } else {
                users.add(existing);
            }
        }
        log.info("Generated/Loaded {} mock users.", users.size());

        // 2. Fetch Menu Items
        List<MenuItem> menuItems = menuItemRepository.findAll();
        if (menuItems.isEmpty()) {
            log.error("No menu items found! Cannot generate orders.");
            return;
        }

        // 3. Generate Orders
        int totalOrdersToGenerate = 60; // 60 orders * ~RM 15 = ~RM 900
        int ordersCreated = 0;
        Random random = new Random();

        for (int i = 0; i < totalOrdersToGenerate; i++) {
            // Randomly pick a date in the last 7 days
            int daysAgo = random.nextInt(7); // 0 to 6 days ago
            
            // Randomly pick a time between 18:00 (6 PM) and 23:59 (11:59 PM)
            int hour = 18 + random.nextInt(6); // 18, 19, 20, 21, 22, 23
            int minute = random.nextInt(60);
            
            LocalDateTime createdAt = LocalDateTime.now().minusDays(daysAgo)
                    .withHour(hour)
                    .withMinute(minute)
                    .withSecond(random.nextInt(60));

            // Determine if Guest or Registered User (50/50 chance)
            boolean isGuest = random.nextBoolean();
            User orderUser = null;
            String guestName = null;

            if (isGuest) {
                guestName = MALAYSIAN_NAMES[random.nextInt(MALAYSIAN_NAMES.length)] + " (Guest)";
            } else {
                orderUser = users.get(random.nextInt(users.size()));
            }

            // Create Order
            Order order = Order.builder()
                    .user(orderUser)
                    .guestName(guestName)
                    .status(OrderStatus.COMPLETED)
                    .paymentStatus(PaymentStatus.PAID)
                    .orderNumber("ORD-MOCK-" + System.currentTimeMillis() + "-" + i)
                    .total(BigDecimal.ZERO)
                    .totalCost(BigDecimal.ZERO)
                    .rating(random.nextDouble() > 0.3 ? (3 + random.nextInt(3)) : null) // 70% chance to leave a rating (3-5)
                    .feedback(random.nextDouble() > 0.8 ? "Great food!" : null)
                    .build();
                    
            // We have to set createdAt, but it's annotated with @CreationTimestamp which overwrites it.
            // We'll set it here and then overwrite it after save if needed using native query, or just use reflection/field access if JPA allows it.
            // Actually, @CreationTimestamp will ignore our setter on persist. 
            // We must save it first, then update it.

            order = orderRepository.save(order);

            // Generate Order Items
            int numItems = 1 + random.nextInt(3); // 1 to 3 items
            BigDecimal orderTotal = BigDecimal.ZERO;
            BigDecimal orderTotalCost = BigDecimal.ZERO;

            for (int j = 0; j < numItems; j++) {
                MenuItem item = menuItems.get(random.nextInt(menuItems.size()));
                int quantity = 1 + random.nextInt(2); // 1 or 2 quantity

                // Base price and cost
                BigDecimal unitPrice = item.getPrice();
                BigDecimal unitCost = unitPrice.multiply(BigDecimal.valueOf(0.40)); // Fake cost = 40% of price

                // Apply variations (30% chance)
                String notes = "";
                if (random.nextDouble() > 0.7) {
                    String variation = VARIATIONS[random.nextInt(VARIATIONS.length)];
                    notes = variation;
                    if (variation.startsWith("+")) {
                        // Add some cost/price for add-ons
                        unitPrice = unitPrice.add(BigDecimal.valueOf(1.50));
                        unitCost = unitCost.add(BigDecimal.valueOf(0.50));
                    }
                }

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .menuItem(item)
                        .quantity(quantity)
                        .unitPrice(unitPrice)
                        .unitCost(unitCost)
                        .customisations(notes.isEmpty() ? "[]" : "[{\"name\":\"" + notes + "\"}]")
                        .build();

                orderItemRepository.save(orderItem);

                orderTotal = orderTotal.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
                orderTotalCost = orderTotalCost.add(unitCost.multiply(BigDecimal.valueOf(quantity)));
            }

            // Update order totals
            order.setTotal(orderTotal);
            order.setTotalCost(orderTotalCost);
            order.setEstimatedProfit(orderTotal.subtract(orderTotalCost));
            orderRepository.save(order);

            // Force update created_at timestamp natively since @CreationTimestamp blocks normal updates
            orderRepository.updateOrderTimestamp(order.getId(), createdAt);
            
            ordersCreated++;
        }

        log.info("Successfully generated {} mock orders.", ordersCreated);
    }
}
