const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Project = require('./project.model');

const DesignVariant = sequelize.define('DesignVariant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    variant_name: { type: DataTypes.STRING, allowNull: false }, // VD: "Phương án Thép 45 - Nhiệt luyện thường"
    is_final: { type: DataTypes.BOOLEAN, defaultValue: false }, // Đánh dấu đây là phương án chốt để in thuyết minh
    
    // Lưu toàn bộ kết quả tính toán dưới dạng JSON
    calculated_data: { 
        type: DataTypes.JSON, 
        allowNull: true,
        comment: 'Chứa JSON data của Động cơ, Đai, Răng, Trục'
    }
}, {
    tableName: 'design_variants',
    timestamps: true
});

// Quan hệ: 1 Project có nhiều Design Variants
Project.hasMany(DesignVariant, { foreignKey: 'project_id', onDelete: 'CASCADE' });
DesignVariant.belongsTo(Project, { foreignKey: 'project_id' });

module.exports = DesignVariant;