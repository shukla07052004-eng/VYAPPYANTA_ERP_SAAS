CREATE TABLE items(
    items_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    item_category VARCHAR(50) NOT NULL CHECK (item_category IN ('Tablet', 'Capsule', 'Softgel', 'Syrup', 'Infusion', 'Injection', 'Other Goods')),
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    expiry_alert BOOLEAN  NOT NULL DEFAULT 'true',
    purchase_price INT NOT NULL,
    sales_price INT NOT NULL,
    mrp INT NOT NULL,
    stock_qty INT NOT NULL,
    discount INT NOT NULL,
    gst INT NOT NULL
       CHECK (gst IN (0,5,12,18,28)),
    item_barcode VARCHAR(50) UNIQUE,
    item_image_url TEXT,
    item_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM users