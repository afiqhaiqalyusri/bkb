-- 1. Create tracking type enum and add to inventory
CREATE TYPE inventory_tracking_type AS ENUM ('AUTO', 'MANUAL');
ALTER TABLE inventory ADD COLUMN tracking_type inventory_tracking_type DEFAULT 'AUTO';

-- 2. Add inventory_deducted to orders
ALTER TABLE orders ADD COLUMN inventory_deducted BOOLEAN NOT NULL DEFAULT FALSE;

-- For existing completed/paid orders, we can assume they were already deducted.
UPDATE orders SET inventory_deducted = TRUE WHERE status = 'COMPLETED' OR payment_status = 'PAID';

-- 3. Create recipes table
CREATE TABLE recipes (
    id BIGSERIAL PRIMARY KEY,
    menu_item_id BIGINT NOT NULL UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
    notes TEXT,
    updated_at TIMESTAMP
);

-- 4. Create recipe_ingredients table
CREATE TABLE recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity NUMERIC(10, 2) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE
);

-- 5. Create customization_rules table
CREATE TABLE customization_rules (
    id BIGSERIAL PRIMARY KEY,
    ingredient_name VARCHAR(100) NOT NULL,
    customization_level VARCHAR(50) NOT NULL,
    inventory_id BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    adjustment_quantity NUMERIC(10, 2) NOT NULL
);

-- 6. Migrate Data: Create a recipe for every menu item that has inventory linked
INSERT INTO recipes (menu_item_id, updated_at)
SELECT DISTINCT menu_item_id, NOW() FROM menu_item_inventory;

-- Migrate Data: Insert recipe ingredients
INSERT INTO recipe_ingredients (recipe_id, inventory_id, quantity, is_optional)
SELECT r.id, mii.inventory_id, mii.quantity_used, FALSE
FROM menu_item_inventory mii
JOIN recipes r ON r.menu_item_id = mii.menu_item_id;

-- 7. Drop legacy tables
DROP TABLE menu_item_inventory;
DROP TABLE menu_item_ingredients;
