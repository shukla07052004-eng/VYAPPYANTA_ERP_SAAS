CREATE TABLE workers (
    worker_id SERIAL PRIMARY KEY,
    worker_name VARCHAR(150) NOT NULL CHECK (worker_name = LOWER(TRIM(worker_name))),
    role VARCHAR(100) NOT NULL,
    phone VARCHAR(10) NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
    salary NUMERIC(12, 2) NOT NULL CHECK (salary >= 0),
    join_date DATE NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    advance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (advance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);