const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const motorRoutes = require('./routes/motor.routes');
const authRoutes = require('./routes/auth.routes');
const variantRoutes = require('./routes/variant.routes');
const calculateRoutes = require('./routes/calculate.routes');

require('./models/user.model');
require('./models/project.model');
require('./models/variant.model');
require('./models/tolerance.model');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/calculate', calculateRoutes);

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Đường dẫn API không tồn tại' });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(PORT, () => {
            console.log(`🚀 Hệ thống Backend Cơ khí đang chạy tại http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Lỗi khởi động backend:', error.message);
        process.exit(1);
    }
}

startServer();
