const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: false,
    },
    password_hash: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    password_plain: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    role: { 
        type: DataTypes.STRING, 
        defaultValue: 'USER' // Có thể là 'ADMIN' để cấp quyền sửa thư viện tiêu chuẩn
    },
    is_banned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    ban_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    banned_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    banned_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'vi',
    },
    theme: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'light',
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    last_seen_at: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'users',
    timestamps: true // Tự động tạo trường created_at và updated_at
});

module.exports = User;