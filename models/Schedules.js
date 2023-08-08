'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Schedules extends Model {

    }
    Schedules.init({
        day: {
            type: DataTypes.STRING,
            allowNull: false
        },
        shiftStart: {
            type: DataTypes.TIME,
            allowNull: true
        },
        shiftEnd: {
            type: DataTypes.TIME,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Schedules',
        timestamps: false
    });
    return Schedules;
};
