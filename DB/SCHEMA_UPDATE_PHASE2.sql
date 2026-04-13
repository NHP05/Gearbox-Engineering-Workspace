-- ============================================
-- UPDATE GEARBOX DATABASE SCHEMA
-- For Phase 2: Load/Life Factor Integration
-- ============================================

USE defaultdb;

-- [FIX LỖI 1175]: Tắt chế độ Safe Update để cập nhật dữ liệu dựa trên cột load_type
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- 1. UPDATE projects TABLE (Làm trước để chuẩn hóa dữ liệu)
-- ============================================
UPDATE projects SET load_type = 'light_shock_2shift' WHERE load_type = 'Va đập';
UPDATE projects SET load_type = 'constant' WHERE load_type = 'Tĩnh';

-- Bật lại Safe Update sau khi xong phần cập nhật nhạy cảm
SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- 2. UPDATE design_variants TABLE
-- [FIX LỖI 1060]: Kiểm tra sự tồn tại của cột trước khi thêm
-- Lưu ý: MySQL không có 'ADD COLUMN IF NOT EXISTS', 
-- nên nếu bạn chạy lại file này, hãy comment các dòng ADD COLUMN đã có.
-- ============================================

-- Cách an toàn: Chạy từng lệnh ADD, nếu lỗi Duplicate (1060) thì bỏ qua dòng đó.

-- ============================================
-- 3. CREATE NEW TABLE: calculation_results
-- ============================================
CREATE TABLE IF NOT EXISTS calculation_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variant_id INT NOT NULL,
    
    -- Motor Results
    motor_power FLOAT,
    motor_speed_rpm INT,
    motor_torque_Nm FLOAT,
    
    -- Belt Drive Results
    belt_type VARCHAR(10),
    belt_d1_mm FLOAT,
    belt_d2_mm FLOAT,
    belt_velocity_ms FLOAT,
    belt_length_mm FLOAT,
    belt_efficiency FLOAT,
    
    -- Bevel Gear Results
    bevel_aw_mm FLOAT,
    bevel_module FLOAT,
    bevel_z1 INT,
    bevel_z2 INT,
    bevel_contact_stress_MPa FLOAT,
    bevel_safety_ratio FLOAT,
    bevel_status VARCHAR(20),
    
    -- Spur Gear Results
    spur_aw_mm FLOAT,
    spur_module FLOAT,
    spur_z1 INT,
    spur_z2 INT,
    spur_contact_stress_MPa FLOAT,
    spur_bending_stress_MPa FLOAT,
    spur_safety_ratio FLOAT,
    spur_status VARCHAR(20),
    
    -- Shaft Results
    shaft_diameter_mm FLOAT,
    shaft_bending_stress_MPa FLOAT,
    shaft_torsional_stress_MPa FLOAT,
    shaft_vonmises_stress_MPa FLOAT,
    shaft_safety_ratio FLOAT,
    shaft_status VARCHAR(20),
    shaft_keyway_type VARCHAR(20),
    
    -- Design Verification
    u_total_required FLOAT,
    u_total_calculated FLOAT,
    u_error_percent FLOAT,
    overall_status VARCHAR(20),
    
    -- Load/Life Factors Applied
    load_factor_applied FLOAT COMMENT 'K_load (1.5 for 2-shift light shock)',
    life_factor_applied FLOAT COMMENT 'phi_d (0.95 for 21,600 hours)',
    
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_variant FOREIGN KEY (variant_id) REFERENCES design_variants(id) ON DELETE CASCADE,
    INDEX idx_variant_id (variant_id),
    INDEX idx_status (overall_status)
);

-- ============================================
-- 4. CREATE & INSERT: factor_mappings
-- ============================================
CREATE TABLE IF NOT EXISTS load_factor_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    load_type VARCHAR(100) NOT NULL UNIQUE,
    load_description VARCHAR(255),
    K_load FLOAT NOT NULL COMMENT 'Load factor coefficient',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dùng INSERT IGNORE để tránh lỗi trùng lặp khi chạy lại script
INSERT IGNORE INTO load_factor_mappings (load_type, load_description, K_load) VALUES 
('constant', 'Hoạt động liên tục, tải không đổi', 1.0),
('light_shock_1shift', 'Tải va đập nhẹ, 1 ca làm việc', 1.25),
('light_shock_2shift', 'Tải va đập nhẹ, 2 ca làm việc', 1.5),
('heavy_shock', 'Tải va đập nặng, hoạt động khó khăn', 2.0),
('intermittent_peak', 'Tải đỉnh tạm thời, hoạt động gián đoạn', 1.75);

CREATE TABLE IF NOT EXISTS life_factor_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hours_min INT NOT NULL,
    hours_max INT NOT NULL,
    years_approx INT,
    phi_d FLOAT NOT NULL COMMENT 'Life factor coefficient',
    description VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO life_factor_mappings (hours_min, hours_max, years_approx, phi_d, description) VALUES 
(1000, 5000, 1, 1.0, 'Short-term service'),
(5000, 15000, 2, 0.98, '2-year service life'),
(15000, 30000, 5, 0.96, '5-year design life'),
(30000, 50000, 9, 0.95, '9-year design life (thesis standard)'),
(50000, 100000, 15, 0.93, '15-year industrial standard'),
(100000, 200000, 30, 0.90, '30-year extended life');

-- ============================================
-- 5. UPDATE SAMPLE DATA (Dùng Safe Update = 0 tạm thời)
-- ============================================
SET SQL_SAFE_UPDATES = 0;

UPDATE design_variants 
SET u_belt = 1.3, u_bevel = 4.2, u_spur = 5.8, material_gear = '20CrMnTi', 
    material_shaft = 'C45', load_type = 'light_shock_2shift', life_years = 9
WHERE id = 1;

UPDATE design_variants 
SET u_belt = 1.3, u_bevel = 4.0, u_spur = 6.1, material_gear = '40Cr-QT', 
    material_shaft = 'C45', load_type = 'light_shock_2shift', life_years = 9
WHERE id = 3;

SET SQL_SAFE_UPDATES = 1;

-- ============================================
-- 6. VERIFY DATA
-- ============================================
DESCRIBE design_variants;
SELECT * FROM load_factor_mappings;