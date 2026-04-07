const express = require('express');
const { Sequelize } = require('sequelize'); // <-- DÒNG QUAN TRỌNG NHẤT
require('dotenv').config();

const app = express();

// Middleware để đọc JSON
app.use(express.json());

// Import Routes
const motorRoutes = require('./routes/motor.routes');
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculateRoutes = require('./routes/calculate.routes');

// Gắn Route
app.use('/api/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculateRoutes);

// --- KẾT NỐI DATABASE MYSQL ---
// ... (Các đoạn require và app.use ở trên giữ nguyên)

const sequelize = require('./config/database'); // Gọi file cấu hình vừa tạo
const PORT = process.env.PORT || 3000;

// Chạy kết nối và khởi động server
sequelize.sync({ alter: true })
    .then(() => {
        console.log(`🎉 Đã kết nối thành công với MySQL Local (Database: ${process.env.DB_NAME})!`);
        
        // Chỉ khi nối DB thành công mới chạy Server
        app.listen(PORT, () => {
            console.log(`🚀 Hệ thống tính toán Cơ khí đang chạy tại cổng ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ Lỗi kết nối MySQL:", err);
    });