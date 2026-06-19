-- ALTER TYPE order_status to support new statuses
ALTER TYPE order_status ADD VALUE 'ON_HOLD';
ALTER TYPE order_status ADD VALUE 'INCOMING_ORDER';

-- Add new fields to orders table
ALTER TABLE orders ADD COLUMN scheduled_time TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE orders ADD COLUMN queue_entered_at TIMESTAMP WITHOUT TIME ZONE;
