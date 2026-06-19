-- ============================================================
--  BKB — V4: Ingredient Outages
-- ============================================================

CREATE TABLE ingredient_outages (
    name VARCHAR(100) PRIMARY KEY,
    out_of_stock BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO ingredient_outages (name, out_of_stock) VALUES
('Tomatoes', FALSE),
('Shredded Salad', FALSE),
('Cucumber', FALSE),
('Caramelized Onion', FALSE),
('Cheese', FALSE),
('Black Pepper', FALSE),
('Chilli', FALSE),
('Mayo', FALSE),
('Egg', FALSE);
