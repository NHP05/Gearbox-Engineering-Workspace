const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: require('path').join(__dirname, '..', 'gearbox.sqlite'),
    logging: false,
});

module.exports = sequelize;
