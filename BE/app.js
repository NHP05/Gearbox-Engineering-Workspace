const express = require('express');
const cors = require('cors'); // Của bạn kia (giúp kết nối Frontend)
const { Sequelize } = require('sequelize'); // Của Lâm
require('dotenv').config();

const app = express();

// ==========================================
// 1. MIDDLEWARE CHUNG
// ==========================================
app.use(cors()); 
app.use(express.json());

// ==========================================
// 2. IMPORT TẤT CẢ ROUTES
// ==========================================
const motorRoutes = require('./routes/motor.routes');
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculateRoutes = require('./routes/calculate.routes'); // Tuyến đường của Lâm

// ==========================================
// 3. GẮN ROUTES
// ==========================================
app.use('/api/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculateRoutes);

// Xử lý lỗi 404 (Của bạn kia)
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Đường dẫn API không tồn tại" });
});

// ==========================================
// 4. KẾT NỐI MYSQL & KHỞI ĐỘNG SERVER
// ==========================================
const sequelize = require('./config/database'); // File cấu hình của Lâm
const PORT = process.env.PORT || 3000;

sequelize.sync({ alter: true })
    .then(() => {
        console.log(`🎉 Đã kết nối thành công với MySQL Local (Database: ${process.env.DB_NAME})!`);
        app.listen(PORT, () => {
            console.log(`🚀 Hệ thống Backend Cơ khí đang chạy tại cổng ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Lỗi kết nối MySQL:", err);
    });