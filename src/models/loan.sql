CREATE TABLE loans (
    loan_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL CHECK (name = LOWER(TRIM(name))),
    institution VARCHAR(150) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL CHECK (interest_rate >= 0),
    emi_amount NUMERIC(14, 2) NOT NULL CHECK (emi_amount >= 0),
    due_date DATE NOT NULL,
    remaining_balance NUMERIC(14, 2) NOT NULL CHECK (remaining_balance >= 0),
    reminder VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);