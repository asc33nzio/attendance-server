const db = require('../models');
const { Op } = require("sequelize")
const schedules = db.Schedules;
const attendances = db.Attendances;
const salaries = db.Salaries;

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
            });
        };
    },
    clockIn: async (req, res) => {
        try {
            const userId = req.params.id;
            const indochinaTime = new Date().getTime() + 7 * 60 * 60 * 1000;

            const existingAttendance = await attendances.findOne({
                where: {
                    UserId: userId,
                    clockInTime: {
                        [Op.gte]: new Date().setUTCHours(0, 0, 0, 0) + 7 * 60 * 60 * 1000,
                    },
                    clockOutTime: {
                        [Op.ne]: null,
                    },
                },
            });

            if (existingAttendance) {
                return res.status(400).send({
                    status: 400,
                    message: 'You have already clocked in and out for today.',
                });
            };

            const existingClockIn = await attendances.findOne({
                where: {
                    UserId: userId,
                    clockInTime: {
                        [Op.gte]: new Date().setUTCHours(0, 0, 0, 0) + 7 * 60 * 60 * 1000,
                    },
                    clockOutTime: null,
                },
            });

            if (existingClockIn) {
                return res.status(400).send({
                    status: 400,
                    message: 'You have already clocked in for today.',
                });
            }

            await attendances.create({
                UserId: userId,
                clockInTime: new Date(indochinaTime),
            });

            res.status(200).send({
                status: 200,
                message: 'Clock-in successful.',
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    clockOut: async (req, res) => {
        try {
            const userId = req.params.id;
            const indochinaTime = new Date().getTime() + 7 * 60 * 60 * 1000;

            const existingAttendance = await attendances.findOne({
                where: {
                    UserId: userId,
                    clockInTime: {
                        [Op.gte]: new Date().setUTCHours(0, 0, 0, 0) + 7 * 60 * 60 * 1000,
                    },
                    clockOutTime: null
                },
            });

            if (!existingAttendance) {
                return res.status(400).send({
                    status: 400,
                    message: "You haven't clocked in or have already clocked out today.",
                });
            }

            const timeDifferenceMillis = new Date(indochinaTime) - existingAttendance.clockInTime;
            const hours = Math.floor(timeDifferenceMillis / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifferenceMillis % (1000 * 60 * 60)) / (1000 * 60));

            const timeWorked = hours + (minutes / 100);

            existingAttendance.clockOutTime = new Date(indochinaTime);
            existingAttendance.timeWorked = timeWorked;
            await existingAttendance.save();

            res.status(200).send({
                status: 200,
                message: 'Clock-out successful.',
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    getDailyUserAttendance: async (req, res) => {
        try {
            const userId = req.params.id;
            const currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0);

            const attendanceForToday = await attendances.findOne({
                where: {
                    UserId: userId,
                    clockInTime: {
                        [Op.gte]: currentDate,
                    },
                },
                order: [['clockInTime', 'ASC']],
            });

            res.status(200).send({
                status: 200,
                message: 'Attendance for today fetched successfully.',
                result: attendanceForToday,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    getAllUserAttendance: async (req, res) => {
        try {
            const userId = req.params.id;
            const currentDate = new Date();
            currentDate.setUTCHours(0, 0, 0, 0);

            const attendance = await attendances.findAll({
                where: { UserId: userId },
                order: [['clockInTime', 'ASC']],
            });

            res.status(200).send({
                status: 200,
                message: `Attendance for user ${userId} fetched successfully.`,
                result: attendance
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    getSalaries: async (req, res) => {
        try {
            const response = await salaries.findAll()

            res.status(200).send({
                status: 200,
                message: "Schedules fetched successfully.",
                response
            })
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            });
        }
    }
};