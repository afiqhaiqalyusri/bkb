-- ============================================================
--  BKB — V13: Security Audit Logs
-- ============================================================

CREATE TABLE security_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(150),
    user_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    previous_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_action ON security_logs(action);
CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);
