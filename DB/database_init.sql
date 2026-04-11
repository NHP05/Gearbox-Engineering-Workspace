-- 1. Chọn đúng cơ sở dữ liệu của Aiven
SET FOREIGN_KEY_CHECKS = 0;
USE defaultdb;

-- 2. Xóa các bảng cũ để làm mới (Cẩn thận: mất hết dữ liệu cũ nhé!)
DROP TABLE IF EXISTS bearings;
DROP TABLE IF EXISTS gear_materials;
DROP TABLE IF EXISTS motors;
DROP TABLE IF EXISTS users; -- Xóa bảng user cũ nếu có

-- 3. Tạo bảng Users (Để sửa lỗi không đăng ký được)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Tạo bảng Motors (Thêm cột timestamps cho Sequelize)
CREATE TABLE IF NOT EXISTS motors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    power FLOAT NOT NULL,
    speed_rpm INT NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 5. Tạo bảng Vật liệu (Thêm timestamps)
CREATE TABLE gear_materials (
    name VARCHAR(255) PRIMARY KEY,
    sigma_h_lim FLOAT,
    sigma_f_lim FLOAT,
    hb_hardness INT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Tạo bảng Ổ lăn (Thêm timestamps)
CREATE TABLE bearings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bearing_code VARCHAR(100) NOT NULL UNIQUE,
    d_inner_mm FLOAT NOT NULL,
    d_outer_mm FLOAT NOT NULL,
    B_mm FLOAT NOT NULL,
    C_dynamic FLOAT,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Bơm lại dữ liệu mẫu (Seed Data)
USE defaultdb;

-- 1. NẠP DỮ LIỆU NGƯỜI DÙNG MẪU (Để test Login)
-- Mật khẩu đã được mã hóa (là '123456') để bạn test ngay mà không cần đăng ký
INSERT IGNORE INTO users (username, password, email, createdAt, updatedAt) VALUES 
('lam_hcmut', '$2b$10$EPfLpbBBVsdWG7.SJl4P3eZkKzK5c5n7.J7hJjZk8j7n.J7hJjZk8', 'lam@student.hcmut.edu.vn', NOW(), NOW()),
('admin_gearbox', '$2b$10$EPfLpbBBVsdWG7.SJl4P3eZkKzK5c5n7.J7hJjZk8j7n.J7hJjZk8', 'admin@gearbox.com', NOW(), NOW());

-- 2. NẠP DANH MỤC ĐỘNG CƠ (Số liệu chuẩn catalog Y2)
INSERT IGNORE INTO motors (name, power, speed_rpm, createdAt, updatedAt) VALUES 
('Y2-90L-2', 2.2, 2840, NOW(), NOW()),
('Y2-100L-4', 3.0, 1430, NOW(), NOW()),
('Y2-112M-4', 4.0, 1445, NOW(), NOW()),
('Y2-132S-4', 5.5, 1460, NOW(), NOW()),
('Y2-132M-4', 7.5, 1460, NOW(), NOW()),
('Y2-160M-4', 11.0, 1470, NOW(), NOW()),
('Y2-160L-4', 15.0, 1470, NOW(), NOW());

-- 3. NẠP VẬT LIỆU BÁNH RĂNG (Thông số ứng suất cho phép)
INSERT IGNORE INTO gear_materials (name, sigma_h_lim, sigma_f_lim, hb_hardness, createdAt, updatedAt) VALUES 
('Thép C45 Tôi cải thiện', 580, 180, 210, NOW(), NOW()),
('Thép C45 Tôi nắn', 450, 150, 190, NOW(), NOW()),
('Thép 40Cr Tôi cải thiện', 750, 260, 250, NOW(), NOW()),
('Thép 38CrMoAl Thấm nitơ', 950, 350, 300, NOW(), NOW()),
('Thép 20Cr Thấm Carbon', 1050, 450, 58, NOW(), NOW()); -- 58 ở đây là HRC quy đổi

-- 4. NẠP DANH MỤC Ổ LĂN (Để chọn ổ sau khi tính trục)
INSERT IGNORE INTO bearings (bearing_code, d_inner_mm, d_outer_mm, B_mm, C_dynamic, createdAt, updatedAt) VALUES 
('6205 (Bi đỡ)', 25, 52, 15, 14.0, NOW(), NOW()),
('6206 (Bi đỡ)', 30, 62, 16, 19.5, NOW(), NOW()),
('6308 (Bi đỡ)', 40, 90, 23, 40.5, NOW(), NOW()),
('30206 (Côn)', 30, 62, 17.25, 35.1, NOW(), NOW()),
('30208 (Côn)', 40, 80, 19.75, 54.2, NOW(), NOW()),
('30210 (Côn)', 50, 90, 21.75, 68.5, NOW(), NOW());
