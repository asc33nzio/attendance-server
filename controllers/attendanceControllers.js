const db = require('../models');
const schedules = db.Schedules;

module.exports = {
    getSchedules: async (req, res) => {
        try {
            const response = await schedules.findAll()

            res.status(200).send({
                status: 200,
                message: "Schedules fetched successfully.",
                response
            })
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            })
        }
    },
};