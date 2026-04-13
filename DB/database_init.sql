-- ====================================
-- GEARBOX ENGINEERING DATABASE INIT
-- ====================================
-- 1. Tạo và Chọn đúng cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS gearbox_db;
USE gearbox_db;

-- 2. Xóa các bảng cũ (nếu có) để tránh xung đột
DROP TABLE IF EXISTS design_variants;
DROP TABLE IF EXISTS admin_action_logs;
DROP TABLE IF EXISTS deleted_accounts;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS motors;
DROP TABLE IF EXISTS gear_materials;
DROP TABLE IF EXISTS belts;
DROP TABLE IF EXISTS std_tolerances;
DROP TABLE IF EXISTS bearings;

-- ====================================
-- 3. BẢNG USERS (Quản lý tài khoản)
-- ====================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    password_plain TEXT NULL,
    email VARCHAR(255) NULL,
    role VARCHAR(50) DEFAULT 'USER', -- 'USER' hoặc 'ADMIN'
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT NULL,
    banned_by INT NULL,
    banned_at DATETIME NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    theme VARCHAR(20) NOT NULL DEFAULT 'light',
    last_login_at DATETIME NULL,
    last_seen_at DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- ====================================
-- 4. BẢNG PROJECTS (Dự án thiết kế)
-- ====================================
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    power_P FLOAT NOT NULL,      -- Công suất (kW)
    speed_n FLOAT NOT NULL,      -- Tốc độ vòng quay (v/p)
    lifetime_L FLOAT,            -- Thời gian phục vụ (giờ)
    load_type VARCHAR(100),      -- Chế độ tải (Tĩnh, va đập, etc.)
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
);

-- ====================================
-- 5. BẢNG NOTIFICATIONS (Thông báo người dùng)
-- ====================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSON NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_user (user_id),
    INDEX idx_notification_read (is_read),
    INDEX idx_notification_pinned (is_pinned)
);

-- ====================================
-- 5.1 BẢNG SUPPORT_TICKETS (Ticket hỗ trợ)
-- ====================================
CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(48) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by_name VARCHAR(120) NOT NULL,
    created_by_email VARCHAR(255) NULL,
    user_edit_count INT NOT NULL DEFAULT 0,
    user_edited_at DATETIME NULL,
    banned_by_admin_id INT NULL,
    banned_reason TEXT NULL,
    banned_at DATETIME NULL,
    deleted_by_admin_id INT NULL,
    deleted_by_admin_reason TEXT NULL,
    deleted_by_admin_at DATETIME NULL,
    deleted_by_user_reason TEXT NULL,
    deleted_by_user_at DATETIME NULL,
    last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_by_role VARCHAR(20) NOT NULL DEFAULT 'USER',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_ticket_user (user_id),
    INDEX idx_support_ticket_last_message (last_message_at)
);

-- ====================================
-- 5.2 BẢNG SUPPORT_MESSAGES (Tin nhắn theo ticket)
-- ====================================
CREATE TABLE support_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    sender_user_id INT NOT NULL,
    sender_role VARCHAR(20) NOT NULL DEFAULT 'USER',
    message TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_count INT NOT NULL DEFAULT 0,
    edited_at DATETIME NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_support_message_ticket (ticket_id)
);

-- ====================================
-- 6. BẢNG MOTORS (Thư viện động cơ)
-- ====================================
CREATE TABLE deleted_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_user_id INT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    deleted_by_user_id INT NOT NULL,
    deleted_by_username VARCHAR(255) NOT NULL,
    reason TEXT NULL,
    metadata JSON NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deleted_username (username),
    INDEX idx_deleted_by_user_id (deleted_by_user_id)
);

CREATE TABLE admin_action_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_user_id INT NOT NULL,
    admin_username VARCHAR(255) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    target_user_id INT NULL,
    target_username VARCHAR(255) NULL,
    target_project_id INT NULL,
    target_project_name VARCHAR(255) NULL,
    reason TEXT NULL,
    payload JSON NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_action_type (action_type),
    INDEX idx_admin_user_id (admin_user_id),
    INDEX idx_target_user_id (target_user_id),
    INDEX idx_target_project_id (target_project_id)
);

-- ====================================
-- 6. BẢNG MOTORS (Thư viện động cơ)
-- ====================================
CREATE TABLE motors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    power FLOAT NOT NULL,        -- Công suất (kW)
    speed_rpm INT NOT NULL,      -- Tốc độ vòng quay (v/p)
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_power (power)
);

-- ====================================
-- 7. BẢNG GEAR_MATERIALS (Vật liệu bánh răng)
-- ====================================
CREATE TABLE gear_materials (
    name VARCHAR(255) PRIMARY KEY,
    sigma_h_lim FLOAT,           -- Giới hạn mỏi tiếp xúc (MPa)
    sigma_f_lim FLOAT,           -- Giới hạn mỏi uốn (MPa)
    hb_hardness INT              -- Độ cứng (HB)
);

-- ====================================
-- 8. BẢNG BELTS (Thư viện đai truyền)
-- ====================================
CREATE TABLE belts (
    type VARCHAR(50) PRIMARY KEY, -- Loại đai: A, B, C...
    h FLOAT,                      -- Chiều cao tiết diện
    b_p FLOAT,                    -- Chiều rộng tính toán
    area FLOAT,                   -- Diện tích tiết diện (mm2)
    d1_min INT                    -- Đường kính bánh đai nhỏ tối thiểu
);

-- ====================================
-- 9. BẢNG STD_TOLERANCES (Dung sai tiêu chuẩn)
-- ====================================
CREATE TABLE std_tolerances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    connection_type VARCHAR(100) NOT NULL,    -- Loại mối ghép (gear_shaft, bearing_shaft)
    fit_character VARCHAR(100) NOT NULL,      -- Đặc tính lắp ghép
    hole_tolerance VARCHAR(50) NOT NULL,      -- Dung sai lỗ (H7, H8, etc.)
    shaft_tolerance VARCHAR(50) NOT NULL,     -- Dung sai trục (k6, h6, etc.)
    description TEXT,                         -- Mô tả chi tiết
    INDEX idx_connection (connection_type)
);

-- ====================================
-- 10. BẢNG BEARINGS (Thư viện ổ lăn)
-- ====================================
CREATE TABLE bearings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bearing_code VARCHAR(100) NOT NULL UNIQUE,
    d_inner_mm FLOAT NOT NULL,   -- Đường kính trong d (mm)
    d_outer_mm FLOAT NOT NULL,   -- Đường kính ngoài D (mm)
    B_mm FLOAT NOT NULL,         -- Bề rộng vành B (mm)
    C_dynamic FLOAT,             -- Tải trọng động C (kN)
    C0_static FLOAT,             -- Tải trọng tĩnh C0 (kN)
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bearing_code (bearing_code)
);

-- ====================================
-- 11. BẢNG DESIGN_VARIANTS (Phương án thiết kế)
-- ====================================
CREATE TABLE design_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    calculated_data JSON,        -- Dữ liệu tính toán dưới dạng JSON
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_is_final (is_final)
);

-- ====================================
-- SEED DATA - NGƯỜI DÙNG
-- ====================================
INSERT INTO users (username, password_hash, password_plain, email, role, is_banned, ban_reason, banned_by, banned_at, language, theme, last_login_at, last_seen_at) VALUES 
('admin', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'admin@gearbox.local', 'ADMIN', FALSE, NULL, NULL, NULL, 'vi', 'light', NULL, NULL),
('user1', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'user1@gearbox.local', 'USER', FALSE, NULL, NULL, NULL, 'vi', 'light', NULL, NULL),
('user2', '$2b$10$dqy6pTZjSz4dzSwW13HU7eFpHHGFGVfHSHfNkPGzXXoCXu3vziGh2', 'test', 'user2@gearbox.local', 'USER', FALSE, NULL, NULL, NULL, 'vi', 'light', NULL, NULL);

INSERT INTO notifications (user_id, type, title, message, metadata, is_read, is_pinned, pinned_at) VALUES
(2, 'WELCOME', 'Chào mừng', 'Tài khoản của bạn đã sẵn sàng. Hãy bắt đầu dự án đầu tiên.', JSON_OBJECT('source', 'seed'), FALSE, FALSE, NULL);

INSERT INTO support_tickets (ticket_code, user_id, subject, priority, status, created_by_name, created_by_email, last_message_at, last_message_by_role) VALUES
('SUP-DEMO-001', 2, 'Can ho tro kiem tra bo truyen', 'normal', 'open', 'user1', 'user1@gearbox.local', CURRENT_TIMESTAMP, 'USER');

INSERT INTO support_messages (ticket_id, sender_user_id, sender_role, message) VALUES
((SELECT id FROM support_tickets WHERE ticket_code = 'SUP-DEMO-001' LIMIT 1), 2, 'USER', 'Toi can ho tro de danh gia phuong an thiet ke hien tai.');

-- ====================================
-- SEED DATA - ĐỘNG CƠ
-- ====================================
INSERT INTO motors (name, power, speed_rpm) VALUES 
('Y2-90L-2', 2.20, 2840),
('Y2-100L-4', 3.00, 1430),
('Y2-112M-4', 4.00, 1445),
('Y2-132S-4', 5.50, 1460),
('Y2-160M-4', 11.00, 1470),
('Y2-160L-4', 15.00, 1460),
('Y2-180M-4', 18.50, 1470);

-- ====================================
-- SEED DATA - VẬT LIỆU BÁNH RĂNG
-- ====================================
INSERT INTO gear_materials (name, sigma_h_lim, sigma_f_lim, hb_hardness) VALUES 
('C45-N (Thường hóa)', 980.00, 320.00, 190),
('40Cr-QT (Tôi cải thiện)', 1180.00, 420.00, 250),
('20MnCr5-Carb (Thấm cacbon)', 1500.00, 520.00, 300),
('42CrMo4-QT', 1300.00, 460.00, 280),
('GCr15-BRG', 1600.00, 550.00, 320);

-- ====================================
-- SEED DATA - ĐAI TRUYỀN
-- ====================================
INSERT INTO belts (type, h, b_p, area, d1_min) VALUES 
('A', 13, 11, 71.5, 75),
('B', 17, 14, 119, 120),
('C', 22, 19, 209, 200),
('D', 32, 27, 432, 315),
('E', 38, 32, 608, 400);

-- ====================================
-- SEED DATA - DUNG SAI TIÊU CHUẨN
-- ====================================
INSERT INTO std_tolerances (connection_type, fit_character, hole_tolerance, shaft_tolerance, description) VALUES 
('gear_shaft', 'Lắp có độ dôi', 'H7', 'p6', 'Lắp cố định vĩnh viễn (lắp ép)'),
('gear_shaft', 'Lắp trung gian', 'H7', 'k6', 'Lắp có thể tháo rời được (từ nên)'),
('gear_shaft', 'Lắp lỏng', 'H7', 'h6', 'Lắp lỏng để dễ lắp tháo'),
('bearing_shaft', 'Lắp có độ dôi', 'H7', 'p6', 'Ổ lăn lắp cố định trên trục'),
('bearing_shaft', 'Lắp trung gian', 'H7', 'k6', 'Ổ lăn lắp sỏi trên trục'),
('bearing_shaft', 'Lắp lỏng', 'H7', 'h6', 'Ổ lăn lắp lỏng, có thể quay');

-- ====================================
-- SEED DATA - Ổ LĂN
-- ====================================
INSERT INTO bearings (bearing_code, d_inner_mm, d_outer_mm, B_mm, C_dynamic, C0_static) VALUES 
('6200', 10.00, 30.00, 9.00, 5.10, 2.45),
('6201', 12.00, 32.00, 10.00, 6.89, 3.35),
('6202', 15.00, 35.00, 11.00, 7.80, 3.90),
('6203', 17.00, 40.00, 12.00, 10.20, 5.20),
('6204', 20.00, 47.00, 14.00, 14.60, 7.60),
('6205', 25.00, 52.00, 15.00, 14.00, 7.88),
('6206', 30.00, 62.00, 16.00, 19.50, 11.20),
('6207', 35.00, 72.00, 17.00, 25.50, 14.50),
('6208', 40.00, 80.00, 18.00, 30.70, 17.10),
('6209', 45.00, 85.00, 19.00, 31.50, 17.50);

-- ====================================
-- SEED DATA - DỰ ÁN VÀ PHƯƠNG ÁN
-- ====================================
INSERT INTO projects (user_id, project_name, power_P, speed_n, lifetime_L, load_type) VALUES 
(1, 'Dự án Máy nghiền - Công án 1', 5.50, 1460, 10000, 'Tĩnh'),
(1, 'Dự án Máy kéo - Công án 2', 11.00, 1470, 15000, 'Va đập'),
(2, 'Dự án Quạt công nghiệp - Công án 3', 3.00, 1430, 8000, 'Tĩnh');

INSERT INTO design_variants (project_id, variant_name, is_final, calculated_data) VALUES 
(1, 'Phương án Thép 45 - Nhiệt luyện thường', 0, '{"motor":"Y2-132S-4","gear_material":"C45-N (Thường hóa)","belt_type":"B"}'),
(1, 'Phương án 40Cr - Tôi cải thiện', 0, '{"motor":"Y2-132S-4","gear_material":"40Cr-QT (Tôi cải thiện)","belt_type":"B"}'),
(1, 'Phương án 20MnCr5 - Thấm cacbon (CHỐT)', 1, '{"motor":"Y2-132S-4","gear_material":"20MnCr5-Carb (Thấm cacbon)","belt_type":"C"}'),
(2, 'Phương án Thép 40Cr - Công suất lớn', 1, '{"motor":"Y2-160M-4","gear_material":"40Cr-QT (Tôi cải thiện)","belt_type":"C"}'),
(3, 'Phương án Tiết kiệm - Thép 45 Thường hóa', 1, '{"motor":"Y2-100L-4","gear_material":"C45-N (Thường hóa)","belt_type":"A"}');