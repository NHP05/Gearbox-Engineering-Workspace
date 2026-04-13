const Motor = require('../models/motor.model'); // Đổi tên từ db thành Motor cho đúng bản chất
const { Op } = require('sequelize'); // CỰC KỲ QUAN TRỌNG: Để dùng được phép so sánh >=

const DEFAULT_EFFICIENCIES = {
    belt: 0.95,
    gear: 0.97,
    bearing: 0.99,
};

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const calculateMotor = async (P_ct, n_ct, efficiencies) => {
    try {
        const power = toPositiveNumber(P_ct, 1);
        const speed = toPositiveNumber(n_ct, 1450);
        const safeEfficiencies = {
            belt: toPositiveNumber(efficiencies?.belt, DEFAULT_EFFICIENCIES.belt),
            gear: toPositiveNumber(efficiencies?.gear, DEFAULT_EFFICIENCIES.gear),
            bearing: toPositiveNumber(efficiencies?.bearing, DEFAULT_EFFICIENCIES.bearing),
        };

        // 1. Tính hiệu suất chung: η = η_đai * η_bánh_răng * η_ổ_lăn 
        // Lưu ý: efficiencies phải có đủ các key: belt, gear, bearing
        const eta_total = safeEfficiencies.belt * safeEfficiencies.gear * safeEfficiencies.bearing;

        // 2. Tính công suất cần thiết của động cơ
        const P_req = power / eta_total;

        // 3. Tra bảng CSDL để tìm Động cơ thỏa mãn P_motor >= P_req
        // Dùng Motor.findOne vì biến Motor ở trên đã là Model rồi
        let suggestedMotor = await Motor.findOne({
            where: {
                power: { [Op.gte]: P_req } // Tìm motor có công suất >= P_req
            },
            order: [['power', 'ASC']] // Lấy cái nhỏ nhất trong số những cái thỏa mãn (tối ưu kinh tế)
        });

        if (!suggestedMotor) {
            suggestedMotor = {
                id: 0,
                name: `Fallback Motor ${Math.max(2, Math.ceil(P_req))}kW`,
                power: Math.max(2, Math.ceil(P_req)),
                speed_rpm: speed,
            };
        }

        // 4. Tính Tỷ số truyền tổng u_chung
        const motorSpeed = toPositiveNumber(suggestedMotor.speed_rpm, speed);
        const u_total = motorSpeed / speed;

        // Trả kết quả về cho Controller
        return {
            eta_total: parseFloat(eta_total.toFixed(4)),
            required_power: parseFloat(P_req.toFixed(4)),
            suggested_motor: suggestedMotor,
            total_ratio_u: parseFloat(u_total.toFixed(4))
        };
    } catch (error) {
        console.error("❌ Lỗi tại Motor Service:", error.message);
        throw error;
    }
};

module.exports = {
    calculateMotor
};