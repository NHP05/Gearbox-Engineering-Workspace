-- Bước 1: Chọn database
USE defaultdb;

-- Bước 2: Chèn người dùng trước (để sinh ra ID 1 và 2)
-- Nếu bảng users của bạn dùng AUTO_INCREMENT, lệnh này sẽ tạo ra ID 1, 2, 3
INSERT IGNORE INTO users (id, username, password_hash, role) VALUES 
(1, 'admin', 'hash_code_o_day', 'ADMIN'),
(2, 'user1', 'hash_code_o_day', 'USER');

-- Bước 3: Bây giờ mới chèn projects (Sửa luôn lỗi 1364 bằng cách thêm NOW())
INSERT INTO projects (user_id, project_name, power_P, speed_n, lifetime_L, load_type, createdAt) VALUES 
(1, 'Dự án Máy nghiền - Công án 1', 5.50, 1460, 10000, 'Tĩnh', NOW()),
(1, 'Dự án Máy kéo - Công án 2', 11.00, 1470, 15000, 'Va đập', NOW()),
(2, 'Dự án Quạt công nghiệp - Công án 3', 3.00, 1430, 8000, 'Tĩnh', NOW());