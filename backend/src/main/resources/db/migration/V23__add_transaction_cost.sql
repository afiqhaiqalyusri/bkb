-- Add transaction_cost to inventory_transactions
ALTER TABLE inventory_transactions ADD COLUMN transaction_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- Backfill existing transaction_cost based on current inventory unit_cost
UPDATE inventory_transactions it
SET transaction_cost = it.quantity * COALESCE((SELECT i.unit_cost FROM inventory i WHERE i.id = it.inventory_id), 0.00)
WHERE it.transaction_cost = 0.00;
