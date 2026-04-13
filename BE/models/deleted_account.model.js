const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeletedAccount = sequelize.define('DeletedAccount', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    original_user_id: { type: DataTypes.INTEGER, allowNull: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    deleted_by_user_id: { type: DataTypes.INTEGER, allowNull: false },
    deleted_by_username: { type: DataTypes.STRING, allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
}, {
    tableName: 'deleted_accounts',
    timestamps: true,
});

module.exports = DeletedAccount;
