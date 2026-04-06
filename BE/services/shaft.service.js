/**
 * File: services/shaft.service.js
 * Nhiệm vụ: Tính toán sơ bộ đường kính trục
 */

const calculateShaftPreliminary = (shaftData) => {
    // torque_Nm: Mô-men xoắn trên trục (Từ bước 1 hoặc bước 2 truyền sang)
    // tauAllowable: Ứng suất xoắn cho phép của vật liệu (Thép C45 thường lấy 15 - 20 MPa)
    const { torque_Nm, tauAllowable = 15 } = shaftData;

    if (!torque_Nm) {
        throw new Error("Thiếu Mô-men xoắn (Torque) để tính toán trục.");
    }

    // Đổi Mô-men từ N.m sang N.mm
    const T_Nmm = torque_Nm * 1000;

    // Tính đường kính sơ bộ d
    const d_raw = Math.cbrt(T_Nmm / (0.2 * tauAllowable));

    // Làm tròn đường kính theo tiêu chuẩn (chia hết cho 5, ví dụ: 22 -> 25, 33 -> 35)
    // Thực tế ngõng trục lắp ổ lăn bắt buộc phải là bội số của 5 (d = 20, 25, 30, 35...)
    let d_standard = Math.ceil(d_raw / 5) * 5;
    
    // Đường kính trục tối thiểu trong hộp giảm tốc thường không nhỏ hơn 15mm
    if (d_standard < 15) d_standard = 15;

    return {
        d_raw: Number(d_raw.toFixed(2)),
        d_standard: d_standard,
        tau_used: tauAllowable,
        material_hint: "Dựa trên Thép C45, thường hóa"
    };
};

module.exports = {
    calculateShaftPreliminary
};