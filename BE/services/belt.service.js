const Belt = require('../models/belt.model');
const { calculateMoment, EFFICIENCY_FACTORS, standardizeSize } = require('../utils/calculationUtils');

/**
 * Tính toán bộ truyền đai thang (Belt Drive)
 * Input: P (kW), n_motor (RPM), u_belt (tỉ số truyền)
 */
const calculateBeltDrive = async (P_motor, n_motor, u_belt = 1.3) => {
    try {
        // 1. Validate inputs
        if (!P_motor || P_motor <= 0 || !n_motor || n_motor <= 0 || !u_belt || u_belt <= 0) {
            throw new Error("Power, Speed, và Ratio phải > 0");
        }
        
        // 2. Xác định loại đai dựa trên công suất
        let beltType, d1_min, belt_width_factor;
        
        if (P_motor <= 3) {
            beltType = 'A';
            d1_min = 71;  // mm
            belt_width_factor = 1.0;
        } else if (P_motor <= 15) {
            beltType = 'B';
            d1_min = 100;
            belt_width_factor = 1.08;  // B belt: 17mm standard
        } else if (P_motor <= 40) {
            beltType = 'C';
            d1_min = 140;
            belt_width_factor = 1.15;  // C belt: 22mm standard
        } else {
            beltType = 'D';
            d1_min = 180;
            belt_width_factor = 1.25;  // D belt: 32mm standard
        }
        
        // 3. Tính đường kính bánh đai nhỏ d1
        // Chọn d1 ≥ d1_min và chuẩn hóa
        const d1_calculated = d1_min * (1 + 0.1);  // +10% margin
        const d1 = standardizeSize(d1_calculated, 5);  // Làm tròn bội 5
        
        // 4. Tính đường kính bánh đai lớn d2
        // d2 = d1 × u_belt (với slip factor ~0.01)
        const slip_factor = 0.99;  // Tính toán slip ~1%
        const d2 = d1 * u_belt * slip_factor;
        const d2_standard = standardizeSize(d2, 5);
        
        // 5. Tính vận tốc đai (m/s)
        const v_belt = (Math.PI * d1 * n_motor) / 60000;  // m/s
        
        // 6. Kiểm tra vận tốc đai hợp lệ (thường 5-35 m/s)
        if (v_belt < 5) {
            console.warn("⚠️ Belt velocity < 5 m/s (quá thấp)");
        }
        if (v_belt > 35) {
            console.warn("⚠️ Belt velocity > 35 m/s (quá cao, gây tiếng ồn, mất năng lượng)");
        }
        
        // 7. Tính khoảng cách trục sơ bộ a
        // a nằm trong khoảng: (d1+d2)/2 < a < 3(d1+d2)
        const a_min = (d1 + d2_standard) / 2;
        const a_max = 3 * (d1 + d2_standard);
        const a = (a_min + a_max) / 2;  // Chọn giữa
        const a_standard = standardizeSize(a, 10);
        
        // 8. Tính chiều dài đai
        // L = π(d1+d2)/2 + 2×a + (d2-d1)²/(4a)
        const L_belt = (Math.PI * (d1 + d2_standard) / 2) + 
                       (2 * a_standard) + 
                       (Math.pow(d2_standard - d1, 2) / (4 * a_standard));
        
        // 9. Tính lực căng đai
        // Công suất: P = T × ω = (F - f) × v
        // F: lực căng, f: lực slack
        const T_belt = (P_motor * 1000) / v_belt;  // N (công suất lớn, chia vận tốc)
        const F_belt = T_belt * 1.5;  // Tăng thêm 50% cho offset
        
        // 10. Kiểm tra vận tốc output
        const n_output = n_motor / u_belt;
        
        // 11. Tính moment tại output
        const T_output = calculateMoment(P_motor, n_output);
        
        // 12. Hiệu suất đai
        const eta_belt = EFFICIENCY_FACTORS.belt_v;
        
        // 13. Số vòng cuộc sống (Life cycles)
        // L_life = L_belt × n_motor × 60 (minutes) / 1000000
        const life_million_cycles = (L_belt * n_motor * 60) / 1000000;
        
        return {
            // Thông số bộ truyền
            transmission_type: "V-Belt Drive",
            belt_type: beltType,
            gear_ratio: parseFloat(u_belt.toFixed(3)),
            
            // Bánh đai
            pulley_small_d1_mm: d1,
            pulley_large_d2_mm: d2_standard,
            
            // Đai
            belt_length_mm: parseFloat(L_belt.toFixed(0)),
            belt_width_factor: belt_width_factor,
            
            // Động học
            motor_speed_rpm: n_motor,
            output_speed_rpm: parseFloat(n_output.toFixed(1)),
            belt_velocity_ms: parseFloat(v_belt.toFixed(2)),
            velocity_status: (v_belt >= 5 && v_belt <= 35) ? "✓ OK" : "⚠ OUT OF RANGE",
            
            // Khoảng cách trục
            center_distance_min_mm: parseFloat(a_min.toFixed(0)),
            center_distance_max_mm: parseFloat(a_max.toFixed(0)),
            center_distance_recommended_mm: a_standard,
            
            // Lực tác dụng
            belt_tension_N: parseFloat(F_belt.toFixed(0)),
            belt_torque_Nm: parseFloat(T_belt.toFixed(2)),
            
            // Moment output
            output_torque_Nm: T_output,
            
            // Hiệu suất
            efficiency: parseFloat(eta_belt.toFixed(4)),
            efficiency_factor: eta_belt,
            
            // Độ bền
            life_million_cycles: parseFloat(life_million_cycles.toFixed(2)),
            life_status: life_million_cycles > 5 ? "✓ Good" : "⚠ Short",
            
            // Tóm tắt
            status: "✓ PASS",
            recommendations: [
                `Loại đai: ${beltType} (${d1}mm x ${d2_standard}mm)`,
                `Chiều dài đai: ${parseInt(L_belt)} mm`,
                `Khoảng cách trục: ~${a_standard} mm`,
                `Vận tốc đai: ${v_belt.toFixed(2)} m/s`,
                `Hiệu suất: ${(eta_belt * 100).toFixed(1)}%`
            ]
        };
    } catch (error) {
        console.error("Lỗi Belt Drive Calculation:", error.message);
        throw error;
    }
};

module.exports = { calculateBeltDrive };
