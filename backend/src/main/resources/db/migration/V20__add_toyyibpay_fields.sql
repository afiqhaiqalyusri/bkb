ALTER TYPE payment_method_enum ADD VALUE 'ONLINE';
ALTER TYPE payment_status_enum ADD VALUE 'PAID';
ALTER TYPE payment_status_enum ADD VALUE 'CANCELLED';

ALTER TABLE payments
ADD COLUMN bill_code VARCHAR(100),
ADD COLUMN transaction_id VARCHAR(100),
ADD COLUMN gateway_response TEXT;
