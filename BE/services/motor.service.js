const Motor = require('../models/motor.model'); // Đổi tên từ db thành Motor cho đúng bản chất
const { Op } = require('sequelize'); // CỰC KỲ QUAN TRỌNG: Để dùng được phép so sánh >=

const calculateMotor = async (P_ct, n_ct, efficiencies) => {
    try {
        // 1. Tính hiệu suất chung: η = η_đai * η_bánh_răng * η_ổ_lăn 
        // Lưu ý: efficiencies phải có đủ các key: belt, gear, bearing
        const eta_total = efficiencies.belt * efficiencies.gear * efficiencies.bearing;

        // 2. Tính công suất cần thiết của động cơ
        const P_req = P_ct / eta_total;

        // 3. Tra bảng CSDL để tìm Động cơ thỏa mãn P_motor >= P_req
        // Dùng Motor.findOne vì biến Motor ở trên đã là Model rồi
        const suggestedMotor = await Motor.findOne({
            where: {
                power: { [Op.gte]: P_req } // Tìm motor có công suất >= P_req
            },
            order: [['power', 'ASC']] // Lấy cái nhỏ nhất trong số những cái thỏa mãn (tối ưu kinh tế)
        });

        if (!suggestedMotor) {
            throw new Error(`Không tìm thấy động cơ nào có công suất >= ${P_req.toFixed(2)} kW trong thư viện!`);
        }

        // 4. Tính Tỷ số truyền tổng u_chung
        const u_total = suggestedMotor.speed_rpm / n_ct;

        // 5. Bổ sung: Tính toán thông số động học cơ bản cho trục động cơ
        // Công thức tính Mô-men xoắn T = 9.55 * 10^6 * P / n (Đơn vị: N.mm)
        const T_motor = (9.55 * 1000000 * suggestedMotor.power) / suggestedMotor.speed_rpm;

        // Trả kết quả về cho Controller
        return {
            eta_total: parseFloat(eta_total.toFixed(4)),
            required_power: parseFloat(P_req.toFixed(4)),
            suggested_motor: suggestedMotor,
            total_ratio_u: parseFloat(u_total.toFixed(4)),
            // Gợi ý cấu trúc Bảng thông số động học trả về cho Frontend
            kinematic_table: {
                motor_shaft: {
                    power_kW: suggestedMotor.power,
                    speed_rpm: suggestedMotor.speed_rpm,
                    torque_Nmm: parseFloat(T_motor.toFixed(2))
                }
            }
        };
    } catch (error) {
        console.error("❌ Lỗi tại Motor Service:", error.message);
        throw error;
    }
};

module.exports = {
    calculateMotor
};