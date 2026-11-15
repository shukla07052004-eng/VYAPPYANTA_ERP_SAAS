CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    bill_no VARCHAR(50) NOT NULL UNIQUE,
    -- Supplier relationship
    supplier_id INT NOT NULL REFERENCES parties(party_id),
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    purchase_type VARCHAR(30) NOT NULL CHECK (
        purchase_type IN ('Purchase Bill', 'Debit Note')
    ),
    subtotal NUMERIC(14, 2) NOT NULL,
    tax NUMERIC(14, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    paid NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (paid >= 0),
    mode VARCHAR(20) NOT NULL DEFAULT 'Credit' CHECK (
        mode IN ('Credit', 'Cash', 'Bank', 'UPI', 'Against GRN')
    ),
    status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (
        status IN ('Unpaid', 'Partial', 'Paid')
    ),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    hsn VARCHAR(8),
    quantity NUMERIC(12, 3) NOT NULL CHECK (quantity > 0),
    rate NUMERIC(14, 2) NOT NULL CHECK (rate >= 0),
    discount_pct NUMERIC(5, 2) NOT NULL CHECK (
        discount_pct BETWEEN 0 AND 100
    ),
    tax_pct NUMERIC(5, 2) NOT NULL CHECK (
        tax_pct BETWEEN 0 AND 100
    ),
    tax_label VARCHAR(30) NOT NULL,
    base_amount NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL
);

CREATE TABLE purchase_tax_breakdown (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(purchase_id) ON DELETE CASCADE,
    rate NUMERIC(5, 2) NOT NULL CHECK (rate >= 0),
    taxable NUMERIC(14, 2) NOT NULL CHECK (taxable >= 0)
);