/**
 * CALCULATION UTILITIES FOR GEARBOX DESIGN
 * Chứa các hàm tính toán cơ bản được dùng chung
 */

/**
 * Tính moment xoắn từ công suất và tốc độ
 * T = 9550 × P / n  (T in N·m, P in kW, n in RPM)
 */
const calculateMoment = (power_kW, speed_RPM) => {
    if (speed_RPM <= 0 || power_kW <= 0) {
        throw new Error("Power và Speed phải > 0");
    }
    const T = 9550 * power_kW / speed_RPM;
    return parseFloat(T.toFixed(2));
};

/**
 * Tính tỷ số truyền từ tốc độ vào và ra
 * u = n_input / n_output
 */
const calculateGearRatio = (n_input, n_output) => {
    if (n_output <= 0) {
        throw new Error("Output speed phải > 0");
    }
    const u = n_input / n_output;
    return parseFloat(u.toFixed(4));
};

/**
 * Tính hiệu suất chung từ các hiệu suất thành phần
 * η_total = η_belt × η_bevel × η_spur × η_bearing
 */
const calculateTotalEfficiency = (eta_belt = 0.96, eta_bevel = 0.92, eta_spur = 0.96, eta_bearing = 0.99) => {
    const eta = eta_belt * eta_bevel * eta_spur * eta_bearing;
    if (eta <= 0 || eta > 1) {
        throw new Error("Efficiency không hợp lệ");
    }
    return parseFloat(eta.toFixed(4));
};

/**
 * Standardize diameter/distance to nearest 5mm (common in design)
 */
const standardizeSize = (value, step = 5) => {
    return Math.ceil(value / step) * step;
};

/**
 * Tính ứng suất tiếp xúc σH (contact stress)
 * σH = √[T1×KHbeta / (aw² × b × u2 / (u2+1) × Ka)]
 * Simplified formula for quick calculation
 */
const calculateContactStress = (T1_Nmm, aw, b, material_sigmaH_limit) => {
    if (!T1_Nmm || !aw || !b) {
        throw new Error("Thiếu input cho contact stress calculation");
    }
    
    // Simplified contact stress calculation
    const Ka = 43; // Coefficient for spur gears
    const KHbeta = 1.1; // Load distribution factor
    
    const sigmaH = Math.sqrt((T1_Nmm * KHbeta) / (aw * aw * b * Ka));
    
    return {
        calculated: parseFloat(sigmaH.toFixed(2)),
        allowable: material_sigmaH_limit,
        ratio: parseFloat((sigmaH / material_sigmaH_limit).toFixed(3)),
        status: sigmaH <= material_sigmaH_limit ? "SAFE" : "EXCEED",
        safety_margin: parseFloat(((material_sigmaH_limit - sigmaH) / material_sigmaH_limit * 100).toFixed(2)) + "%"
    };
};

/**
 * Tính ứng suất uốn σF (bending stress)
 * σF = T2 / (m × b × Y_F × z)
 * Simplified formula
 */
const calculateBendingStress = (T2_Nmm, m, b, z, material_sigmaF_limit) => {
    if (!T2_Nmm || !m || !b || !z) {
        throw new Error("Thiếu input cho bending stress calculation");
    }
    
    // Simplified bending stress (Lewis formula)
    const Y_F = 0.3; // Form factor (approximate)
    const Ka = 43;
    
    const sigmaF = T2_Nmm / (m * b * Y_F * z * Ka);
    
    return {
        calculated: parseFloat(sigmaF.toFixed(2)),
        allowable: material_sigmaF_limit,
        ratio: parseFloat((sigmaF / material_sigmaF_limit).toFixed(3)),
        status: sigmaF <= material_sigmaF_limit ? "SAFE" : "EXCEED",
        safety_margin: parseFloat(((material_sigmaF_limit - sigmaF) / material_sigmaF_limit * 100).toFixed(2)) + "%"
    };
};

/**
 * Tính ứng suất Von Mises cho trục
 * σ_eq = √(σ_bending² + 3×τ_torsion²)
 */
const calculateVonMisesStress = (sigma_bending, tau_torsion) => {
    if (sigma_bending < 0 || tau_torsion < 0) {
        throw new Error("Stresses không được âm");
    }
    
    const sigmaEq = Math.sqrt(Math.pow(sigma_bending, 2) + 3 * Math.pow(tau_torsion, 2));
    return parseFloat(sigmaEq.toFixed(2));
};

/**
 * Tính ứng suất uốn trong trục
 * σ = 32×M / (π×d³)  [M in N·mm, d in mm]
 */
const calculateShaftBendingStress = (M_Nmm, d_mm) => {
    if (!M_Nmm || !d_mm || d_mm <= 0) {
        throw new Error("Moment hoặc diameter không hợp lệ");
    }
    const sigma = (32 * M_Nmm) / (Math.PI * Math.pow(d_mm, 3));
    return parseFloat(sigma.toFixed(2));
};

/**
 * Tính ứng suất xoắn trong trục
 * τ = 16×T / (π×d³)  [T in N·mm, d in mm]
 */
const calculateShaftTorsionalStress = (T_Nmm, d_mm) => {
    if (!T_Nmm || !d_mm || d_mm <= 0) {
        throw new Error("Torque hoặc diameter không hợp lệ");
    }
    const tau = (16 * T_Nmm) / (Math.PI * Math.pow(d_mm, 3));
    return parseFloat(tau.toFixed(2));
};

/**
 * Tính đường kính trục tối thiểu từ moment xoắn
 * d ≥ ∛(16×T / (π×τ_allow))
 */
const calculateMinShaftDiameter = (T_Nmm, tau_allow) => {
    if (!T_Nmm || !tau_allow || tau_allow <= 0) {
        throw new Error("Torque hoặc allowable stress không hợp lệ");
    }
    const d_min = Math.pow((16 * T_Nmm) / (Math.PI * tau_allow), 1/3);
    return parseFloat(d_min.toFixed(2));
};

/**
 * Get load factor dựa vào chế độ tải
 * - "constant": K_load = 1.0
 * - "light_shock": K_load = 1.5
 * - "heavy_shock": K_load = 2.0
 */
const getLoadFactor = (loadType = "constant") => {
    const factors = {
        "constant": 1.0,
        "light_shock": 1.5,       // Đồ án: tải va đập nhẹ
        "heavy_shock": 2.0,
        "2_shift": 1.2,           // 2 ca làm việc
        "3_shift": 1.7            // 3 ca làm việc
    };
    return factors[loadType] || 1.0;
};

/**
 * Get life factor dựa vào thời gian phục vụ
 * φ_d = f(L in hours)
 * L = năm × 8760 (hoặc từ tính toán)
 */
const getLifeFactor = (life_hours) => {
    // Bảng tính sơ bộ
    if (life_hours <= 5000) return 0.85;
    if (life_hours <= 10000) return 0.90;
    if (life_hours <= 20000) return 0.95;
    if (life_hours <= 50000) return 1.0;
    if (life_hours <= 100000) return 1.1;
    return 1.2;  // > 100,000 hours
};

/**
 * Tính gear ratio constraints dựa vào tốc độ
 * u_belt × u_bevel × u_spur = u_total
 */
const analyzeGearRatioDistribution = (u_total, n_motor = 1450, n_output = 60) => {
    const u_calc = calculateGearRatio(n_motor, n_output);
    
    // Typical distribution:
    // u_belt: 1.2 - 1.5
    // u_bevel: 2 - 4 (quick stage)
    // u_spur: 3 - 6 (slow stage)
    
    return {
        u_total_required: parseFloat(u_calc.toFixed(3)),
        typical_ranges: {
            u_belt: "1.2 - 1.5",
            u_bevel: "2 - 4",
            u_spur: "3 - 6"
        },
        example_distribution: {
            u_belt: 1.3,
            u_bevel: 2.5,
            u_spur: 7.4
        },
        note: "u_total = u_belt × u_bevel × u_spur"
    };
};

/**
 * Tính số răng tiêu chuẩn cho bánh răng
 * z = m × l / cos(α)  (đơn giản)
 * z_min thường từ 17-20
 */
const calculateGearTeeth = (u, z_min = 17) => {
    // z2 = z1 × u
    // z_min ≥ 17 để tránh undercut
    const z1 = Math.ceil(z_min);
    const z2 = Math.ceil(z1 * u);
    
    return {
        z1: z1,
        z2: z2,
        actual_ratio: (z2 / z1).toFixed(3),
        error: parseFloat((Math.abs(z2/z1 - u) / u * 100).toFixed(2)) + "%"
    };
};

/**
 * Tính diameters của bánh răng
 * d = m × z (pitch diameter)
 */
const calculateGearDiameters = (m, z1, z2) => {
    const d1 = m * z1;
    const d2 = m * z2;
    const aw = (d1 + d2) / 2;  // Center distance
    
    return {
        d1: parseFloat(d1.toFixed(2)),
        d2: parseFloat(d2.toFixed(2)),
        center_distance_aw: parseFloat(aw.toFixed(2))
    };
};

/**
 * Tính chiều rộng vành răng
 * b = ψ_ba × aw
 * ψ_ba thường 0.3-0.5
 */
const calculateGearWidth = (aw, psi_ba = 0.3) => {
    const b = aw * psi_ba;
    return parseFloat(b.toFixed(2));
};

/**
 * Material properties database
 */
const MATERIAL_PROPERTIES = {
    "C45": {
        name: "C45 (Steel)",
        sigma_b: 540,     // MPa
        sigma_allow: 200,  // σ_b / 2.7
        tau_allow: 120,    // τ = 0.5-0.6 × σ_allow
        E: 210000,         // GPa (Young's modulus)
        density: 7850      // kg/m³
    },
    "40Cr": {
        name: "40Cr (Chrome Steel)",
        sigma_b: 990,
        sigma_allow: 320,
        tau_allow: 180,
        E: 210000,
        density: 7850
    },
    "20CrMnTi": {
        name: "20CrMnTi (Carburized)",
        sigma_h_lim: 1500,  // Contact stress limit
        sigma_f_lim: 600,   // Bending stress limit
        sigma_allow: 400,
        tau_allow: 220,
        E: 210000,
        density: 7830
    },
    "GGG60": {
        name: "GGG60 (Ductile Iron)",
        sigma_b: 600,
        sigma_allow: 200,
        tau_allow: 100,
        E: 170000,
        density: 7050
    }
};

/**
 * Efficiency factors dựa vào loại truyền động
 */
const EFFICIENCY_FACTORS = {
    belt_v: 0.96,           // V-belt
    belt_timing: 0.98,      // Timing belt
    bevel_gear: 0.92,       // Bevel gear (both direction)
    spur_gear_lubricated: 0.96,
    spur_gear_dry: 0.85,
    bearing_ball: 0.99,
    bearing_roller: 0.98,
    coupling_elastic: 0.99
};

module.exports = {
    // Basic calculations
    calculateMoment,
    calculateGearRatio,
    calculateTotalEfficiency,
    standardizeSize,
    
    // Stress calculations
    calculateContactStress,
    calculateBendingStress,
    calculateVonMisesStress,
    calculateShaftBendingStress,
    calculateShaftTorsionalStress,
    calculateMinShaftDiameter,
    
    // Factors
    getLoadFactor,
    getLifeFactor,
    
    // Gear calculations
    analyzeGearRatioDistribution,
    calculateGearTeeth,
    calculateGearDiameters,
    calculateGearWidth,
    
    // Material & efficiency
    MATERIAL_PROPERTIES,
    EFFICIENCY_FACTORS
};
