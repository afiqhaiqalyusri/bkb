-- ============================================================
--  BKB — V15: Security Fields — Account Lockout & Email Verification
-- ============================================================

-- Account lockout fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts    INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_time          TIMESTAMP WITHOUT TIME ZONE;

-- Email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code     VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expiry   TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_attempts INT NOT NULL DEFAULT 0;

-- Existing users (admin, staff, etc.) are pre-verified — don't lock them out
UPDATE users SET email_verified = TRUE WHERE role IN ('ADMIN', 'MANAGER', 'STAFF');
