const router = require('express').Router();
const attendanceControllers = require("../controllers/attendanceControllers");

router.get("/schedules", attendanceControllers.getSchedules);
router.get("/salaries", attendanceControllers.getSalaries);
router.post("/in/:id", attendanceControllers.clockIn);
router.patch("/out/:id", attendanceControllers.clockOut);
router.get("/today/:id", attendanceControllers.getDailyUserAttendance);
router.get("/all/:id", attendanceControllers.getAllUserAttendance);

module.exports = router;