const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminActionLog = sequelize.define('AdminActionLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    admin_user_id: { type: DataTypes.INTEGER, allowNull: false },
    admin_username: { type: DataTypes.STRING, allowNull: false },
    action_type: { type: DataTypes.STRING, allowNull: false },
    target_user_id: { type: DataTypes.INTEGER, allowNull: true },
    target_username: { type: DataTypes.STRING, allowNull: true },
    target_project_id: { type: DataTypes.INTEGER, allowNull: true },
    target_project_name: { type: DataTypes.STRING, allowNull: true },
    reason: { type: DataTypes.TEXT, allowNull: true },
    payload: { type: DataTypes.JSON, allowNull: true },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    tableName: 'admin_action_logs',
    timestamps: true,
});

module.exports = AdminActionLog;
