const motorService = require('../services/motor.service');
const beltService = require('../services/belt.service');
const gearService = require('../services/gear.service');
const shaftService = require('../services/shaft.service');

const parsePositiveNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// Bước 1: Tính Động Cơ
// THÊM CHỮ async VÀO ĐÂY
const calcMotor = async (req, res) => {
    try {
        const { power, speed, loadType, life, efficiencies } = req.body;

        if (!power || power <= 0) {
            return res.status(400).json({ success: false, message: "Thiếu hoặc sai giá trị power" });
        }
        if (!speed || speed <= 0) {
            return res.status(400).json({ success: false, message: "Thiếu hoặc sai giá trị speed" });
        }

        const result = await motorService.calculateMotor(power, speed, efficiencies);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 2: Tính Bộ truyền đai
const calcBelt = async (req, res) => {
    try {
        const { uBelt, ratio, d1, power, n1, speed } = req.body;
        const normalizedPower = parsePositiveNumber(power);
        const normalizedSpeed = parsePositiveNumber(n1 ?? speed);
        const normalizedRatio = parsePositiveNumber(uBelt ?? ratio) || 3;
        const normalizedD1 = parsePositiveNumber(d1);

        if (!normalizedPower) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc sai giá trị power' });
        }

        if (!normalizedSpeed) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc sai giá trị tốc độ n1/speed' });
        }

        // Gọi service theo đúng thứ tự tham số: power, speed, ratio
        const result = await beltService.calculateBeltDrive(
            normalizedPower,
            normalizedSpeed,
            normalizedRatio,
            { d1: normalizedD1 }
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 3: Tính Bánh răng Côn (Cấp Nhanh)
const calcBevelGear = async (req, res) => {
    try {
        const { T1, u1, materialName } = req.body; 
        const result = await gearService.calculateBevelGear(T1, u1, materialName);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
// Bước 4: Tính Bánh răng Trụ (Cấp Chậm)
const calcSpurGear = async (req, res) => {
    try {
        const { T2, u2, materialName } = req.body;
        const result = await gearService.calculateSpurGear(T2, u2, materialName);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 5: Tính Trục sơ bộ
const calcShaft = async (req, res) => {
    try {
        const { T, torque, Mx, momentX, My, momentY, materialName } = req.body;
        const torqueValue = parsePositiveNumber(T ?? torque);
        const mxValue = parsePositiveNumber(Mx ?? momentX) || 300;
        const myValue = parsePositiveNumber(My ?? momentY) || 250;

        if (!torqueValue) {
            return res.status(400).json({ success: false, message: 'Thiếu hoặc sai giá trị mô-men xoắn T/torque' });
        }

        const result = await shaftService.calculateShaft(torqueValue, mxValue, myValue, materialName);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    calcMotor,
    calcBelt,
    calcBevelGear,
    calcSpurGear,
    calcShaft
};