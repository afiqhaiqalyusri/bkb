-- ============================================================
--  BKB — V9: Reactivate Manager Account
-- ============================================================

UPDATE users
SET is_active = true
WHERE email = 'manager@bkb.com';
