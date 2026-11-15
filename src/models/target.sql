CREATE TABLE targets (
    target_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL CHECK (title = LOWER(TRIM(title))),
    target_value NUMERIC(14, 2) NOT NULL,
    current_value NUMERIC(14, 2) NOT NULL,
    deadline DATE NOT NULL,
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    completion_status VARCHAR(20) NOT NULL CHECK (completion_status IN ('Open', 'Completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);