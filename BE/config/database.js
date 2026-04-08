const { Sequelize } = require('sequelize');

// Thông số chuẩn của XAMPP: user là 'root', pass là chuỗi rỗng ''
const sequelize = new Sequelize('gearbox_db', 'root', '', {
    host: '127.0.0.1', // Dùng 127.0.0.1 sẽ ổn định hơn localhost
    dialect: 'mysql', 
    logging: false, 
    port: 3636      
});

// Kiểm tra kết nối
sequelize.authenticate()
    .then(() => {
        console.log('✅ Kết nối XAMPP MySQL thành công!');
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = sequelize;