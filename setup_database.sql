-- ============================================
-- CREATE DATABASE AND TABLES
-- ============================================

-- Tạo database nếu chưa tồn tại
CREATE DATABASE IF NOT EXISTS gearbox_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gearbox_db;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- MOTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS motors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    power_kw DECIMAL(10, 2),
    efficiency DECIMAL(5, 3),
    cost INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    calculated_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ============================================
-- TOLERANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tolerances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    variant_id INT NOT NULL,
    tolerance_type VARCHAR(50),
    value DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Sample users
INSERT INTO users (username, password_hash, email, role) VALUES
('admin', '$2a$10$test', 'admin@gearbox.local', 'admin'),
('user1', '$2a$10$test', 'user1@gearbox.local', 'user'),
('user2', '$2a$10$test', 'user2@gearbox.local', 'user');

-- Sample motors
INSERT INTO motors (name, power_kw, efficiency, cost) VALUES
('Y90L-4 (2.2kW)', 2.2, 0.88, 15000000),
('Y100L1-4 (3.0kW)', 3.0, 0.89, 18000000),
('Y132S-4 (7.5kW)', 7.5, 0.91, 35000000),
('Y160M-4 (15kW)', 15.0, 0.925, 65000000);

-- Sample projects
INSERT INTO projects (user_id, project_name, description, status) VALUES
(1, 'Project 1', 'Thiết kế hộp giảm tốc cho máy bơm', 'completed'),
(1, 'Project 2', 'Thiết kế hộp giảm tốc cho máy nén', 'in_progress'),
(2, 'Project 3', 'Thiết kế hộp giảm tốc khác', 'draft');

-- Sample variants
INSERT INTO variants (project_id, variant_name, calculated_data) VALUES
(1, 'Biến thể 1', '{"motor": "Y90L-4", "power": 2.2}'),
(1, 'Biến thể 2', '{"motor": "Y100L1-4", "power": 3.0}'),
(2, 'Biến thể 1', '{"motor": "Y132S-4", "power": 7.5}');
