const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    password_hash: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    role: { 
        type: DataTypes.STRING, 
        defaultValue: 'USER' // Có thể là 'ADMIN' để cấp quyền sửa thư viện tiêu chuẩn
    }
}, {
    tableName: 'users',
    timestamps: true // Tự động tạo trường created_at và updated_at
});

module.exports = User;