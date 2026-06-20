-- V25__add_store_settings_and_staff_tracking.sql
CREATE TABLE store_settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value VARCHAR(255),
    description VARCHAR(255)
);

ALTER TABLE orders
ADD COLUMN completed_by_id BIGINT,
ADD COLUMN completed_by_name VARCHAR(255),
ADD COLUMN completed_at TIMESTAMP;

-- Insert default store settings
INSERT INTO store_settings (setting_key, setting_value, description) VALUES
('STORE_OPEN', 'true', 'Global store open/close status'),
('PAYMENT_CASH_ENABLED', 'true', 'Enable/disable Cash payment method'),
('PAYMENT_TOYYIBPAY_ENABLED', 'true', 'Enable/disable ToyyibPay payment method');
