-- ============================================================
--  BKB — V1: Full Database Schema
--  Flyway migration: runs automatically on application startup
-- ============================================================

-- ─── Custom Types (Enums) ────────────────────────────────────

CREATE TYPE user_role AS ENUM ('CUSTOMER','STAFF','MANAGER','GUEST');

CREATE TYPE order_status AS ENUM (
    'PENDING','ACCEPTED','GRILLING',
    'ASSEMBLING','READY','COMPLETED','CANCELLED'
);

CREATE TYPE payment_method_type AS ENUM ('ONLINE','CASH');
CREATE TYPE payment_status_type AS ENUM ('UNPAID','PAID','FAILED');
CREATE TYPE payment_method_enum  AS ENUM ('FPX','CASH');
CREATE TYPE payment_status_enum  AS ENUM ('PENDING','SUCCESS','FAILED');

CREATE TYPE ingredient_level AS ENUM ('NONE','LESS','MEDIUM','EXTRA');

CREATE TYPE inventory_status AS ENUM ('GOOD','LOW','CRITICAL');
CREATE TYPE inventory_tx_type AS ENUM ('DEDUCT','RESTOCK','WASTE','ADJUST');

CREATE TYPE discount_type AS ENUM ('PERCENT','FIXED');

-- ─── users ───────────────────────────────────────────────────

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    phone         VARCHAR(20),
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'CUSTOMER',
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON users(email);
CREATE INDEX idx_users_role    ON users(role);

-- ─── menu_items ──────────────────────────────────────────────

CREATE TABLE menu_items (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    promo_price   NUMERIC(10,2) CHECK (promo_price >= 0),
    category      VARCHAR(80),
    image_url     TEXT,
    is_available  BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category    ON menu_items(category);
CREATE INDEX idx_menu_items_available   ON menu_items(is_available);

-- ─── menu_item_ingredients ───────────────────────────────────

CREATE TABLE menu_item_ingredients (
    id              BIGSERIAL PRIMARY KEY,
    menu_item_id    BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    ingredient_name VARCHAR(100) NOT NULL,
    default_level   ingredient_level DEFAULT 'MEDIUM'
);

CREATE INDEX idx_mii_menu_item ON menu_item_ingredients(menu_item_id);

-- ─── orders ──────────────────────────────────────────────────

CREATE TABLE orders (
    id             BIGSERIAL PRIMARY KEY,
    order_number   VARCHAR(20) UNIQUE NOT NULL,
    user_id        BIGINT REFERENCES users(id) ON DELETE SET NULL,
    guest_name     VARCHAR(100),
    guest_phone    VARCHAR(20),
    status         order_status NOT NULL DEFAULT 'PENDING',
    payment_method payment_method_type NOT NULL DEFAULT 'CASH',
    payment_status payment_status_type NOT NULL DEFAULT 'UNPAID',
    subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax            NUMERIC(10,2) NOT NULL DEFAULT 0,
    total          NUMERIC(10,2) NOT NULL DEFAULT 0,
    pickup_time    TIMESTAMP WITHOUT TIME ZONE,
    notes          TEXT,
    created_at     TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id      ON orders(user_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_created_at   ON orders(created_at);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- ─── order_items ─────────────────────────────────────────────

CREATE TABLE order_items (
    id               BIGSERIAL PRIMARY KEY,
    order_id         BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id     BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
    quantity         INT NOT NULL CHECK (quantity > 0),
    unit_price       NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    customisations   JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_order_items_order_id     ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item_id ON order_items(menu_item_id);

-- ─── payments ────────────────────────────────────────────────

CREATE TABLE payments (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    transaction_ref VARCHAR(100) UNIQUE,
    method          payment_method_enum NOT NULL DEFAULT 'CASH',
    amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    status          payment_status_enum NOT NULL DEFAULT 'PENDING',
    receipt_url     TEXT,
    paid_at         TIMESTAMP WITHOUT TIME ZONE,
    created_at      TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status   ON payments(status);

-- ─── inventory ───────────────────────────────────────────────

CREATE TABLE inventory (
    id            BIGSERIAL PRIMARY KEY,
    item_name     VARCHAR(150) NOT NULL,
    category      VARCHAR(80),
    unit          VARCHAR(30),
    current_stock NUMERIC(10,2) NOT NULL CHECK (current_stock >= 0),
    min_stock     NUMERIC(10,2) NOT NULL CHECK (min_stock >= 0),
    max_stock     NUMERIC(10,2) NOT NULL CHECK (max_stock >= 0),
    status        inventory_status NOT NULL DEFAULT 'GOOD',
    updated_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_status   ON inventory(status);
CREATE INDEX idx_inventory_category ON inventory(category);

-- Trigger: auto-update inventory status whenever current_stock changes

CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_stock <= NEW.min_stock * 0.5 THEN
        NEW.status := 'CRITICAL';
    ELSIF NEW.current_stock <= NEW.min_stock THEN
        NEW.status := 'LOW';
    ELSE
        NEW.status := 'GOOD';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_status
BEFORE INSERT OR UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- ─── inventory_transactions ──────────────────────────────────

CREATE TABLE inventory_transactions (
    id            BIGSERIAL PRIMARY KEY,
    inventory_id  BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    type          inventory_tx_type NOT NULL,
    quantity      NUMERIC(10,2) NOT NULL,
    reason        TEXT,
    order_id      BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    created_by    BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inv_tx_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX idx_inv_tx_order_id     ON inventory_transactions(order_id);
CREATE INDEX idx_inv_tx_created_at   ON inventory_transactions(created_at);

-- ─── menu_item_inventory (recipe link) ───────────────────────

CREATE TABLE menu_item_inventory (
    menu_item_id  BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    inventory_id  BIGINT NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    quantity_used NUMERIC(10,2) NOT NULL CHECK (quantity_used > 0),
    PRIMARY KEY (menu_item_id, inventory_id)
);

-- ─── loyalty_accounts ────────────────────────────────────────

CREATE TABLE loyalty_accounts (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points        INT NOT NULL DEFAULT 0 CHECK (points >= 0),
    total_earned  INT NOT NULL DEFAULT 0,
    updated_at    TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ─── loyalty_rewards ─────────────────────────────────────────

CREATE TABLE loyalty_rewards (
    id            BIGSERIAL PRIMARY KEY,
    menu_item_id  BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
    name          VARCHAR(150) NOT NULL,
    points_cost   INT NOT NULL CHECK (points_cost > 0),
    is_active     BOOLEAN DEFAULT TRUE
);

-- ─── loyalty_transactions ────────────────────────────────────

CREATE TYPE loyalty_tx_type AS ENUM ('EARN','REDEEM');

CREATE TABLE loyalty_transactions (
    id          BIGSERIAL PRIMARY KEY,
    account_id  BIGINT NOT NULL REFERENCES loyalty_accounts(id) ON DELETE CASCADE,
    type        loyalty_tx_type NOT NULL,
    points      INT NOT NULL,
    order_id    BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_tx_account_id ON loyalty_transactions(account_id);
CREATE INDEX idx_loyalty_tx_order_id   ON loyalty_transactions(order_id);

-- ─── promotions ──────────────────────────────────────────────

CREATE TABLE promotions (
    id             BIGSERIAL PRIMARY KEY,
    title          VARCHAR(200),
    description    TEXT,
    discount_type  discount_type NOT NULL DEFAULT 'PERCENT',
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
    is_active      BOOLEAN DEFAULT TRUE,
    start_date     DATE,
    end_date       DATE
);

CREATE INDEX idx_promotions_active ON promotions(is_active);
