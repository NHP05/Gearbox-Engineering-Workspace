const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'gearbox_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || process.env.DB_PASS || '', {
        host: process.env.DB_HOST || '127.0.0.1',
        dialect: 'mysql',
        logging: false,
        port: Number(process.env.DB_PORT) || 3636,
    }
);

// Kiểm tra kết nối
sequelize.authenticate()
    .then(() => {
        console.log(`✅ Kết nối MySQL thành công! Host=${process.env.DB_HOST || '127.0.0.1'} Port=${process.env.DB_PORT || 3636}`);
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = sequelize;