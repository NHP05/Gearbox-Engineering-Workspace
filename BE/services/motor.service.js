// Giả lập model DB để tra cứu
const db = require('../models/motor.model'); 

const calculateMotor = async (P_ct, n_ct, efficiencies) => {
    try {
        // 1. Tính hiệu suất chung: η = η_đai * η_bánh_răng * η_ổ_lăn 
        const eta_total = efficiencies.belt * efficiencies.gear * efficiencies.bearing;

        // 2. Tính công suất cần thiết của động cơ [cite: 95, 155]
        const P_req = P_ct / eta_total;

        // 3. Tra bảng CSDL để tìm Động cơ thỏa mãn P_motor >= P_req [cite: 97]
        // Câu lệnh SQL tương đương: SELECT * FROM motors WHERE power_kw >= P_req ORDER BY power_kw ASC LIMIT 1
        const suggestedMotor = await db.findSuitableMotor(P_req);

        if (!suggestedMotor) {
            throw new Error("Không tìm thấy động cơ phù hợp với công suất này!");
        }

        // 4. Tính Tỷ số truyền tổng i (hoặc u_chung) [cite: 99, 155]
        const u_total = suggestedMotor.speed_rpm / n_ct;

        // Trả kết quả về cho Controller
        return {
            eta_total: eta_total.toFixed(4), // Độ chính xác 4 chữ số thập phân [cite: 123]
            required_power: P_req.toFixed(4),
            suggested_motor: suggestedMotor,
            total_ratio_u: u_total.toFixed(4)
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    calculateMotor
};