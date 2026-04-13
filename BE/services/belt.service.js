const Belt = require('../models/belt.model');

const BELT_FALLBACK = {
    A: { d1_min: 75 },
    B: { d1_min: 120 },
    C: { d1_min: 200 },
    D: { d1_min: 315 },
    E: { d1_min: 400 },
};

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const calculateBeltDrive = async (P_req, n_motor, u_belt, options = {}) => {
    const power = toPositiveNumber(P_req, 5.5);
    const motorSpeed = toPositiveNumber(n_motor, 1450);
    const ratio = toPositiveNumber(u_belt, 3);

    // 1. Chọn loại đai dựa trên công suất (Logic đơn giản hóa)
    let beltType = 'A';
    if (power > 5) beltType = 'B';
    if (power > 20) beltType = 'C';

    const beltInfo = await Belt.findByPk(beltType);
    const source = beltInfo || BELT_FALLBACK[beltType];

    if (!source || !source.d1_min) {
        throw new Error('Thiếu dữ liệu đai truyền (d1_min). Vui lòng seed bảng belts.');
    }

    // 2. Tính đường kính bánh đai nhỏ d1 (theo tiêu chuẩn)
    const d1Input = toPositiveNumber(options.d1, source.d1_min);
    const d1 = Math.max(d1Input, 1.2 * source.d1_min);

    // 3. Tính đường kính bánh đai lớn d2
    const d2 = d1 * ratio * (1 - 0.01); // 0.01 là hệ số trượt

    // 4. Tính khoảng cách trục sơ bộ a
    const a = 1.5 * (d1 + d2);

    return {
        belt_type: beltType,
        d1: Math.round(d1),
        d2: Math.round(d2),
        distance_a: Math.round(a),
        velocity: ((Math.PI * d1 * motorSpeed) / 60000).toFixed(2), // m/s
        input: {
            power,
            n_motor: motorSpeed,
            u_belt: ratio,
        },
    };
};

module.exports = { calculateBeltDrive };
