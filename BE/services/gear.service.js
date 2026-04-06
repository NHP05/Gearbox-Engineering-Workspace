/**
 * File: services/gear.service.js
 * Nhiệm vụ: Xử lý toán học cho bước thiết kế Bánh Răng (Trụ răng thẳng/nghiêng)
 */

const calculateGearPreliminary = (gearData) => {
    // 1. Lấy thông số đầu vào từ Frontend
    // torque: Mô-men xoắn trên trục chủ động T1 (N.mm) - Lưu ý: T từ bước 1 thường là N.m, cần nhân 1000
    // uGear: Tỉ số truyền của cặp bánh răng
    // psiBa: Hệ số chiều rộng vành răng (thường chọn từ 0.3 đến 0.5)
    // sigmaH: Ứng suất tiếp xúc cho phép [sigma_H] (MPa)
    // gearType: Loại bánh răng ('thang' - Răng thẳng, 'nghieng' - Răng nghiêng)
    const { torque_Nm, uGear, psiBa, sigmaH, gearType = 'thang' } = gearData;

    if (!torque_Nm || !uGear || !psiBa || !sigmaH) {
        throw new Error("Thiếu thông số đầu vào (Mô-men, tỉ số truyền, hệ số chiều rộng, hoặc ứng suất cho phép).");
    }

    // Đổi Mô-men từ N.m sang N.mm để đúng chuẩn công thức kỹ thuật
    const T1 = torque_Nm * 1000;

    // 2. Tra bảng các hệ số kinh nghiệm (Mô phỏng)
    // Ka: Hệ số phụ thuộc vật liệu và loại răng (49.5 cho răng thẳng, 43 cho răng nghiêng)
    const Ka = gearType === 'thang' ? 49.5 : 43;
    
    // K_Hbeta: Hệ số phân bố không đều tải trọng trên chiều rộng vành răng (Giả định sơ bộ 1.1 - 1.15)
    const KH_beta = 1.12; 

    // 3. Thực hiện phép toán: Xác định sơ bộ khoảng cách trục a_w
    // Công thức: a_w = Ka * (u + 1) * cbrt( (T1 * K_Hbeta) / ([sigmaH]^2 * u * psiBa) )
    const coreValue = (T1 * KH_beta) / (Math.pow(sigmaH, 2) * uGear * psiBa);
    const aw_raw = Ka * (uGear + 1) * Math.cbrt(coreValue);

    // Làm tròn khoảng cách trục theo chuẩn (kết thúc bằng 0 hoặc 5)
    // Ví dụ: 142.3 -> 145, 128.1 -> 130
    const aw_standard = Math.ceil(aw_raw / 5) * 5;

    // 4. Xác định khoảng Mô-đun (m) đề xuất
    // Công thức kinh nghiệm: m = (0.01 đến 0.02) * a_w
    const m_min = 0.01 * aw_standard;
    const m_max = 0.02 * aw_standard;

    // 5. Tính sơ bộ đường kính vòng chia d1, d2
    const d1_raw = (2 * aw_standard) / (uGear + 1);
    const d2_raw = d1_raw * uGear;

    // 6. Trả về kết quả cho Frontend
    return {
        aw_calculated: Number(aw_raw.toFixed(2)),
        aw_standard: aw_standard, // Khoảng cách trục đã chuẩn hóa (rất quan trọng để vẽ CAD)
        module_recommended: {
            min: Number(m_min.toFixed(2)),
            max: Number(m_max.toFixed(2)),
            hint: "Hãy chọn mô-đun tiêu chuẩn trong khoảng này (VD: 1.5, 2, 2.5, 3...)"
        },
        d1_preliminary: Number(d1_raw.toFixed(2)),
        d2_preliminary: Number(d2_raw.toFixed(2))
    };
};

module.exports = {
    calculateGearPreliminary
};