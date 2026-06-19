-- ============================================================
--  BKB — V3: Fix seeded staff account password hashes
--  BCrypt strength 12
--  manager@bkb.com → BKBManager2024!
--  staff@bkb.com   → BKBStaff2024!
-- ============================================================

UPDATE users
SET password_hash = '$2a$12$WzOvkjz2Bb2bM9CY23975epyEBHIbpJy8tmCR0MvVfxhbPdXFXFRu'
WHERE email = 'manager@bkb.com';

UPDATE users
SET password_hash = '$2a$12$32jcM/iLQDADgTVanAM0/ud74czi/jHsVtEV4aDdzFCqPipozcG0a'
WHERE email = 'staff@bkb.com';
