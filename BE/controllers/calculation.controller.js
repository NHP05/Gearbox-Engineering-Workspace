const motorService = require('../services/motor.service');
const beltService = require('../services/belt.service');
const gearService = require('../services/gear.service');
const shaftService = require('../services/shaft.service');

// Bước 1: Tính Động Cơ
const calcMotor = (req, res) => {
    try {
        const { F, v, etaSystem, nCT } = req.body;
        if (!F || !v) return res.status(400).json({ success: false, message: "Thiếu lực F hoặc vận tốc v" });

        const result = motorService.calculateMotor(F, v, etaSystem, nCT);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 2: Tính Bộ truyền đai
const calcBelt = (req, res) => {
    try {
        const { uBelt, d1, power, n1 } = req.body;
        const result = beltService.calculateBeltDrive(uBelt, d1, power, n1);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 3: Tính Bánh răng Côn (Cấp Nhanh)
const calcBevelGear = (req, res) => {
    try {
        const { T1, u1, sigmaH, K_Hbeta, K_be } = req.body;
        const result = gearService.calculateBevelGear(T1, u1, sigmaH, K_Hbeta, K_be);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 4: Tính Bánh răng Trụ (Cấp Chậm)
const calcSpurGear = (req, res) => {
    try {
        const { T2, u2, sigmaH, K_Hbeta, psi_ba } = req.body;
        const result = gearService.calculateSpurGear(T2, u2, sigmaH, K_Hbeta, psi_ba);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Bước 5: Tính Trục sơ bộ
const calcShaft = (req, res) => {
    try {
        const { T, tauAllow, Mx, My, aw } = req.body;
        const result = shaftService.calculateShaft(T, tauAllow, Mx, My, aw);
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