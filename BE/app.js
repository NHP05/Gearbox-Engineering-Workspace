const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
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
const projectRoutes = require('./routes/project.routes');
const variantRoutes = require('./routes/variant.routes');
const calculateRoutes = require('./routes/calculation.routes');

// ==========================================
// 3. DATABASE SYNC
// ==========================================
sequelize.sync({ alter: true }).then(() => {
    console.log('✅ Database synced successfully!');
}).catch(err => {
    console.warn('⚠️ Database sync warning:', err.message);
    console.log('   API will still work, but using mock mode for auth');
});

// ==========================================
// 4. GẮN ROUTES
// ==========================================
app.use('/api/motor', motorRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/project', projectRoutes);
app.use('/api/v1/variant', variantRoutes);
app.use('/api/v1/calculate', calculateRoutes);

// ==========================================
// 5. NOT FOUND
// ==========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Đường dẫn API không tồn tại" });
});

// ==========================================
// 6. ERROR HANDLING
// ==========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

// ==========================================
// 7. KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`✅ SERVER STARTED SUCCESSFULLY`);
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
    console.log('========================================');
    console.log('\n📡 Available Routes:');
    console.log(`   • POST   ${PORT}/api/v1/auth/register`);
    console.log(`   • POST   ${PORT}/api/v1/auth/login`);
    console.log(`   • POST   ${PORT}/api/v1/project/create`);
    console.log(`   • GET    ${PORT}/api/v1/project/my-projects`);
    console.log(`   • POST   ${PORT}/api/v1/calculate/step1`);
    console.log(`   • POST   ${PORT}/api/v1/calculate/step2`);
    console.log(`   • POST   ${PORT}/api/v1/calculate/step3`);
    console.log(`   • GET    ${PORT}/api/motor`);
    console.log(`   • GET    ${PORT}/api/v1/variant/project/:id`);
    console.log('========================================\n');
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ ERROR: Port ${PORT} is already in use. Please stop other processes or change PORT in .env`);
    } else {
        console.error(`❌ Server Error:`, err.message);
    }
    process.exit(1);
});