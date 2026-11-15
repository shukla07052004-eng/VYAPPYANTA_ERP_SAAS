CREATE TABLE banks (
    bank_id SERIAL PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL
        CHECK (bank_name = TRIM(bank_name)),
    account_holder VARCHAR(150) NOT NULL CHECK (account_holder = TRIM(account_holder)),
    account_no VARCHAR(30) NOT NULL CHECK (account_no = TRIM(account_no)),
    ifsc VARCHAR(11) NOT NULL CHECK (
        ifsc = UPPER(TRIM(ifsc))
        AND ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'
    ),
    branch VARCHAR(150) NOT NULL CHECK (branch = TRIM(branch)),
    account_type VARCHAR(30) NOT NULL CHECK (
        account_type IN (
            'Savings Account',
            'Current Account',
            'Fixed Deposit',
            'Recurring Deposit',
            'NRI Account',
            'Demat Account',
            'Other'
        )
    ),
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);