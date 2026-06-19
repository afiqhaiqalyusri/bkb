-- BKB — V14: Add deleted column to menu_items
ALTER TABLE menu_items ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT FALSE;
