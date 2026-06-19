-- ============================================================
--  BKB — V12: Session Token Invalidation Blacklist
-- ============================================================

CREATE TABLE invalidated_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(1000) UNIQUE NOT NULL,
    expiry TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invalidated_tokens_token ON invalidated_tokens(token);
