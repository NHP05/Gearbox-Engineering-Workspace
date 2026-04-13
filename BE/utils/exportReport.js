const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, PageBreak, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType } = require('docx');
const fs = require('fs');
const path = require('path');

const generateDocxReport = async (calculatedData, fileName = 'Gearbox_Design.docx') => {
    try {
        const exportDir = path.resolve(__dirname, '../../exports');
        if (!fs.existsSync(exportDir)){
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const outputFilePath = path.join(exportDir, fileName);

        // Build document with formulas and calculations
        const doc = new Document({
            sections: [{
                children: [
                    // Title
                    new Paragraph({
                        text: 'BÁO CÁO THIẾT KẾ HỘP SỐ GIẢM TỐC',
                        bold: true,
                        size: 32,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: 'Gearbox Design Report with Calculations',
                        size: 24,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: '' }),

                    // Section 1: Input Parameters
                    new Paragraph({
                        text: '1. THÔNG SỐ ĐẦU VÀO',
                        bold: true,
                        size: 26,
                    }),
                    ...(calculatedData.step1 ? [
                        new Paragraph(`Công suất công tác (P): ${calculatedData.step1.power || 'N/A'} kW`),
                        new Paragraph(`Tốc độ thường trôn (n): ${calculatedData.step1.speed || 'N/A'} RPM`),
                        new Paragraph(`Chế độ tải: ${calculatedData.step1.loadType || 'N/A'}`),
                        new Paragraph(`Thời gian làm việc: ${calculatedData.step1.life || 'N/A'} giờ`),
                    ] : []),
                    new Paragraph({ text: '' }),

                    // Section 2: Motor Selection with Formulas
                    new Paragraph({
                        text: '2. CHỌN ĐỘNG CƠ & CÔNG THỨC TÍNH',
                        bold: true,
                        size: 26,
                    }),
                    ...(calculatedData.step2 ? [
                        new Paragraph(`Công suất cần thiết: ${calculatedData.step2.required_power || 'N/A'} kW`),
                        new Paragraph(`Động cơ được chỉ định: ${calculatedData.step2.motor_model || 'N/A'}`),
                        new Paragraph(`Tỷ số truyền tổng: ${calculatedData.step2.total_ratio || 'N/A'}`),
                        new Paragraph(`Hiệu suất chung: ${(calculatedData.step2.eta_total * 100 || 0).toFixed(2)}%`),
                    ] : []),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Công thức tính:',
                        bold: true,
                    }),
                    new Paragraph('(1) Hiệu suất chung: η_total = η_belt × η_gear × η_bearing'),
                    new Paragraph('(2) Công suất cần thiết: P_req = P_ct / η_total'),
                    new Paragraph('(3) Tỷ số truyền tổng: u_total = n_motor / n_ct'),
                    new Paragraph({ text: '' }),

                    // Section 3: Transmission Design with Formulas
                    new Paragraph({
                        text: '3. THIẾT KẾ HỆ TRUYỀN ĐỘI & CÔNG THỨC TÍNH',
                        bold: true,
                        size: 26,
                    }),
                    ...(calculatedData.step3 ? [
                        new Paragraph('Bánh răng côn (Cấp nhanh):'),
                        new Paragraph(`  - Tỷ số truyền u₁: ${calculatedData.step3.bevel_ratio || 'N/A'}`),
                        new Paragraph(`  - Khoảng cách trục: ${calculatedData.step3.bevel_center_distance || 'N/A'} mm`),
                        new Paragraph(`  - Vật liệu: ${calculatedData.step3.bevel_material || 'N/A'}`),
                        new Paragraph(''),
                        new Paragraph('Bánh răng trụ (Cấp chậm):'),
                        new Paragraph(`  - Tỷ số truyền u₂: ${calculatedData.step3.spur_ratio || 'N/A'}`),
                        new Paragraph(`  - Khoảng cách trục: ${calculatedData.step3.spur_center_distance || 'N/A'} mm`),
                        new Paragraph(`  - Vật liệu: ${calculatedData.step3.spur_material || 'N/A'}`),
                    ] : []),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Công thức tính bánh răng trụ (Cấp chậm):',
                        bold: true,
                    }),
                    new Paragraph('(1) Mô-men xoắn truyền: T₂ = T₁ / u₁'),
                    new Paragraph('(2) Chuẩn hóa mô-men: T₂ (N·m) → T₂ (N·mm) = T₂ × 1000'),
                    new Paragraph('(3) Khoảng cách trục: aw = Ka × (u₂ + 1) × ∛[T₂ × KHbeta / (σH² × u₂ × ψ_ba)]'),
                    new Paragraph('(4) Chuẩn hóa aw: Làm tròn lên bội số 5'),
                    new Paragraph('(5) Module được gợi ý: m = 0.01 × aw'),
                    new Paragraph({ text: '' }),

                    // Section 4: Shaft & Bearing Design with Formulas
                    new Paragraph({
                        text: '4. THIẾT KẾ TRỤC & Ổ LĂNG & CÔNG THỨC TÍNH',
                        bold: true,
                        size: 26,
                    }),
                    ...(calculatedData.step4 ? [
                        new Paragraph(`Đường kính trục chính: ${calculatedData.step4.main_shaft_diameter || 'N/A'} mm`),
                        new Paragraph(`Đường kính trục phụ: ${calculatedData.step4.secondary_shaft_diameter || 'N/A'} mm`),
                        new Paragraph(`Ổ lăn được chỉ định: ${calculatedData.step4.bearing_model || 'N/A'}`),
                        new Paragraph(`Chịu lực động: ${calculatedData.step4.bearing_capacity || 'N/A'} kN`),
                    ] : []),
                    new Paragraph({ text: '' }),
                    new Paragraph({
                        text: 'Công thức tính trục:',
                        bold: true,
                    }),
                    new Paragraph('(1) Mô-men uốn tổng hợp: M_total = √(Mx² + My²)'),
                    new Paragraph('(2) Ứng suất tương đương (Thuyết Von Mises):'),
                    new Paragraph('     σ_eq = √(M_total² + 0.75 × T²) / W'),
                    new Paragraph('(3) Đường kính trục sơ bộ: d ≥ ∛[T / (0.2 × τ_allow)]'),
                    new Paragraph('(4) Chuẩn hóa đường kính: Làm tròn lên bội số 5'),
                    new Paragraph({ text: '' }),

                    // Section 5: Validation Results
                    new Paragraph({
                        text: '5. KẾT QUẢ KIỂM CHỨNG',
                        bold: true,
                        size: 26,
                    }),
                    ...(calculatedData.step5 ? [
                        new Paragraph(`Ứng suất tiếp xúc bánh răng: ${calculatedData.step5.contact_stress || 'N/A'} MPa`),
                        new Paragraph(`Ứng suất uốn tại chân răng: ${calculatedData.step5.bending_stress || 'N/A'} MPa`),
                        new Paragraph(`Hệ số an toàn: ${calculatedData.step5.safety_factor || 'N/A'}`),
                        new Paragraph(`Trạng thái: ${calculatedData.step5.status || 'Chưa kiểm chứng'}`),
                    ] : []),
                    new Paragraph({ text: '' }),

                    // Footer
                    new Paragraph({
                        text: 'Báo cáo được tạo tự động bởi Gearbox Engineering System',
                        alignment: AlignmentType.CENTER,
                        size: 18,
                    }),
                    new Paragraph({
                        text: `Ngày tạo: ${new Date().toLocaleString('vi-VN')}`,
                        alignment: AlignmentType.CENTER,
                        size: 18,
                    }),
                ]
            }]
        });

        // Write to file
        const buffer = await Packer.toBuffer(doc);
        fs.writeFileSync(outputFilePath, buffer);

        return outputFilePath;
    } catch (error) {
        console.error("Lỗi quá trình tạo file Word:", error);
        throw new Error("Không thể tạo báo cáo thuyết minh: " + error.message);
    }
};

const generatePdfReport = (calculatedData, fileName = 'Thuyet_Minh_Do_An.pdf') => {
    try {
        // 1. Đảm bảo thư mục exports tồn tại trước khi lưu
        const exportDir = path.resolve(__dirname, '../../exports');
        if (!fs.existsSync(exportDir)){
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const outputFilePath = path.join(exportDir, fileName);

        // 2. Khởi tạo PDF Document
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            font: 'Helvetica'
        });

        // 3. Pipe vào file
        const writeStream = fs.createWriteStream(outputFilePath);
        doc.pipe(writeStream);

        // 4. Render dữ liệu vào PDF
        // Title
        doc.fontSize(20).font('Helvetica-Bold').text('BÁO CÁO THIẾT KẾ HỘP SỐ GIẢM TỐC', {
            align: 'center'
        });
        
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').text('Gearbox Design Report', {
            align: 'center'
        });
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // Section 1: Input Parameters (Bước 1)
        doc.fontSize(14).font('Helvetica-Bold').text('1. THÔNG SỐ ĐẦU VÀO', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        if (calculatedData.step1) {
            const step1 = calculatedData.step1;
            doc.text(`• Công suất công tác (P): ${step1.power || 'N/A'} kW`);
            doc.text(`• Tốc độ thường trôn (n): ${step1.speed || 'N/A'} RPM`);
            doc.text(`• Chế độ tải: ${step1.loadType || 'N/A'}`);
            doc.text(`• Thời gian làm việc: ${step1.life || 'N/A'} giờ`);
        }
        
        doc.moveDown(0.5);

        // Section 2: Motor Selection (Bước 2) with Formulas
        doc.fontSize(14).font('Helvetica-Bold').text('2. CHỌN ĐỘNG CƠ & CÔNG THỨC TÍNH', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        if (calculatedData.step2) {
            const step2 = calculatedData.step2;
            doc.text(`• Công suất cần thiết: ${step2.required_power || 'N/A'} kW`);
            doc.text(`• Động cơ được chỉ định: ${step2.motor_model || 'N/A'}`);
            doc.text(`• Tỷ số truyền tổng: ${step2.total_ratio || 'N/A'}`);
            doc.text(`• Hiệu suất chung: ${(step2.eta_total * 100 || 0).toFixed(2)}%`);
        }
        
        // Motor formula
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text('Công thức tính:');
        doc.fontSize(9).font('Helvetica');
        doc.text('(1) Hiệu suất chung: η_total = η_belt × η_gear × η_bearing');
        doc.text('(2) Công suất cần thiết: P_req = P_ct / η_total');
        doc.text('(3) Tỷ số truyền tổng: u_total = n_motor / n_ct');
        
        doc.moveDown(0.5);

        // Section 3: Transmission Design (Bước 3) with Formulas
        doc.fontSize(14).font('Helvetica-Bold').text('3. THIẾT KẾ HỆ TRUYỀN ĐỘI & CÔNG THỨC TÍNH', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        if (calculatedData.step3) {
            const step3 = calculatedData.step3;
            doc.text(`• Bánh răng côn (Cấp nhanh):`);
            doc.text(`  - Tỷ số truyền u₁: ${step3.bevel_ratio || 'N/A'}`);
            doc.text(`  - Khoảng cách trục: ${step3.bevel_center_distance || 'N/A'} mm`);
            doc.text(`  - Vật liệu: ${step3.bevel_material || 'N/A'}`);
            doc.moveDown(0.2);
            doc.text(`• Bánh răng trụ (Cấp chậm):`);
            doc.text(`  - Tỷ số truyền u₂: ${step3.spur_ratio || 'N/A'}`);
            doc.text(`  - Khoảng cách trục: ${step3.spur_center_distance || 'N/A'} mm`);
            doc.text(`  - Vật liệu: ${step3.spur_material || 'N/A'}`);
        }
        
        // Gear calculation formulas
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text('Công thức tính bánh răng trụ (Cấp chậm):');
        doc.fontSize(9).font('Helvetica');
        doc.text('(1) Mô-men xoắn truyền: T₂ = T₁ / u₁');
        doc.text('(2) Chuẩn hóa mô-men: T₂ (N·m) → T₂ (N·mm) = T₂ × 1000');
        doc.text('(3) Khoảng cách trục: aw = Ka × (u₂ + 1) × ∛[T₂ × KHbeta / (σH² × u₂ × ψ_ba)]');
        doc.text('(4) Chuẩn hóa aw: Làm tròn lên bội số 5');
        doc.text('(5) Module được gợi ý: m = 0.01 × aw');
        
        doc.moveDown(0.5);

        // Section 4: Shaft & Bearing Design (Bước 4) with Formulas
        doc.fontSize(14).font('Helvetica-Bold').text('4. THIẾT KẾ TRỤC & Ổ LĂNG & CÔNG THỨC TÍNH', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        if (calculatedData.step4) {
            const step4 = calculatedData.step4;
            doc.text(`• Đường kính trục chính: ${step4.main_shaft_diameter || 'N/A'} mm`);
            doc.text(`• Đường kính trục phụ: ${step4.secondary_shaft_diameter || 'N/A'} mm`);
            doc.text(`• Ổ lăn được chỉ định: ${step4.bearing_model || 'N/A'}`);
            doc.text(`• Chịu lực động: ${step4.bearing_capacity || 'N/A'} kN`);
        }
        
        // Shaft calculation formulas
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text('Công thức tính trục:');
        doc.fontSize(9).font('Helvetica');
        doc.text('(1) Mô-men uốn tổng hợp: M_total = √(Mx² + My²)');
        doc.text('(2) Ứng suất tương đương (Thuyết Von Mises):');
        doc.text('     σ_eq = √(M_total² + 0.75 × T²) / W');
        doc.text('(3) Đường kính trục sơ bộ: d ≥ ∛[T / (0.2 × τ_allow)]');
        doc.text('(4) Chuẩn hóa đường kính: Làm tròn lên bội số 5');
        
        doc.moveDown(0.5);

        // Section 5: Validation Results (Bước 5)
        doc.fontSize(14).font('Helvetica-Bold').text('5. KẾT QUẢ KIỂM CHỨNG', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        
        if (calculatedData.step5) {
            const step5 = calculatedData.step5;
            doc.text(`• Ứng suất tiếp xúc bánh răng: ${step5.contact_stress || 'N/A'} MPa`);
            doc.text(`• Ứng suất uốn tại chân răng: ${step5.bending_stress || 'N/A'} MPa`);
            doc.text(`• Hệ số an toàn: ${step5.safety_factor || 'N/A'}`);
            doc.text(`• Trạng thái: ${step5.status || 'Chưa kiểm chứng'}`);
        }

        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Footer
        doc.fontSize(9).font('Helvetica').text('Báo cáo được tạo tự động bởi Gearbox Engineering System', {
            align: 'center'
        });
        doc.text(`Ngày tạo: ${new Date().toLocaleString('vi-VN')}`, {
            align: 'center'
        });

        // 5. Kết thúc document
        doc.end();

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve(outputFilePath);
            });
            writeStream.on('error', (err) => {
                reject(err);
            });
        });
    } catch (error) {
        console.error("Lỗi quá trình tạo file PDF:", error);
        throw new Error("Không thể tạo báo cáo PDF: " + error.message);
    }
};

module.exports = { generateDocxReport, generatePdfReport };