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
    password_plain TEXT,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(100) DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_code VARCHAR(48) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by_name VARCHAR(120) NOT NULL,
    created_by_email VARCHAR(255),
    user_edit_count INT NOT NULL DEFAULT 0,
    user_edited_at TIMESTAMP NULL,
    banned_by_admin_id INT NULL,
    banned_reason TEXT NULL,
    banned_at TIMESTAMP NULL,
    deleted_by_admin_id INT NULL,
    deleted_by_admin_reason TEXT NULL,
    deleted_by_admin_at TIMESTAMP NULL,
    deleted_by_user_reason TEXT NULL,
    deleted_by_user_at TIMESTAMP NULL,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_by_role VARCHAR(20) NOT NULL DEFAULT 'USER',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_ticket_user (user_id),
    INDEX idx_support_ticket_last_message (last_message_at)
);

-- ============================================
-- SUPPORT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    sender_user_id INT NOT NULL,
    sender_role VARCHAR(20) NOT NULL DEFAULT 'USER',
    message TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_count INT NOT NULL DEFAULT 0,
    edited_at TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_message_ticket (ticket_id)
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
INSERT INTO users (username, password_hash, password_plain, email, role, is_banned, language, theme) VALUES
('admin', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'admin@gearbox.local', 'ADMIN', FALSE, 'vi', 'light'),
('user1', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'user1@gearbox.local', 'USER', FALSE, 'vi', 'light'),
('user2', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'user2@gearbox.local', 'USER', FALSE, 'vi', 'light');

INSERT INTO notifications (user_id, type, title, message, metadata, is_read, is_pinned, pinned_at) VALUES
(2, 'WELCOME', 'Welcome', 'Your account is ready. Start your first gearbox project.', JSON_OBJECT('source', 'seed'), FALSE, FALSE, NULL);

INSERT INTO support_tickets (ticket_code, user_id, subject, priority, status, created_by_name, created_by_email, last_message_at, last_message_by_role) VALUES
('SUP-DEMO-001', 2, 'Yeu cau ho tro ban dau', 'normal', 'open', 'engineer1', 'engineer1@gearbox.local', CURRENT_TIMESTAMP, 'USER');

INSERT INTO support_messages (ticket_id, sender_user_id, sender_role, message) VALUES
((SELECT id FROM support_tickets WHERE ticket_code = 'SUP-DEMO-001' LIMIT 1), 2, 'USER', 'Toi can ho tro de kiem tra bo truyen cho du an moi.');

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
