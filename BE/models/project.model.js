const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

const Project = sequelize.define('Project', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_name: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'draft' },
    // Các thông số đầu vào gốc của đề bài
    power_P: { type: DataTypes.FLOAT, allowNull: false }, // Công suất
    speed_n: { type: DataTypes.FLOAT, allowNull: false }, // Vòng quay
    lifetime_L: { type: DataTypes.FLOAT },                // Thời gian phục vụ
    load_type: { type: DataTypes.STRING }                 // Chế độ tải (Tĩnh, va đập...)
}, {
    tableName: 'projects',
    timestamps: true
});

// Thiết lập mối quan hệ (1 User có nhiều Projects)
User.hasMany(Project, { foreignKey: 'user_id' });
Project.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Project;