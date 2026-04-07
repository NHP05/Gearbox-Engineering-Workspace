const motorService = require('../services/motor.service');

const getMotorcalculate = async (req, res) => {
    try {
        // Lấy dữ liệu người dùng nhập từ Frontend (req.body) [cite: 94]
        const { P_ct, n_ct, efficiencies } = req.body;

        // Validate cơ bản
        if (!P_ct || P_ct <= 0) {
            return res.status(400).json({ message: "Công suất P_ct phải lớn hơn 0" });
        }

        // Gọi Lõi tính toán
        const result = await motorService.calculateMotor(P_ct, n_ct, efficiencies);

        // Trả về UI
        return res.status(200).json({
            status: "success",
            data: result
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message
        });
    }
};

module.exports = {
    getMotorcalculate
};