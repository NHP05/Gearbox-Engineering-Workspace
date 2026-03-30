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