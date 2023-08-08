const router = require('express').Router();
const attendanceControllers = require("../controllers/attendanceControllers");

router.get("/schedules", attendanceControllers.getSchedules);

module.exports = router;