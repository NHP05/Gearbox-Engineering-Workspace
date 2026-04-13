const motorService = require('../services/motor.service');
const beltService = require('../services/belt.service');
const gearService = require('../services/gear.service');
const shaftService = require('../services/shaft.service');
const { calculateMoment, getLoadFactor, getLifeFactor } = require('../utils/calculationUtils');

/**
 * Step 1: Tính động cơ và phân bố tỷ số truyền
 */
const calcMotor = async (req, res) => {
    try {
        const { power, speed, loadType, life, efficiencies } = req.body;

        // Validate
        if (!power || power <= 0) {
            return res.status(400).json({ success: false, message: "Thiếu hoặc sai giá trị power" });
        }
        if (!speed || speed <= 0) {
            return res.status(400).json({ success: false, message: "Thiếu hoặc sai giá trị speed" });
        }

        // Tính toán
        const result = await motorService.calculateMotor(power, speed, efficiencies || {});
        
        // Thêm load factor và life factor
        result.load_factor = getLoadFactor(loadType);
        result.life_factor = getLifeFactor((life || 9) * 4800);  // 9 years × 8 hours/day × 300 days/year
        
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Step 2: Tính bộ truyền đai
 */
const calcBelt = async (req, res) => {
    try {
        const { power, n_motor, u_belt } = req.body;
        
        if (!power || power <= 0 || !n_motor || n_motor <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai: power, n_motor" 
            });
        }
        
        const result = await beltService.calculateBeltDrive(power, n_motor, u_belt || 1.3);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Step 3: Tính bánh răng côn (Cấp nhanh/Quick Stage)
 */
const calcBevelGear = async (req, res) => {
    try {
        const { T1, u1, materialName, loadType, life_years } = req.body;
        
        if (!T1 || T1 <= 0 || !u1 || u1 <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai: T1 (moment), u1 (ratio)" 
            });
        }
        
        const K_load = getLoadFactor(loadType);
        const phi_d = getLifeFactor((life_years || 9) * 4800);
        
        const result = await gearService.calculateBevelGear(
            T1, 
            u1, 
            materialName || "20CrMnTi",
            K_load,
            phi_d
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error in calcBevelGear:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Step 4: Tính bánh răng trụ (Cấp chậm/Slow Stage)
 */
const calcSpurGear = async (req, res) => {
    try {
        const { T2, u2, materialName, loadType, life_years } = req.body;
        
        if (!T2 || T2 <= 0 || !u2 || u2 <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu hoặc sai: T2 (moment), u2 (ratio)" 
            });
        }
        
        const K_load = getLoadFactor(loadType);
        const phi_d = getLifeFactor((life_years || 9) * 4800);
        
        const result = await gearService.calculateSpurGear(
            T2, 
            u2, 
            materialName || "20CrMnTi",
            K_load,
            phi_d
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error in calcSpurGear:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Step 5: Tính thiết kế trục
 */
const calcShaft = async (req, res) => {
    try {
        const { T, Mx, My, materialName, loadType, life_years } = req.body;
        
        if (!T || T <= 0 || !Mx || !My) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu: T (moment), Mx, My (bending moments)" 
            });
        }
        
        const K_load = getLoadFactor(loadType);
        const phi_d = getLifeFactor((life_years || 9) * 4800);
        
        const result = await shaftService.calculateShaft(
            T, 
            Mx, 
            My, 
            materialName || "C45",
            K_load,
            phi_d
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error("Error in calcShaft:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Integrated calculation: Từ công suất input → toàn bộ gearbox design
 * POST /api/v1/calculate/full
 */
const calcFullGearbox = async (req, res) => {
    try {
        const { power_ct, speed_ct, loadType = "light_shock_2shift", life_years = 9, u_belt, u_bevel, u_spur } = req.body;
        
        // Validate basic inputs
        if (!power_ct || power_ct <= 0 || !speed_ct || speed_ct <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu: power_ct, speed_ct" 
            });
        }
        
        // Get load and life factors
        const K_load = getLoadFactor(loadType);
        const phi_d = getLifeFactor(life_years * 4800);
        
        // Step 1: Motor calculation
        const motorResult = await motorService.calculateMotor(power_ct, speed_ct, {});
        const motor = motorResult.suggested_motor;
        const n_motor = motor.speed_rpm;
        
        // Calculate T_motor
        const T_motor = calculateMoment(motor.power, n_motor);
        
        // Step 2: Belt drive (nếu u_belt được cung cấp)
        let beltResult = null;
        if (u_belt) {
            beltResult = await beltService.calculateBeltDrive(motor.power, n_motor, u_belt);
        }
        
        // Step 3: Bevel gear (nếu u_bevel được cung cấp)
        let bevelResult = null;
        if (u_bevel) {
            bevelResult = await gearService.calculateBevelGear(T_motor, u_bevel, "20CrMnTi", K_load, phi_d);
            var T_after_bevel = T_motor / u_bevel;  // Moment sau bevel stage
        }
        
        // Step 4: Spur gear (nếu u_spur được cung cấp)
        let spurResult = null;
        if (u_spur && bevelResult) {
            spurResult = await gearService.calculateSpurGear(T_after_bevel, u_spur, "20CrMnTi", K_load, phi_d);
            var T_output = T_after_bevel / u_spur;
        } else {
            T_output = T_motor;  // Fallback
        }
        
        // Step 5: Shaft design (output shaft)
        // Giả định bending moments từ gear forces
        const Mx = T_output / 10;  // Rough estimation
        const My = T_output / 15;
        let shaftResult = null;
        if (spurResult) {
            shaftResult = await shaftService.calculateShaft(T_output, Mx, My, "C45", K_load, phi_d);
        }

        // Tính verification
        const u_total_calculated = (u_belt || 1) * (u_bevel || 1) * (u_spur || 1);
        const u_total_required = n_motor / speed_ct;
        const u_error = Math.abs(u_total_calculated - u_total_required) / u_total_required * 100;
        
        return res.status(200).json({ 
            success: true, 
            data: {
                design_parameters: {
                    load_type: loadType,
                    load_factor: K_load,
                    life_years: life_years,
                    life_factor: phi_d
                },
                
                summary: {
                    motor: motorResult,
                    belt: beltResult,
                    bevel_gear: bevelResult,
                    spur_gear: spurResult,
                    shaft: shaftResult
                },
                
                verification: {
                    u_total_required: parseFloat(u_total_required.toFixed(3)),
                    u_total_calculated: parseFloat(u_total_calculated.toFixed(3)),
                    u_error_percent: parseFloat(u_error.toFixed(2)),
                    status: u_error < 5 ? "✓ PASS" : "⚠ CHECK"
                },
                
                overall_status: "✓ DESIGN COMPLETE"
            }
        });
    } catch (error) {
        console.error("Error in calcFullGearbox:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    calcMotor,
    calcBelt,
    calcBevelGear,
    calcSpurGear,
    calcShaft,
    calcFullGearbox
};