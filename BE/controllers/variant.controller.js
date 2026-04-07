const DesignVariant = require('../models/variants.model');

// [POST] Lưu một phương án tính toán mới
const saveVariant = async (req, res) => {
    try {
        const { project_id, variant_name, calculated_data } = req.body;

        // Logic check: Đảm bảo project_id này thuộc về user đang đăng nhập (req.user.id)
        // (Có thể viết thêm query check Project owner ở đây để bảo mật)

        const newVariant = await DesignVariant.create({
            project_id,
            variant_name,
            calculated_data // Cục JSON chứa TST, Module, Ứng suất...
        });

        return res.status(201).json({ 
            success: true, 
            message: "Đã lưu phương án thiết kế thành công!", 
            data: newVariant 
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] Lấy danh sách các phương án của 1 dự án để So sánh
const getVariantsByProject = async (req, res) => {
    try {
        const { projectId } = req.params;

        const variants = await DesignVariant.findAll({
            where: { project_id: projectId },
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({ success: true, data: variants });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { saveVariant, getVariantsByProject };