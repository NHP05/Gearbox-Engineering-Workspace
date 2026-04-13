const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model');
const SupportTicket = require('./support_ticket.model');

const SupportMessage = sequelize.define('SupportMessage', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    sender_user_id: { type: DataTypes.INTEGER, allowNull: false },
    sender_role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'USER' },
    message: { type: DataTypes.TEXT, allowNull: false },
    is_edited: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    edited_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    edited_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'support_messages',
    timestamps: true,
});

SupportTicket.hasMany(SupportMessage, { foreignKey: 'ticket_id', as: 'messages', onDelete: 'CASCADE' });
SupportMessage.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

User.hasMany(SupportMessage, { foreignKey: 'sender_user_id', onDelete: 'CASCADE' });
SupportMessage.belongsTo(User, { foreignKey: 'sender_user_id', as: 'sender' });

module.exports = SupportMessage;
