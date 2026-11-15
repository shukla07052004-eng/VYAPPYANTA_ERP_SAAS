CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(50) NOT NULL,
    party_id INT NOT NULL REFERENCES parties(party_id),
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    sub_total INT NOT NULL,
    tax INT NOT NULL,
    total INT NOT NULL,
    paid INT DEFAULT 0 CHECK (paid >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partial', 'Paid')) ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE invoice_item (
    invoice_item_id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    tem_id INT NOT NULL REFERENCES items(items_id),
    quantity NUMERIC(12, 2) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL
)