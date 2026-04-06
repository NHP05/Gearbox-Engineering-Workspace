const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');

const generateDocxReport = (calculatedData, fileName = 'Thuyet_Minh_Do_An.docx') => {
    try {
        // 1. Đường dẫn tới file template mẫu (Bạn cần tạo thư mục templates và để file mẫu vào đây)
        const templatePath = path.resolve(__dirname, '../../templates/template_do_an.docx');
        
        // Đọc file template dạng binary
        const content = fs.readFileSync(templatePath, 'binary');

        // 2. Khởi tạo PizZip và Docxtemplater
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // 3. Render dữ liệu vào các thẻ {tag} trong file Word
        doc.render(calculatedData);

        // 4. Sinh ra file đệm (buffer)
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE', // Nén file cho nhẹ
        });

        // 5. Đảm bảo thư mục exports tồn tại trước khi lưu
        const exportDir = path.resolve(__dirname, '../../exports');
        if (!fs.existsSync(exportDir)){
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // 6. Ghi ra file hoàn chỉnh
        const outputFilePath = path.join(exportDir, fileName);
        fs.writeFileSync(outputFilePath, buf);

        return outputFilePath;
    } catch (error) {
        console.error("Lỗi quá trình tạo file Word:", error);
        throw new Error("Không thể tạo báo cáo thuyết minh: " + error.message);
    }
};

module.exports = { generateDocxReport };