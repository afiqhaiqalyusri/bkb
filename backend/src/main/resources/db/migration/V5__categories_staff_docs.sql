-- ============================================================
--  BKB — V5: Categories & Staff Documents
-- ============================================================

-- ─── categories ──────────────────────────────────────────────

CREATE TABLE categories (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, display_order) VALUES
  ('Burger', 1),
  ('Oblong', 2),
  ('Special', 3),
  ('Drinks', 4),
  ('Sides', 5);

-- ─── staff_documents ─────────────────────────────────────────

CREATE TABLE staff_documents (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ic_number       VARCHAR(20),
    typhoid_expiry  DATE,
    food_handler_expiry DATE,
    emergency_contact_name  VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    notes           TEXT,
    updated_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_staff_docs_user ON staff_documents(user_id);
