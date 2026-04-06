const express = require('express');
const cors = require('cors');

// ==========================================
// 1. IMPORT TẤT CẢ ROUTES Ở ĐẦU FILE
// ==========================================
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculationRoutes = require('./routes/calculation.routes');

const app = express();

// ==========================================
// 2. MIDDLEWARE CHUNG
// ==========================================
// Bật CORS để cho phép Frontend React (Port 5173) gọi API không bị chặn
app.use(cors()); 

// Cho phép Backend đọc được dữ liệu JSON từ Frontend gửi lên
app.use(express.json());

// ==========================================
// 3. GẮN ROUTES (Đồng nhất tiền tố /api/v1)
// ==========================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculationRoutes);

// Xử lý lỗi 404 cho các đường dẫn không tồn tại
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Đường dẫn API không tồn tại" });
});

// ==========================================
// 4. KHỞI ĐỘNG SERVER (Luôn nằm ở cuối cùng)
// ==========================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Hệ thống Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
});