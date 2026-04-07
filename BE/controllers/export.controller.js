const DesignVariant = require('../models/variants.model');
const { generateDocxReport } = require('../utils/exportReport');
const path = require('path');
const fs = require('fs');

const exportThuyetMinh = async (req, res) => {
    try {
        const { variantId } = req.params;

        // 1. Lấy dữ liệu phương án từ DB
        const variant = await DesignVariant.findByPk(variantId);
        if (!variant || !variant.calculated_data) {
            return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu phương án!" });
        }

        const dataToExport = variant.calculated_data; // Đây là cục JSON

        // 2. Gọi hàm sinh file Word từ Utils
        // (Hàm generateDocxReport sẽ đọc template .docx, map dữ liệu và tạo file mới)
        const outputFilePath = generateDocxReport(dataToExport, `Thuyet_Minh_Do_An_${variantId}.docx`);

        // 3. Trả file về cho trình duyệt Frontend tải xuống
        res.download(outputFilePath, `Thuyet_Minh_Do_An.docx`, (err) => {
            if (err) {
                console.error("Lỗi khi tải file:", err);
            }
            // Xóa file tạm trên server sau khi user đã tải xong để giải phóng bộ nhớ
            fs.unlinkSync(outputFilePath); 
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { exportThuyetMinh };