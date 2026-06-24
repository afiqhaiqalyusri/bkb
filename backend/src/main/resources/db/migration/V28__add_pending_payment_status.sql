-- Add PENDING_PAYMENT to order_status enum.
-- This value is used by the Java OrderStatus enum when an ONLINE payment order
-- is placed, but was never added to the PostgreSQL type -- causing a 500 on /api/orders.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
