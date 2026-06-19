-- Add payment_token and payment_channel columns to orders table for dynamic e-wallet payment support
ALTER TABLE orders ADD COLUMN payment_token VARCHAR(100);
ALTER TABLE orders ADD COLUMN payment_channel VARCHAR(50);
