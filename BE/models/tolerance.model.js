const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tolerance = sequelize.define('Tolerance', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    
    // Loại mối ghép (VD: 'gear_shaft' - Răng lắp trên trục, 'bearing_shaft' - Ổ lăn trên trục)
    connection_type: { type: DataTypes.STRING, allowNull: false }, 
    
    // Đặc tính lắp ghép (VD: 'Lắp có độ dôi', 'Lắp trung gian', 'Lắp lỏng')
    fit_character: { type: DataTypes.STRING, allowNull: false },
    
    // Dung sai lỗ (VD: 'H7')
    hole_tolerance: { type: DataTypes.STRING, allowNull: false },
    
    // Dung sai trục (VD: 'k6', 'h6')
    shaft_tolerance: { type: DataTypes.STRING, allowNull: false },
    
    // Mô tả chi tiết để sinh viên hiểu tại sao chọn cái này
    description: { type: DataTypes.STRING }
}, {
    tableName: 'std_tolerances',
    timestamps: false
});

module.exports = Tolerance;