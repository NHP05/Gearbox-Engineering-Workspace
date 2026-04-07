const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GearMaterial = sequelize.define('GearMaterial', {
    name: { // <--- Chỗ này phải là 'name'
        type: DataTypes.STRING, 
        primaryKey: true 
    },
    sigma_h_lim: { type: DataTypes.FLOAT },
    sigma_f_lim: { type: DataTypes.FLOAT },
    hb_hardness: { type: DataTypes.INTEGER }
}, { tableName: 'gear_materials', timestamps: false });
module.exports = GearMaterial;