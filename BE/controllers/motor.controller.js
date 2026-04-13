const motorService = require('../services/motor.service');
const Motor = require('../models/motor.model');
const { mockMotors } = require('../utils/mockData');

const SKIP_DB = process.env.SKIP_DB === 'true';

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

const getMotorCatalog = async (req, res) => {
    try {
        if (SKIP_DB) {
            const fallback = mockMotors.map((item, index) => ({
                id: item.id || index + 1,
                model: item.name || `MOTOR-${index + 1}`,
                power: Number(item.power || item.power_kw || 0) || (index + 2) * 2,
                speed: Number(item.speed || item.speed_rpm || 1450),
                efficiency: Number(item.efficiency || 90),
                series: 'Mock Series',
                frame: 'N/A',
                weight: Number(item.weight || 100),
            }));
            return res.status(200).json({ success: true, data: fallback });
        }

        const rows = await Motor.findAll({
            order: [['power', 'ASC'], ['speed_rpm', 'ASC']],
            raw: true,
        });

        const data = rows.map((item, index) => ({
            id: item.id,
            model: item.name,
            power: Number(item.power || 0),
            speed: Number(item.speed_rpm || 0),
            efficiency: Number(item.efficiency || 90),
            series: `Power ${Number(item.power || 0).toFixed(1)}kW`,
            frame: item.frame || `M-${index + 1}`,
            weight: Number(item.weight || 100),
        }));

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMotorcalculate,
    getMotorCatalog,
};