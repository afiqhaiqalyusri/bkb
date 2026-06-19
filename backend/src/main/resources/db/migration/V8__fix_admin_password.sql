-- ============================================================
--  BKB — V8: Fix Admin Account Password Hash
-- ============================================================

UPDATE users
SET password_hash = '$2a$12$Yv.rGj1kPS0cbjooq1/E8.89h/ImE69jJ6EhdHEUb27UON3poYqXO'
WHERE email = 'admin@bkb.com';
