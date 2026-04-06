/**
 * File: services/belt.service.js
 * Nhiệm vụ: Xử lý các phép toán thiết kế Bộ truyền Đai
 */

const calculateBeltDrive = (beltData) => {
    // 1. Lấy các thông số đầu vào từ Frontend gửi lên
    // uBelt: Tỉ số truyền, d1: Đường kính bánh dẫn, power: Công suất, n1: Số vòng quay, slipXi: Hệ số trượt
    const { uBelt, d1, power, n1, slipXi } = beltData;

    // Kiểm tra dữ liệu đầu vào (Validation cơ bản)
    if (!uBelt || !d1 || !power || !n1 || slipXi === undefined) {
        throw new Error("Thiếu thông số đầu vào để tính toán bộ truyền đai.");
    }

    if (d1 <= 0 || n1 <= 0 || power <= 0) {
        throw new Error("Thông số đầu vào (d1, n1, power) phải lớn hơn 0.");
    }

    // 2. Thực hiện các phép tính cơ học
    
    // Đường kính bánh bị dẫn d2: d2 = u * d1 * (1 - xi)
    // Lưu ý: Trong thực tế thiết kế, d2 tính ra sẽ phải được làm tròn theo tiêu chuẩn
    const d2 = uBelt * d1 * (1 - slipXi);

    // Vận tốc đai v: v = (pi * d1 * n1) / 60000 (Đơn vị: m/s)
    const velocity = (Math.PI * d1 * n1) / 60000;

    // Vận tốc đai không nên vượt quá 25-30 m/s (đối với đai thang tiêu chuẩn)
    let warning = null;
    if (velocity > 30) {
        warning = "Cảnh báo: Vận tốc đai v > 30 m/s. Khuyến nghị giảm n1 hoặc d1.";
    }

    // Lực vòng trên đai Ft: Ft = 1000 * P / v (Đơn vị: N)
    const Ft = (1000 * power) / velocity;

    // 3. Trả về kết quả
    return {
        d2_mm: Number(d2.toFixed(2)),
        velocity_ms: Number(velocity.toFixed(2)),
        Ft_N: Number(Ft.toFixed(2)),
        warning: warning // Trả về kèm cảnh báo nếu vi phạm giới hạn cơ học
    };
};

module.exports = {
    calculateBeltDrive
};