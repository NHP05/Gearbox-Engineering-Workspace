const express = require('express');
const cors = require('cors'); // Của bạn kia (giúp kết nối Frontend)
const { Sequelize } = require('sequelize'); // Của Lâm
require('dotenv').config();

const app = express();

// ==========================================
// 1. MIDDLEWARE CHUNG
// ==========================================
// CORS config chi tiết
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Simple test endpoint để kiểm tra server có chạy không
app.get('/api/v1/test', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ success: true, message: 'Backend is running' });
});

// Simple mock login endpoint - không dùng controller
app.post('/api/v1/auth/login-simple', (req, res) => {
    console.log('📝 Simple login received:', req.body);
    const { username, password } = req.body;
    
    if (username === 'admin') {
        console.log('✅ Simple login - user found');
        return res.json({
            success: true,
            message: 'Login successful',
            token: 'test-token-' + Date.now(),
            user: { id: 1, username: 'admin', role: 'admin' }
        });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// ==========================================
// 2. IMPORT TẤT CẢ ROUTES
// ==========================================
const motorRoutes = require('./routes/motor.routes');
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculationRoutes = require('./routes/calculation.routes');
const projectRoutes = require('./routes/project.routes');

// ==========================================
// 3. GẮN ROUTES
// ==========================================
app.use('/api/v1/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculationRoutes);
app.use('/api/v1/project', projectRoutes);

// Xử lý lỗi 404 (Của bạn kia)
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Đường dẫn API không tồn tại" });
});

// ==========================================
// 4. KẾT NỐI MYSQL & KHỞI ĐỘNG SERVER
// ==========================================
const sequelize = require('./config/database'); // File cấu hình của Lâm
const PORT = process.env.PORT || 8080;

// Chế độ Mock: Khởi động server ngay mà không cần database
const SKIP_DB = process.env.SKIP_DB === 'true';

if (SKIP_DB) {
    // ✅ Chế độ Mock Data - chạy mà không cần MySQL
    const server = app.listen(PORT, () => {
        console.log(`🚀 [MOCK MODE] Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
        console.log(`⚠️  Cơ sở dữ liệu đã bị tắt - đang dùng Mock Data`);
        console.log(`✅ Server sẵn sàng nhận request...`);
    });
    
    server.on('error', (err) => {
        console.error('❌ Server error:', err);
        process.exit(1);
    });
} else {
    // ✅ Chế độ Normal - kết nối MySQL
    sequelize.sync({ alter: true })
        .then(() => {
            console.log(`🎉 Đã kết nối thành công với MySQL Local (Database: ${process.env.DB_NAME})!`);
            const server = app.listen(PORT, () => {
                console.log(`🚀 Hệ thống Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
            });
            
            server.on('error', (err) => {
                console.error('❌ Server error:', err);
                process.exit(1);
            });
        })
        .catch((err) => {
            console.error("❌ Lỗi kết nối MySQL:", err);
            console.log("💡 Mẹo: Đặt SKIP_DB=true trong .env để chạy chế độ Mock Data");
        });
}