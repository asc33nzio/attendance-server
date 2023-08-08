'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Registrations extends Model {

    }
    Registrations.init({
        registrationId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            defaultValue: "employee"
        }
    }, {
        sequelize,
        modelName: 'Registrations',
    });
    return Registrations;
};
