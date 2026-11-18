CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL CHECK (
        password = TRIM(password)
        AND LENGTH(password) >= 8
    ),
    is_verified BOOLEAN DEFAULT FALSE,
    verifyCode VARCHAR(6) NOT NULL,
    verifyCodeExpiry TIMESTAMP NOT NULL,
    forgetPasswordToken VARCHAR(100),
    forgetPasswordTokenExpiry TIMESTAMP,
    resetPasswordToken VARCHAR(100),
    resetPasswordTokenExpiry TIMESTAMP,
    verifyEmailToken VARCHAR(100),
    verifyEmailTokenExpiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

ALTER TABLE users
ALTER COLUMN username DROP NOT NULL,
ALTER COLUMN password DROP NOT NULL;

ALTER TABLE users
ALTER COLUMN username SET DEFAULT NULL,
ALTER COLUMN password SET DEFAULT NULL;

SELECT * FROM users;

ALTER TABLE users
ALTER COLUMN verifycode DROP NOT NULL,
ALTER COLUMN verifycodeexpiry DROP NOT NULL;


DELETE FROM users WHERE id = 5;
