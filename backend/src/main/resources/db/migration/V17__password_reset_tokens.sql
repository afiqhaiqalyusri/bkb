-- ============================================================
--  BKB — V17: Password Reset Tokens
-- ============================================================

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 of the raw token
    expires_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_used     BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address  VARCHAR(45),                   -- for rate limiting by IP
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prt_user_id    ON password_reset_tokens(user_id);
CREATE INDEX idx_prt_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_prt_created_at ON password_reset_tokens(created_at);
CREATE INDEX idx_prt_ip_address ON password_reset_tokens(ip_address);
