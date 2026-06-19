-- ============================================================
--  BKB — V6: Add Admin Role
-- ============================================================

-- Add ADMIN to the user_role ENUM type
ALTER TYPE user_role ADD VALUE 'ADMIN';
