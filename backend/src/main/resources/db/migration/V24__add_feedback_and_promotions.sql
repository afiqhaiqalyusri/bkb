-- Add rating and feedback to orders
ALTER TABLE orders ADD COLUMN rating INT;
ALTER TABLE orders ADD COLUMN feedback TEXT;

-- Add promo_code and usage_count to promotions
ALTER TABLE promotions ADD COLUMN promo_code VARCHAR(50) UNIQUE;
ALTER TABLE promotions ADD COLUMN usage_count INT DEFAULT 0;

-- Create promotion_menu_items join table
CREATE TABLE promotion_menu_items (
    promotion_id BIGINT NOT NULL,
    menu_item_id BIGINT NOT NULL,
    PRIMARY KEY (promotion_id, menu_item_id),
    CONSTRAINT fk_promotions_menu_items_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE CASCADE,
    CONSTRAINT fk_promotions_menu_items_item FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);
