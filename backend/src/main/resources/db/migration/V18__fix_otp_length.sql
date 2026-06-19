-- Increase column length to store SHA-256 hashed OTPs (64 chars) instead of plain 6 chars.
ALTER TABLE users ALTER COLUMN verification_code TYPE VARCHAR(64);
