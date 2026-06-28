CREATE TABLE advertisements (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url VARCHAR(1000) NOT NULL,
    target_page VARCHAR(500),
    type VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    display_priority INTEGER,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

CREATE INDEX idx_advertisements_target_page ON advertisements(target_page);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);
