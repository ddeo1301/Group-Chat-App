const Sequelize = require('sequelize');
const sequelize = require('../util/database')

const groupTable = sequelize.define('groupTable', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey:true
    },
    isAdmin:{
        type: Sequelize.BOOLEAN
    }
})
 
module.exports = groupTable;