const GearMaterial = require('../models/gear_material.model');
const {
    calculateContactStress,
    calculateBendingStress,
    calculateGearTeeth,
    calculateGearDiameters,
    calculateGearWidth,
    standardizeSize,
    MATERIAL_PROPERTIES
} = require('../utils/calculationUtils');

/**
 * Tính bánh răng côn (Bevel Gear)
 * Đây là cấp nhanh (quick stage)
 * @param {number} T1 - Moment input (N·m)
 * @param {number} u1 - Tỷ số truyền 
 * @param {string} materialName - Tên vật liệu
 * @param {number} K_load - Load factor (mặc định 1.5 cho 2-shift light shock)
 * @param {number} phi_d - Life factor (mặc định 0.95 cho 21,600 hours)
 */
const calculateBevelGear = async (T1, u1, materialName = "20CrMnTi", K_load = 1.5, phi_d = 0.95) => {
    try {
        // 1. Lấy thông số vật liệu
        const matData = MATERIAL_PROPERTIES[materialName] || MATERIAL_PROPERTIES["20CrMnTi"];
        
        // 2. Các hệ số thiết kế cho bánh răng côn
        const Ka = 45;  // Hệ số cho bánh răng côn (hơi khác spur)
        const psi_ba = 0.25;  // Hệ số chiều rộng vành (tighter cho bevel)
        const KHbeta = 1.15;  // Hệ số phân bố tải (bevel cao hơn)
        
        // 3. Tính ứng suất tiếp xúc cho phép (áp dụng life factor)
        const sigma_h_lim = (matData.sigma_h_lim || 1500) * phi_d;  // Áp dụng phi_d
        const sigma_h_allow = sigma_h_lim * 0.9;
        
        // 4. Tính công thức khoảng cách trục aw (bevel)
        const T1_Nmm = T1 * 1000;  // Đổi N·m → N·mm
        const aw = Ka * (u1 + 1) * Math.pow(
            (T1_Nmm * KHbeta) / (Math.pow(sigma_h_allow, 2) * u1 * psi_ba),
            1/3
        );
        
        // 5. Chuẩn hóa aw theo bội số 5
        const aw_standard = standardizeSize(aw, 5);
        
        // 6. Chọn modul chuẩn (tiêu chuẩn DIN 780)
        const m_list = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];
        const m = m_list.find(m => m * aw_standard >= aw_standard * 10) || 2;
        
        // 7. Tính số răng
        const teeth = calculateGearTeeth(u1, 15);  // z_min = 15 cho bevel (nhỏ hơn spur)
        
        // 8. Tính diameters
        const diameters = calculateGearDiameters(m, teeth.z1, teeth.z2);
        
        // 9. Tính chiều rộng vành
        const b = calculateGearWidth(aw_standard, psi_ba);
        
        // 10. Kiểm tra ứng suất tiếp xúc (simplified)
        const stressCheck_raw = calculateContactStress(
            T1_Nmm,
            aw_standard,
            b,
            sigma_h_allow
        );
        
        // Apply load factor K_load to the calculated stress
        const stressCheck = {
            ...stressCheck_raw,
            calculated_with_load_factor: parseFloat((stressCheck_raw.calculated * K_load).toFixed(2)),
            ratio_with_load_factor: parseFloat(((stressCheck_raw.calculated * K_load) / sigma_h_allow).toFixed(3)),
            status_with_load_factor: (stressCheck_raw.calculated * K_load) <= sigma_h_allow ? "SAFE" : "EXCEED",
            load_factor_applied: K_load
        };
        
        return {
            stage: "Bevel Gear (Quick Stage 1)",
            input_torque_Nm: T1,
            gear_ratio: u1,
            
            // Khoảng cách trục
            calculated_aw: parseFloat(aw.toFixed(2)),
            standard_aw: aw_standard,
            
            // Kích thước bánh
            module_m: m,
            teeth: {
                pinion_z1: teeth.z1,
                gear_z2: teeth.z2,
                actual_ratio: teeth.actual_ratio,
                error: teeth.error
            },
            
            diameters: {
                pinion_d1: diameters.d1,
                gear_d2: diameters.d2,
                center_distance: diameters.center_distance_aw
            },
            
            // Vành răng
            face_width_b: b,
            
            // Vật liệu và ứng suất
            material: materialName,
            contact_stress: stressCheck,
            
            // Kiểm tra
            status: stressCheck.status === "SAFE" ? "✓ PASS" : "✗ FAIL",
            recommendations: [
                `Ứng suất tiếp xúc: ${stressCheck.calculated} MPa (cho phép: ${stressCheck.allowable} MPa)`,
                `Hệ số an toàn: ${stressCheck.ratio}`,
                `Lề an toàn: ${stressCheck.safety_margin}`
            ]
        };
    } catch (error) {
        console.error("❌ Lỗi Bevel Gear:", error.message);
        throw error;
    }
};

const calculateSpurGear = async (T2, u2, materialName = "20CrMnTi", K_load = 1.5, phi_d = 0.95) => {
    try {
        // 1. Lấy thông số vật liệu
        const matData = MATERIAL_PROPERTIES[materialName] || MATERIAL_PROPERTIES["20CrMnTi"];
        
        // 2. Các hệ số thiết kế cho bánh răng trụ
        const Ka = 43;  // Hệ số cho bánh răng trụ
        const psi_ba = 0.3;  // Hệ số chiều rộng vành
        const KHbeta = 1.1;  // Hệ số phân bố không đều tải trọng
        
        // 3. Tính ứng suất tiếp xúc cho phép (áp dụng life factor)
        const sigma_h_lim = (matData.sigma_h_lim || 1500) * phi_d;  // Áp dụng phi_d
        const sigma_h_allow = sigma_h_lim * 0.9;
        
        // 4. Công thức tính khoảng cách trục aw (Spur Gear)
        const T2_Nmm = T2 * 1000;
        const aw = Ka * (u2 + 1) * Math.pow(
            (T2_Nmm * KHbeta) / (Math.pow(sigma_h_allow, 2) * u2 * psi_ba),
            1/3
        );
        
        // 5. Chuẩn hóa aw theo bội số 5
        const aw_standard = standardizeSize(aw, 5);
        
        // 6. Chọn modul chuẩn (tiêu chuẩn DIN 780)
        const m_list = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];
        const m = m_list.find(m => m >= aw_standard / 50) || 2;  // m ≈ aw/50 rule of thumb
        
        // 7. Tính số răng (z3, z4)
        const teeth = calculateGearTeeth(u2, 17);  // z_min = 17 để tránh undercut
        
        // 8. Tính diameters
        const diameters = calculateGearDiameters(m, teeth.z1, teeth.z2);
        
        // 9. Tính chiều rộng vành
        const b = calculateGearWidth(aw_standard, psi_ba);
        
        // 10. Kiểm tra ứng suất tiếp xúc (Contact Stress)
        const contactStressCheck_raw = calculateContactStress(
            T2_Nmm,
            aw_standard,
            b,
            sigma_h_allow
        );
        
        // Apply load factor K_load to contact stress
        const contactStressCheck = {
            ...contactStressCheck_raw,
            calculated_with_load_factor: parseFloat((contactStressCheck_raw.calculated * K_load).toFixed(2)),
            ratio_with_load_factor: parseFloat(((contactStressCheck_raw.calculated * K_load) / sigma_h_allow).toFixed(3)),
            status_with_load_factor: (contactStressCheck_raw.calculated * K_load) <= sigma_h_allow ? "SAFE" : "EXCEED",
            load_factor_applied: K_load
        };
        
        // 11. Kiểm tra ứng suất uốn (Bending Stress) - simplified
        const sigma_f_allow = (matData.sigma_f_lim || 600) * phi_d * 0.8;  // Apply phi_d here too
        const bendingStressCheck_raw = calculateBendingStress(
            T2_Nmm,
            m,
            b,
            teeth.z1,
            sigma_f_allow
        );
        
        // Apply load factor K_load to bending stress
        const bendingStressCheck = {
            ...bendingStressCheck_raw,
            calculated_with_load_factor: parseFloat((bendingStressCheck_raw.calculated * K_load).toFixed(2)),
            ratio_with_load_factor: parseFloat(((bendingStressCheck_raw.calculated * K_load) / sigma_f_allow).toFixed(3)),
            status_with_load_factor: (bendingStressCheck_raw.calculated * K_load) <= sigma_f_allow ? "SAFE" : "EXCEED",
            load_factor_applied: K_load
        };
        
        return {
            stage: "Spur Gear (Slow Stage 2)",
            input_torque_Nm: T2,
            gear_ratio: u2,
            
            // Khoảng cách trục
            calculated_aw: parseFloat(aw.toFixed(2)),
            standard_aw: aw_standard,
            
            // Kích thước bánh
            module_m: m,
            teeth: {
                pinion_z3: teeth.z1,
                gear_z4: teeth.z2,
                actual_ratio: teeth.actual_ratio,
                error: teeth.error
            },
            
            diameters: {
                pinion_d3: diameters.d1,
                gear_d4: diameters.d2,
                center_distance: diameters.center_distance_aw
            },
            
            // Vành răng
            face_width_b: b,
            
            // Vật liệu
            material_used: materialName,
            
            // Kiểm tra ứng suất
            contact_stress: contactStressCheck,
            bending_stress: bendingStressCheck,
            
            // Summary
            overall_status: (contactStressCheck.status === "SAFE" && bendingStressCheck.status === "SAFE") 
                ? "✓ PASS" 
                : "✗ FAIL",
            
            recommendations: [
                `Ứng suất tiếp xúc: ${contactStressCheck.calculated} MPa / ${contactStressCheck.allowable} MPa (${contactStressCheck.status})`,
                `Ứng suất uốn: ${bendingStressCheck.calculated} MPa / ${bendingStressCheck.allowable} MPa (${bendingStressCheck.status})`,
                `Lề an toàn tiếp xúc: ${contactStressCheck.safety_margin}`,
                `Lề an toàn uốn: ${bendingStressCheck.safety_margin}`
            ]
        };
    } catch (error) {
        console.error("❌ Lỗi Spur Gear:", error.message);
        throw error;
    }
};

// Đừng quên export các hàm khác như Bevel Gear nếu bạn làm tiếp nhé
module.exports = { calculateBevelGear, calculateSpurGear };
