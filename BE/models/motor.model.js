const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Đảm bảo đường dẫn này đúng tới file cấu hình db của bạn

const Motor = sequelize.define('Motor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  power: {
    type: DataTypes.FLOAT, // Công suất kW
    allowNull: false
  },
  speed_rpm: {
    type: DataTypes.INTEGER, // Tốc độ vòng/phút
    allowNull: false
  }
}, {
  tableName: 'motors', // Tên bảng trong MySQL
  timestamps: false    // Tắt createdAt/updatedAt nếu Lâm không cần
});

module.exports = Motor;