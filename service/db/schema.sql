CREATE TABLE courts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    court_type VARCHAR(20) NOT NULL,
    is_available BOOLEAN NOT NULL,
    status VARCHAR(20) NOT NULL
);
