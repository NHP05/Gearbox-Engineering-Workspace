const express = require('express');
const app = express();
const motorRoutes = require('./routes/motor.routes');

// Middleware để Backend đọc được JSON từ Frontend gửi lên
app.use(express.json());

// Gắn Route
app.use('/api/motor', motorRoutes);

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Hệ thống tính toán Cơ khí đang chạy tại cổng ${PORT}`);
});

// Thêm phần này vào cuối file app.js để gắn route auth
const authRoutes = require('./routes/auth.routes');
// ...
app.use('/api/v1/auth', authRoutes);

// Thêm phần này vào cuối file app.js để gắn route project
const variantRoutes = require('./routes/variant.routes');
// ...
app.use('/api/v1/variants', variantRoutes);
const calculationRoutes = require('./routes/calculation.routes');
// ...
app.use('/api/v1/calculate', calculationRoutes);