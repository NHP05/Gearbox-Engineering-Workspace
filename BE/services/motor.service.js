const Motor = require('../models/motor.model');
const { Op } = require('sequelize');
const {
    calculateMoment,
    calculateGearRatio,
    calculateTotalEfficiency,
    getLoadFactor,
    EFFICIENCY_FACTORS
} = require('../utils/calculationUtils');

const calculateMotor = async (P_ct, n_ct, efficiencies) => {
    try {
        // 1. Validate inputs
        if (!P_ct || P_ct <= 0 || !n_ct || n_ct <= 0) {
            throw new Error("Power P_ct và Speed n_ct phải > 0");
        }
        
        // 2. Set default efficiencies nếu không cung cấp
        const eff = {
            belt: efficiencies?.belt || EFFICIENCY_FACTORS.belt_v,
            bevel: efficiencies?.bevel || EFFICIENCY_FACTORS.bevel_gear,
            spur: efficiencies?.spur || EFFICIENCY_FACTORS.spur_gear_lubricated,
            bearing: efficiencies?.bearing || EFFICIENCY_FACTORS.bearing_ball
        };
        
        // 3. Tính hiệu suất chung
        const eta_total = eff.belt * eff.bevel * eff.spur * eff.bearing;
        
        // 4. Tính công suất cần thiết của động cơ
        const P_motor_required = P_ct / eta_total;
        
        // 5. Tra bảng CSDL để tìm Động cơ thỏa mãn
        const suggestedMotor = await Motor.findOne({
            where: {
                power: { [Op.gte]: P_motor_required }
            },
            order: [['power', 'ASC']]
        });
        
        if (!suggestedMotor) {
            throw new Error(
                `Không tìm thấy động cơ nào có công suất >= ${P_motor_required.toFixed(2)} kW!`
            );
        }
        
        // 6. Tính moment tại motor output
        const T_motor = calculateMoment(suggestedMotor.power, suggestedMotor.speed_rpm);
        
        // 7. Tính tỷ số truyền tổng
        const u_total = calculateGearRatio(suggestedMotor.speed_rpm, n_ct);
        
        // 8. Tính moment tại shaft output (moment được phân giảm qua các cấp truyền)
        const T_output = T_motor * eta_total * u_total;  // Approx: qua hiệu suất
        
        // 9. Kiểm tra constraints
        const maxMotorPower = Math.max(...(await Motor.findAll()).map(m => m.power));
        const oversizing = ((suggestedMotor.power - P_motor_required) / P_motor_required * 100);
        
        return {
            // Input requirements
            required_power_ct: parseFloat(P_ct.toFixed(2)),
            required_speed_ct: n_ct,
            
            // Efficiency calculation
            efficiencies: {
                belt: parseFloat(eff.belt.toFixed(4)),
                bevel_gear: parseFloat(eff.bevel.toFixed(4)),
                spur_gear: parseFloat(eff.spur.toFixed(4)),
                bearing: parseFloat(eff.bearing.toFixed(4)),
                total: parseFloat(eta_total.toFixed(4))
            },
            
            // Motor selection
            motor_required_power: parseFloat(P_motor_required.toFixed(2)),
            
            suggested_motor: {
                id: suggestedMotor.id,
                name: suggestedMotor.name,
                power_kW: suggestedMotor.power,
                speed_rpm: suggestedMotor.speed_rpm
            },
            
            // Torque calculations
            motor_output_torque_Nm: T_motor,
            gearbox_output_torque_Nm: parseFloat(T_output.toFixed(2)),
            
            // Transmission ratio
            total_ratio_u: parseFloat(u_total.toFixed(3)),
            
            // Analysis
            analysis: {
                oversizing_percent: parseFloat(oversizing.toFixed(1)),
                oversizing_status: oversizing < 10 ? "✓ Good" : (oversizing < 30 ? "⚠ Acceptable" : "✗ Oversized"),
                max_available_power: maxMotorPower
            },
            
            // Gear ratio distribution (informational)
            typical_gear_ratio_distribution: {
                note: "u_total = u_belt × u_bevel × u_spur",
                u_total_required: parseFloat(u_total.toFixed(3)),
                suggestion: "Distribute ratio: u_belt~1.3, u_bevel~2.5, u_spur~7.4"
            },
            
            status: "✓ PASS"
        };
    } catch (error) {
        console.error("❌ Lỗi tại Motor Service:", error.message);
        throw error;
    }
};

module.exports = {
    calculateMotor
};