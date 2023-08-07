'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Salaries extends Model {

    }
    Salaries.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Salaries',
        timestamps: false
    });
    return Salaries;
};
