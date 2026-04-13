const DesignVariant = require('../models/variant.model');
const { generateDocxReport, generatePdfReport } = require('../utils/exportReport');
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
        const outputFilePath = await generateDocxReport(dataToExport, `Thuyet_Minh_Do_An_${variantId}.docx`);

        // 3. Trả file về cho trình duyệt Frontend tải xuống
        res.download(outputFilePath, `Thuyet_Minh_Do_An.docx`, (err) => {
            if (err) {
                console.error("Lỗi khi tải file:", err);
            }
            // Xóa file tạm trên server sau khi user đã tải xong để giải phóng bộ nhớ
            try {
                fs.unlinkSync(outputFilePath);
            } catch (e) {
                console.error("Lỗi xóa file tạm:", e);
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// New function: Export report from calculation steps (Word or PDF)
const exportReport = async (req, res) => {
    try {
        const { step1, step2, step3, step4, step5, exportFormat } = req.body;

        // Validate format
        if (!exportFormat || !['pdf', 'word', 'docx'].includes(exportFormat.toLowerCase())) {
            return res.status(400).json({ success: false, message: "Format xuất không hợp lệ (pdf hoặc word)" });
        }

        // Combine all calculation data
        const calculatedData = {
            step1: step1 || {},
            step2: step2 || {},
            step3: step3 || {},
            step4: step4 || {},
            step5: step5 || {},
            exportedAt: new Date().toLocaleString('vi-VN')
        };

        const timestamp = Date.now();
        let outputFilePath;

        // Generate file based on format
        if (exportFormat.toLowerCase() === 'pdf') {
            outputFilePath = await generatePdfReport(calculatedData, `Gearbox_Design_${timestamp}.pdf`);
        } else {
            outputFilePath = await generateDocxReport(calculatedData, `Gearbox_Design_${timestamp}.docx`);
        }

        // Send file to client
        res.download(outputFilePath, `gearbox-design.${exportFormat}`, (err) => {
            if (err) {
                console.error("Lỗi khi tải file:", err);
            }
            // Delete temporary file after download
            try {
                fs.unlinkSync(outputFilePath);
            } catch (e) {
                console.error("Lỗi xóa file tạm:", e);
            }
        });

    } catch (error) {
        console.error("Export error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { exportThuyetMinh, exportReport };