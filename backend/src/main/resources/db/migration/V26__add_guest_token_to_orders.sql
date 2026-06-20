-- Add guest_token to orders table to prevent IDOR vulnerability
ALTER TABLE orders ADD COLUMN guest_token VARCHAR(255);
CREATE INDEX idx_orders_guest_token ON orders(guest_token);
