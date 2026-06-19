-- ============================================================
--  BKB — V2: Seed Data
--  Passwords are BCrypt-hashed (strength 12)
--  manager@bkb.com → BKBManager2024!
--  staff@bkb.com   → BKBStaff2024!
-- ============================================================

-- ─── Staff Accounts ──────────────────────────────────────────

INSERT INTO users (name, email, phone, password_hash, role) VALUES
(
    'BKB Manager',
    'manager@bkb.com',
    '0123456789',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYyBKUJkb6UBkS6',
    'MANAGER'
),
(
    'BKB Staff',
    'staff@bkb.com',
    '0129876543',
    '$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LnS37ozPCh6',
    'STAFF'
);

-- ─── Menu Items ──────────────────────────────────────────────

INSERT INTO menu_items (name, description, price, promo_price, category, is_available) VALUES
-- Burgers
('Burger Ramly Ayam Biasa',
 'Classic Ramly chicken burger with special BKB sauce, fresh lettuce and tomatoes.',
 4.90, NULL, 'Burger', TRUE),

('Burger Ramly Ayam Double',
 'Double chicken patty Ramly burger — double the flavour, double the satisfaction.',
 5.50, 4.90, 'Burger', TRUE),

('Burger Ramly Daging Biasa',
 'Classic Ramly beef burger with caramelised onions and black pepper sauce.',
 4.90, NULL, 'Burger', TRUE),

('Burger Ramly Daging Double',
 'Double beef patty Ramly burger loaded with BKB special sauce.',
 5.50, NULL, 'Burger', TRUE),

('Oblong Ayam Biasa',
 'Oblong chicken patty burger — a BKB signature shape with classic toppings.',
 5.50, NULL, 'Oblong', TRUE),

('Oblong Ayam Double',
 'Double oblong chicken patty burger — the ultimate BKB chicken experience.',
 6.50, NULL, 'Oblong', TRUE),

('Oblong Daging Biasa',
 'Oblong beef patty burger with BKB black pepper sauce and fresh vegetables.',
 5.50, NULL, 'Oblong', TRUE),

('Oblong Daging Double',
 'Double oblong beef patty — smoky, juicy, and full of BKB flavour.',
 6.50, NULL, 'Oblong', TRUE),

('Burger Kambing Special',
 'Rare lamb patty burger with mint sauce and caramelised onions — limited availability.',
 7.90, NULL, 'Special', TRUE),

-- Drinks
('Air Sejuk (Iced Water)',
 'Complimentary iced water.',
 1.00, NULL, 'Drinks', TRUE),

('Milo Ais',
 'Classic Malaysian iced Milo — cold, creamy, and energising.',
 3.50, NULL, 'Drinks', TRUE);

-- ─── Menu Item Ingredients ───────────────────────────────────

-- Burger Ramly Ayam Biasa (id=1)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(1, 'Chicken Patty', 'MEDIUM'),
(1, 'Mayonnaise', 'MEDIUM'),
(1, 'Black Pepper Sauce', 'MEDIUM'),
(1, 'Lettuce', 'MEDIUM'),
(1, 'Tomato', 'MEDIUM'),
(1, 'Egg', 'MEDIUM');

-- Burger Ramly Ayam Double (id=2)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(2, 'Chicken Patty', 'EXTRA'),
(2, 'Mayonnaise', 'MEDIUM'),
(2, 'Black Pepper Sauce', 'MEDIUM'),
(2, 'Lettuce', 'MEDIUM'),
(2, 'Tomato', 'MEDIUM'),
(2, 'Egg', 'MEDIUM');

-- Burger Ramly Daging Biasa (id=3)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(3, 'Beef Patty', 'MEDIUM'),
(3, 'Mayonnaise', 'MEDIUM'),
(3, 'Black Pepper Sauce', 'MEDIUM'),
(3, 'Caramelised Onion', 'MEDIUM'),
(3, 'Lettuce', 'MEDIUM'),
(3, 'Egg', 'MEDIUM');

-- Burger Ramly Daging Double (id=4)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(4, 'Beef Patty', 'EXTRA'),
(4, 'Mayonnaise', 'MEDIUM'),
(4, 'Black Pepper Sauce', 'MEDIUM'),
(4, 'Caramelised Onion', 'MEDIUM'),
(4, 'Lettuce', 'MEDIUM'),
(4, 'Egg', 'MEDIUM');

-- Oblong Ayam Biasa (id=5)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(5, 'Chicken Oblong Patty', 'MEDIUM'),
(5, 'Mayonnaise', 'MEDIUM'),
(5, 'Black Pepper Sauce', 'MEDIUM'),
(5, 'Lettuce', 'MEDIUM'),
(5, 'Egg', 'MEDIUM');

-- Oblong Ayam Double (id=6)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(6, 'Chicken Oblong Patty', 'EXTRA'),
(6, 'Mayonnaise', 'MEDIUM'),
(6, 'Black Pepper Sauce', 'MEDIUM'),
(6, 'Lettuce', 'MEDIUM'),
(6, 'Egg', 'MEDIUM');

-- Oblong Daging Biasa (id=7)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(7, 'Beef Oblong Patty', 'MEDIUM'),
(7, 'Mayonnaise', 'MEDIUM'),
(7, 'Black Pepper Sauce', 'MEDIUM'),
(7, 'Caramelised Onion', 'MEDIUM'),
(7, 'Egg', 'MEDIUM');

-- Oblong Daging Double (id=8)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(8, 'Beef Oblong Patty', 'EXTRA'),
(8, 'Mayonnaise', 'MEDIUM'),
(8, 'Black Pepper Sauce', 'MEDIUM'),
(8, 'Caramelised Onion', 'MEDIUM'),
(8, 'Egg', 'MEDIUM');

-- Burger Kambing Special (id=9)
INSERT INTO menu_item_ingredients (menu_item_id, ingredient_name, default_level) VALUES
(9, 'Lamb Patty', 'MEDIUM'),
(9, 'Mint Sauce', 'MEDIUM'),
(9, 'Caramelised Onion', 'MEDIUM'),
(9, 'Lettuce', 'MEDIUM'),
(9, 'Tomato', 'MEDIUM');

-- ─── Inventory ───────────────────────────────────────────────

INSERT INTO inventory (item_name, category, unit, current_stock, min_stock, max_stock) VALUES
('Chicken Patty',        'Meat',       'pcs',  150, 50,  300),
('Beef Patty',           'Meat',       'pcs',   70, 50,  300),
('Chicken Oblong Patty', 'Meat',       'pcs',  120, 50,  250),
('Beef Oblong Patty',    'Meat',       'pcs',   80, 50,  250),
('Lamb Patty',           'Meat',       'pcs',   30, 20,  100),
('Round Buns',           'Bread',      'pcs',  200, 60,  400),
('Long Buns',            'Bread',      'pcs',   45, 60,  200),
('Lettuce',              'Vegetables', 'kg',     8,  5,   50),
('Tomatoes',             'Vegetables', 'kg',    25, 10,   60),
('Eggs',                 'Dairy',      'pcs',  100, 30,  200),
('Mayonnaise',           'Condiments', 'kg',     5,  2,   20),
('Black Pepper Sauce',   'Condiments', 'kg',     4,  2,   20),
('Caramelised Onion',    'Condiments', 'kg',     3,  2,   15),
('Mint Sauce',           'Condiments', 'kg',     2,  1,   10),
('Cooking Oil',          'Cooking',    'L',     10,  5,   30),
('Milo Powder',          'Dry Goods',  'kg',     3,  2,   10);

-- ─── Menu Item Inventory (Recipe Links) ──────────────────────

-- Burger Ramly Ayam Biasa: 1 chicken patty, 1 round bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(1, 1, 1), -- chicken patty
(1, 6, 1); -- round bun

-- Burger Ramly Ayam Double: 2 chicken patties, 1 round bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(2, 1, 2),
(2, 6, 1);

-- Burger Ramly Daging Biasa: 1 beef patty, 1 round bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(3, 2, 1),
(3, 6, 1);

-- Burger Ramly Daging Double: 2 beef patties, 1 round bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(4, 2, 2),
(4, 6, 1);

-- Oblong Ayam Biasa: 1 chicken oblong, 1 long bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(5, 3, 1),
(5, 7, 1);

-- Oblong Ayam Double: 2 chicken oblong, 1 long bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(6, 3, 2),
(6, 7, 1);

-- Oblong Daging Biasa: 1 beef oblong, 1 long bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(7, 4, 1),
(7, 7, 1);

-- Oblong Daging Double: 2 beef oblong, 1 long bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(8, 4, 2),
(8, 7, 1);

-- Burger Kambing Special: 1 lamb patty, 1 round bun
INSERT INTO menu_item_inventory (menu_item_id, inventory_id, quantity_used) VALUES
(9, 5, 1),
(9, 6, 1);

-- ─── Promotions ──────────────────────────────────────────────

INSERT INTO promotions (title, description, discount_type, discount_value, is_active, start_date, end_date) VALUES
(
    'Combo Special — 2 Burger Ramly + 1 Drink RM12.90',
    'Dapatkan 2 Burger Ramly Ayam Biasa dan 1 Milo Ais pada harga istimewa RM12.90 sahaja!',
    'FIXED',
    0.90,
    TRUE,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days'
),
(
    'Double Patty Friday',
    'Every Friday — upgrade to Double Patty for only RM1 extra!',
    'FIXED',
    1.00,
    TRUE,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days'
);

-- ─── Loyalty Rewards ─────────────────────────────────────────

INSERT INTO loyalty_rewards (menu_item_id, name, points_cost, is_active) VALUES
(1, 'Burger Ramly Ayam Biasa (Free)',   40, TRUE),
(3, 'Burger Ramly Daging Biasa (Free)', 40, TRUE),
(5, 'Oblong Ayam Biasa (Free)',         50, TRUE),
(11,'Milo Ais (Free)',                  15, TRUE);

-- ─── Loyalty Accounts for seeded staff (optional) ────────────
-- Customers get their account created on first order

