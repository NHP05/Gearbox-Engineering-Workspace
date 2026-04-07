-- 1. Chọn đúng cơ sở dữ liệu
USE do_an_co_khi;

-- 2. Xóa các bảng cũ (nếu có) để tránh xung đột
DROP TABLE IF EXISTS motors;
DROP TABLE IF EXISTS gear_materials;
DROP TABLE IF EXISTS bearings;

-- 3. Tạo lại cấu trúc các bảng (Chuẩn khớp với Sequelize Models)
CREATE TABLE motors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    power FLOAT NOT NULL,
    speed_rpm INT NOT NULL
);

CREATE TABLE gear_materials (
    name VARCHAR(255) PRIMARY KEY,
    sigma_h_lim FLOAT,
    sigma_f_lim FLOAT,
    hb_hardness INT
);

CREATE TABLE bearings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bearing_code VARCHAR(100) NOT NULL UNIQUE,
    d_inner_mm FLOAT NOT NULL,  -- Đường kính trong (d)
    d_outer_mm FLOAT NOT NULL,  -- Đường kính ngoài (D)
    B_mm FLOAT NOT NULL,
    C_dynamic FLOAT
);

-- 4. Bơm dữ liệu (Seed Data)
-- Bơm dữ liệu Động cơ
INSERT INTO motors (name, power, speed_rpm) VALUES 
('Y2-90L-2', 2.2000, 2840),
('Y2-100L-4', 3.0000, 1430),
('Y2-112M-4', 4.0000, 1445),
('Y2-132S-4', 5.5000, 1460),
('Y2-160M-4', 11.0000, 1470),
('Y2-160L-4', 15.0000, 1460),
('Y2-180M-4', 18.5000, 1470);

-- Bơm dữ liệu Vật liệu Bánh răng
INSERT INTO gear_materials (name, sigma_h_lim, sigma_f_lim, hb_hardness) VALUES 
('C45-N (Normalized)', 980.00, 320.00, 190),
('40Cr-QT (Quenched+Tempered)', 1180.00, 420.00, 250),
('20MnCr5-Carb', 1500.00, 520.00, 300),
('42CrMo4-QT', 1300.00, 460.00, 280),
('GCr15-BRG', 1600.00, 550.00, 320);

-- Bơm dữ liệu Ổ lăn
INSERT INTO bearings (bearing_code, d_inner_mm, d_outer_mm, B_mm, C_dynamic) VALUES 
('6205', 25.00, 52.00, 15.00, 14.00),
('6206', 30.00, 62.00, 16.00, 19.50),
('6308', 40.00, 90.00, 23.00, 40.50),
('30206', 30.00, 62.00, 17.25, 35.10),
('30208', 40.00, 80.00, 19.75, 54.20);