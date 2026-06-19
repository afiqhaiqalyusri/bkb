-- ============================================================
--  BKB — V7: Seed Admin Account
-- ============================================================

-- Seed the System Admin account (password is BKBAdmin2024!)
INSERT INTO users (name, email, phone, password_hash, role) VALUES
(
    'System Admin',
    'admin@bkb.com',
    '0111111111',
    '$2a$12$e68Y2kYtG8pA8lG6p6/TeeBw5X9nC4q9lF8uEwW/fG3HjF6K6e2pC',
    'ADMIN'
);
