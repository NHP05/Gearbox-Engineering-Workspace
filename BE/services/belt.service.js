const Belt = require('../models/belt.model');

const calculateBelt = async (P_req, n_motor, u_belt) => {
    // 1. Chọn loại đai dựa trên công suất (Logic đơn giản hóa)
    let beltType = 'A';
    if (P_req > 5) beltType = 'B';
    if (P_req > 20) beltType = 'C';

    const beltInfo = await Belt.findByPk(beltType);

    // 2. Tính đường kính bánh đai nhỏ d1 (theo tiêu chuẩn)
    let d1 = 1.2 * beltInfo.d1_min; 
    
    // 3. Tính đường kính bánh đai lớn d2
    let d2 = d1 * u_belt * (1 - 0.01); // 0.01 là hệ số trượt

    // 4. Tính khoảng cách trục sơ bộ a
    let a = 1.5 * (d1 + d2);

    return {
        belt_type: beltType,
        d1: Math.round(d1),
        d2: Math.round(d2),
        distance_a: Math.round(a),
        velocity: ((Math.PI * d1 * n_motor) / 60000).toFixed(2) // m/s
    };
};

module.exports = { calculateBelt };
