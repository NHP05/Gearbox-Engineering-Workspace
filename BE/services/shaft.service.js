const calculateShaft = async (T, Mx, My, materialName) => {
    try {
        // 1. Giả định lấy Ứng suất cho phép của vật liệu (Lâm có thể query MySQL giống bánh răng)
        // Ở đây mình ví dụ gán cứng: Thép 45 -> tau_allow = 15...30 MPa, sigma_b_allow = 60 MPa
        const sigma_allow = 60; 

        // 2. Tính Mô-men uốn tổng hợp (M_total) từ 2 mặt phẳng Mx và My
        const M_total = Math.sqrt(Math.pow(Mx, 2) + Math.pow(My, 2));

        // 3. Tính Ứng suất tương đương (Thuyết bền 3 hoặc Von Mises)
        // Theo Chi tiết máy: sigma_eq = sqrt(M_total^2 + 0.75 * T^2) / W
        // Để tính nhanh đường kính sơ bộ d: d >= căn bậc 3 của (T / (0.2 * tau_allow))
        
        const tau_allow = 15; // MPa
        const d_min = Math.pow((T * 1000) / (0.2 * tau_allow), 1/3); // T đổi ra N.mm
        
        // Chuẩn hóa đường kính trục (làm tròn lên bội số của 5)
        const d_standard = Math.ceil(d_min / 5) * 5;

        return {
            status: "Tính toán Trục thành công",
            input_torque: T,
            calculated_d_min: d_min.toFixed(2),
            standard_diameter_d: d_standard,
            material_suggested: materialName || "C45"
        };
    } catch (error) {
        throw error;
    }
};

module.exports = { calculateShaft };