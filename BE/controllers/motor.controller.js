const motorService = require('../services/motor.service');

const getMotorcalculate = async (req, res) => {
    try {
        // Lấy dữ liệu người dùng nhập từ Frontend (req.body)
        const { power, speed, loadType, life } = req.body;

        // Validate cơ bản
        if (!power || power <= 0) {
            return res.status(400).json({ message: "Công suất (power) phải lớn hơn 0 kW" });
        }
        
        if (!speed || speed <= 0) {
            return res.status(400).json({ message: "Tốc độ (speed) phải lớn hơn 0 RPM" });
        }

        // Gọi Lõi tính toán (map tên cho service)
        const result = await motorService.calculateMotor(power, speed, { loadType, life });

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