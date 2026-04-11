const GearMaterial = require('../models/gear_material.model');

const calculateSpurGear = async (T2, u2, materialName) => {
    try {
        // 1. Lấy thông số vật liệu từ MySQL
        const mat = await GearMaterial.findByPk(materialName);
        if (!mat) {
            throw new Error(`Không tìm thấy vật liệu: ${materialName} trong Database!`);
        }

        // 2. Các hệ số thực nghiệm (Giả định sơ bộ theo sách Chi tiết máy)
        const Ka = 43; // Hệ số cho bánh răng trụ răng nghiêng
        const psi_ba = 0.3; // Hệ số chiều rộng vành răng
        const KHbeta = 1.1; // Hệ số phân bố không đều tải trọng
        
        // Tính ứng suất tiếp xúc cho phép (Nhân với hệ số an toàn, giả định 0.9)
        const sigmaH = mat.sigma_h_lim * 0.9;

        // 3. Công thức tính khoảng cách trục aw
        // Đổi T2 từ N.m sang N.mm để đồng nhất đơn vị
        const T2_Nmm = T2 * 1000; 
        const aw = Ka * (u2 + 1) * Math.pow((T2_Nmm * KHbeta) / (Math.pow(sigmaH, 2) * u2 * psi_ba), 1/3);

        // 4. Chuẩn hóa aw (Làm tròn chẵn theo bội số của 5)
        const aw_standard = Math.ceil(aw / 5) * 5;

        return {
            material_used: mat.name,
            sigma_h_allow: sigmaH.toFixed(2),
            calculated_aw: aw.toFixed(2),
            standard_aw: aw_standard,
            suggested_module_m: (0.01 * aw_standard).toFixed(2)
        };
    } catch (error) {
        throw error;
    }
};

// Đừng quên export các hàm khác như Bevel Gear nếu bạn làm tiếp nhé
module.exports = { calculateSpurGear };
