'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Attendances extends Model {
        static associate(models) {
            Attendances.belongsTo(models.Users);
        }
    }
    Attendances.init({
        clockInTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        clockOutTime: {
            type: DataTypes.DATE,
            defaultValue: null
        },
        timeWorked: {
            type: DataTypes.FLOAT,
            defaultValue: null
        }
    }, {
        sequelize,
        modelName: 'Attendances',
        timestamps: false
    });
    return Attendances;
};