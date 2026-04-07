const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Belt = sequelize.define('Belt', {
    type: { type: DataTypes.STRING, primaryKey: true }, // Loại đai: A, B, C...
    h: { type: DataTypes.FLOAT },        // Chiều cao tiết diện
    b_p: { type: DataTypes.FLOAT },      // Chiều rộng tính toán
    area: { type: DataTypes.FLOAT },     // Diện tích tiết diện (mm2)
    d1_min: { type: DataTypes.INTEGER }  // Đường kính bánh đai nhỏ tối thiểu
}, { tableName: 'belts', timestamps: false });

module.exports = Belt;