const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD, 
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                rejectUnauthorized: false // Cho phép kết nối SSL mà không cần file cert cục bộ
            }
        },
        logging: false // Tắt log SQL để terminal sạch hơn
    }
);

module.exports = sequelize;