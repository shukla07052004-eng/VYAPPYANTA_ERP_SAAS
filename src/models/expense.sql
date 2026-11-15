CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL CHECK (title = LOWER(TRIM(title))),
    description TEXT NOT NULL CHECK (description = LOWER(TRIM(description))),
    category VARCHAR(50) NOT NULL CHECK (
        category IN (
            'Electricity',
            'Salary',
            'Rent',
            'Transport',
            'Internet',
            'Maintenance',
            'Miscellaneous'
        )
    ),
    amount NUMERIC(14, 2) NOT NULL,
    expense_date DATE NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (
        mode IN ('Cash', 'UPI', 'Bank', 'Check')
    ),
    notes TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);