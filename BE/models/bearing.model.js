const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bearing = sequelize.define('Bearing', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    model_name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    bearing_type: {
        type: DataTypes.STRING,
        defaultValue: 'Deep Groove Ball'
        // Types: Deep Groove Ball, Cylindrical Roller, Tapered Roller, Angular Contact, etc.
    },
    bore_diameter: {
        type: DataTypes.FLOAT, // mm
        allowNull: false
    },
    outer_diameter: {
        type: DataTypes.FLOAT, // mm
        allowNull: false
    },
    width: {
        type: DataTypes.FLOAT, // mm
        allowNull: false
    },
    dynamic_load_rating: {
        type: DataTypes.FLOAT, // kN (Dynamic Load Capacity)
        allowNull: false
    },
    static_load_rating: {
        type: DataTypes.FLOAT, // kN (Static Load Capacity)
        allowNull: false
    },
    limiting_speed: {
        type: DataTypes.INTEGER, // RPM
        defaultValue: 10000
    },
    price: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    manufacturer: {
        type: DataTypes.STRING,
        defaultValue: 'Unknown'
        // SKF, FAG, NSK, INA, Timken, etc.
    }
}, {
    tableName: 'bearings',
    timestamps: false
});

module.exports = Bearing;
