const { Sequelize } = require('sequelize');

// Cấu hình kết nối MySQL (Mặc định dùng XAMPP: user là 'root', pass rỗng '')
// 'gearbox_db' là tên database của bạn, hãy tạo nó trong phpMyAdmin nhé.
const sequelize = new Sequelize('gearbox_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql', 
    logging: false, // Tắt log các câu lệnh SQL hiển thị trên terminal cho đỡ rối
});

// Kiểm tra kết nối
sequelize.authenticate()
    .then(() => {
        console.log('✅ Kết nối Database thành công!');
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = sequelize;