const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');

const SupportTicket = sequelize.define('SupportTicket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_code: { type: DataTypes.STRING(48), allowNull: false, unique: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'normal' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
    created_by_name: { type: DataTypes.STRING(120), allowNull: false },
    created_by_email: { type: DataTypes.STRING(255), allowNull: true },
    user_edit_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    user_edited_at: { type: DataTypes.DATE, allowNull: true },
    banned_by_admin_id: { type: DataTypes.INTEGER, allowNull: true },
    banned_reason: { type: DataTypes.TEXT, allowNull: true },
    banned_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by_admin_id: { type: DataTypes.INTEGER, allowNull: true },
    deleted_by_admin_reason: { type: DataTypes.TEXT, allowNull: true },
    deleted_by_admin_at: { type: DataTypes.DATE, allowNull: true },
    deleted_by_user_reason: { type: DataTypes.TEXT, allowNull: true },
    deleted_by_user_at: { type: DataTypes.DATE, allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    last_message_by_role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'USER' },
}, {
    tableName: 'support_tickets',
    timestamps: true,
});

User.hasMany(SupportTicket, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id' });

module.exports = SupportTicket;
