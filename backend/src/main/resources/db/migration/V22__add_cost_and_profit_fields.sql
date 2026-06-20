-- Add cost and supplier to inventory
ALTER TABLE inventory ADD COLUMN unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE inventory ADD COLUMN supplier VARCHAR(100);

-- Add cost and profit tracking to orders
ALTER TABLE orders ADD COLUMN total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN estimated_profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Add cost to order items
ALTER TABLE order_items ADD COLUMN unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Backfill estimated_profit for historical orders (assume total is all profit since we don't have historical unit_cost)
UPDATE orders SET estimated_profit = total WHERE estimated_profit = 0.00;
