const {
    calculateMoment,
    calculateMinShaftDiameter,
    calculateShaftBendingStress,
    calculateShaftTorsionalStress,
    calculateVonMisesStress,
    standardizeSize,
    MATERIAL_PROPERTIES
} = require('../utils/calculationUtils');

/**
 * Design shaft (Trục)
 * Tính toán đầy đủ với ketway, bearing positions, stress check
 * @param {number} T - Torque (N·m)
 * @param {number} Mx - Bending moment X (N·m)
 * @param {number} My - Bending moment Y (N·m)
 * @param {string} materialName - Material name
 * @param {number} K_load - Load factor (default 1.5 for 2-shift light shock)
 * @param {number} phi_d - Life factor (default 0.95 for 21,600 hours)
 */
const calculateShaft = async (T, Mx, My, materialName = "C45", K_load = 1.5, phi_d = 0.95) => {
    try {
        // 1. Validate inputs
        if (!T || T <= 0 || !Mx || !My) {
            throw new Error("Torque T, Mx, My không hợp lệ");
        }
        
        // 2. Lấy thông số vật liệu
        const material = MATERIAL_PROPERTIES[materialName] || MATERIAL_PROPERTIES["C45"];
        
        // 3. Tính moment uốn tổng hợp
        const M_total = Math.sqrt(Math.pow(Mx, 2) + Math.pow(My, 2));
        
        // 4. Ứng suất cho phép với life factor (Safety factor ~2.5-3.0 × phi_d)
        const sigma_allow = material.sigma_allow * phi_d;
        const tau_allow = material.tau_allow * phi_d;
        
        // 5. Tính đường kính trục sơ bộ từ moment xoắn (torsion dominant)
        const T_Nmm = T * 1000;
        const d_from_torque = calculateMinShaftDiameter(T_Nmm, tau_allow);
        
        // 6. Tính đường kính trục sơ bộ từ moment uốn (bending)
        // d ≥ ∛(32×M / (π×σ_allow))
        const Mx_Nmm = Mx * 1000;
        const My_Nmm = My * 1000;
        const M_total_Nmm = M_total * 1000;
        
        const d_from_bending = Math.pow((32 * M_total_Nmm) / (Math.PI * sigma_allow), 1/3);
        
        // 7. Chọn đường kính lớn hơn
        let d_min = Math.max(d_from_torque, d_from_bending);
        
        // 8. Thêm margin cho stress concentration (30%)
        d_min = d_min * 1.3;
        
        // 9. Chuẩn hóa đường kính theo tiêu chuẩn (5mm bội số)
        const d_standard = standardizeSize(d_min, 5);
        
        // 10. Kiểm tra ứng suất uốn tại đường kính chuẩn
        const sigma_bending = calculateShaftBendingStress(M_total_Nmm, d_standard);
        const tau_torsion = calculateShaftTorsionalStress(T_Nmm, d_standard);
        const sigma_vonmises = calculateVonMisesStress(sigma_bending, tau_torsion);
        
        // 11. Thiết kế then (Keyway)
        const ketway = designKeyway(d_standard, T);
        
        // 12. Bearing positions (sơ bộ)
        const bearingPositions = {
            bearing_1: {
                position: "Near motor input",
                location_mm: 30,
                diameter_required_mm: Math.round(d_standard - 2)
            },
            bearing_2: {
                position: "Near gear output",
                location_mm: 120,
                diameter_required_mm: Math.round(d_standard - 2)
            }
        };
        
        // 13. Kiểm tra ứng suất
        const stressCheck = {
            bending_stress: {
                calculated: sigma_bending,
                calculated_with_load_factor: parseFloat((sigma_bending * K_load).toFixed(2)),
                allowable: sigma_allow,
                ratio: (sigma_bending / sigma_allow).toFixed(3),
                ratio_with_load_factor: ((sigma_bending * K_load) / sigma_allow).toFixed(3),
                status: sigma_bending <= sigma_allow ? "✓ SAFE" : "✗ EXCEED",
                status_with_load_factor: (sigma_bending * K_load) <= sigma_allow ? "✓ SAFE" : "✗ EXCEED",
                load_factor: K_load
            },
            torsional_stress: {
                calculated: tau_torsion,
                calculated_with_load_factor: parseFloat((tau_torsion * K_load).toFixed(2)),
                allowable: tau_allow,
                ratio: (tau_torsion / tau_allow).toFixed(3),
                ratio_with_load_factor: ((tau_torsion * K_load) / tau_allow).toFixed(3),
                status: tau_torsion <= tau_allow ? "✓ SAFE" : "✗ EXCEED",
                status_with_load_factor: (tau_torsion * K_load) <= tau_allow ? "✓ SAFE" : "✗ EXCEED",
                load_factor: K_load
            },
            vonmises_stress: {
                calculated: sigma_vonmises,
                calculated_with_load_factor: parseFloat((sigma_vonmises * K_load).toFixed(2)),
                allowable: sigma_allow,
                ratio: (sigma_vonmises / sigma_allow).toFixed(3),
                ratio_with_load_factor: ((sigma_vonmises * K_load) / sigma_allow).toFixed(3),
                status: sigma_vonmises <= sigma_allow ? "✓ SAFE" : "✗ EXCEED",
                status_with_load_factor: (sigma_vonmises * K_load) <= sigma_allow ? "✓ SAFE" : "✗ EXCEED",
                load_factor: K_load
            }
        };
        
        return {
            // Input
            input_torque_Nm: T,
            bending_moment_x_Nm: Mx,
            bending_moment_y_Nm: My,
            total_bending_moment_Nm: parseFloat(M_total.toFixed(2)),
            
            // Material
            material: materialName,
            material_properties: {
                sigma_b: material.sigma_b,
                sigma_allow: sigma_allow,
                tau_allow: tau_allow,
                E: material.E
            },
            
            // Diameter calculation
            d_from_torque_mm: parseFloat(d_from_torque.toFixed(2)),
            d_from_bending_mm: parseFloat(d_from_bending.toFixed(2)),
            d_with_concentration_mm: parseFloat(d_min.toFixed(2)),
            d_standard_mm: d_standard,
            
            // Keyway design
            keyway: ketway,
            
            // Bearing positions
            bearing_positions: bearingPositions,
            
            // Stress verification
            stress_analysis: stressCheck,
            
            // Summary
            overall_status: (
                stressCheck.bending_stress.status === "✓ SAFE" &&
                stressCheck.torsional_stress.status === "✓ SAFE" &&
                stressCheck.vonmises_stress.status === "✓ SAFE"
            ) ? "✓ PASS" : "✗ FAIL",
            
            recommendations: [
                `Đường kính: ${d_standard} mm (${materialName})`,
                `Ứng suất Von Mises: ${sigma_vonmises} MPa (cho phép: ${sigma_allow} MPa)`,
                `Hệ số an toàn: ${(sigma_allow / sigma_vonmises).toFixed(2)}`,
                `Then: ${ketway.type} (${ketway.width} × ${ketway.height} × ${ketway.length} mm)`,
                `Ổ lăn: Khoảng ${bearingPositions.bearing_1.diameter_required_mm} mm bore diameter`
            ]
        };
    } catch (error) {
        console.error("❌ Lỗi Shaft Calculation:", error.message);
        throw error;
    }
};

/**
 * Thiết kế then (Keyway) theo tiêu chuẩn DIN
 */
const designKeyway = (d_shaft, T_Nm) => {
    // Bảng DIN standard keyway sizes
    const keyways = [
        { d_range: [6, 8], w: 2, h: 2, length_min: 4 },
        { d_range: [8, 10], w: 3, h: 3, length_min: 4 },
        { d_range: [10, 12], w: 4, h: 4, length_min: 5 },
        { d_range: [12, 17], w: 5, h: 5, length_min: 5 },
        { d_range: [17, 22], w: 6, h: 6, length_min: 8 },
        { d_range: [22, 30], w: 8, h: 7, length_min: 8 },
        { d_range: [30, 38], w: 10, h: 8, length_min: 10 },
        { d_range: [38, 44], w: 12, h: 8, length_min: 10 },
        { d_range: [44, 50], w: 14, h: 9, length_min: 12 }
    ];
    
    const kw = keyways.find(k => d_shaft >= k.d_range[0] && d_shaft < k.d_range[1]);
    
    if (!kw) {
        throw new Error("Shaft diameter cần phải nằm trong khoảng 6-50mm");
    }
    
    // Tính chiều dài then dựa vào moment
    // T = τ × A × r  =>  l = T / (τ × A × r)
    // A = w × h, r ≈ d/2
    const tau_key = 120;  // MPa (allow stress for keyway)
    const A_key = kw.w * kw.h;
    const r = d_shaft / 2;
    const l_required = (T_Nm * 1000) / (tau_key * A_key * r);
    const l_actual = Math.max(Math.ceil(l_required), kw.length_min) + 5;  // +5mm margin
    
    return {
        type: "DIN Standard Keyway",
        width: kw.w,
        height: kw.h,
        length: l_actual,
        material: "Steel",
        status: "✓ OK"
    };
};

module.exports = { calculateShaft };
