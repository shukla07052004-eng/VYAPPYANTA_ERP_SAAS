CREATE TABLE parties(
    party_id SERIAL PRIMARY KEY,
    party_name VARCHAR(100) NOT NULL UNIQUE,
    party_type VARCHAR(50) NOT NULL 
        CHECK (party_type IN ( 'Customer', 'Supplier', 'Distributor', 'Carrier', 'Agent')),
    account_group VARCHAR(50) NOT NULL
        CHECK (account_group IN ( 'Sundry Debtors', 'Sundry Creditors', 'Distributors', 'Transporters', 'Commission Agents')),
    gstin VARCHAR(15) NOT NULL UNIQUE CHECK (gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    contact_role VARCHAR(100) NOT NULL,
    contact_number VARCHAR(10) NOT NULL UNIQUE CHECK (contact_number ~ '^[6-9][0-9]{9}$'),
    email VARCHAR(100) NOT NULL UNIQUE CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10) NOT NULL CHECK (postal_code ~ '^[1-9][0-9]{5}$'),
    country VARCHAR(100) NOT NULL,
    payment_terms VARCHAR(100) NOT NULL CHECK(payment_terms IN ('Net 7', 'Net 15', 'Net 30', 'Net 45', 'COD', 'Advance')),
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'NZD')),
    discount_structure TEXT,
    bank_name VARCHAR(100),
    ifsc VARCHAR(11)
        CHECK (ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    account_no VARCHAR(30),
    partner_roles VARCHAR(100) DEFAULT 'Sold-To'
        CHECK (partner_roles IN( 'Sold-To', 'Ship-To', 'Bill-To', 'Payer')),
    shipping_methods VARCHAR(100) DEFAULT 'Road'
        CHECK (shipping_methods IN ('Road', 'Air', 'Rail', 'Courier', 'Local Delivery', 'Pickup')),
    status VARCHAR(20) DEFAULT 'Active'
        CHECK (status IN ('Active', 'Blocked', 'Archived')),
    notes TEXT,
    opening_balance NUMERIC(12,2) DEFAULT 0,
    carrier_info TEXT,
    supplier_details TEXT,
    latitude NUMERIC(10,7)
        CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(10,7)
        CHECK (longitude BETWEEN -180 AND 180),
    balance NUMERIC(12,2) DEFAULT 0,
    dr_cr VARCHAR(2)
        CHECK (dr_cr IN ('DR', 'CR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)