const adminControllers = require("../controllers/adminControllers");
const { verifyToken, checkRole } = require("../middleware/auth");
const { multerUpload } = require("../middleware/multer");
const router = require('express').Router();

router.post("/", verifyToken, checkRole, multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.addEmployee);
router.post("/webmaster", multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.addAdmin);
router.get("/all", adminControllers.getAllEmployees);
router.get("/detailCashier/:id", adminControllers.getEmployeeById);
router.patch("/updateCashier/:id", verifyToken, checkRole, multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.updateEmployeeData);
router.patch('/suspendCashier/:id', verifyToken, checkRole, adminControllers.suspendEmployee);
router.delete('/deletecashier/:id', verifyToken, checkRole, adminControllers.deleteEmployee);

module.exports = router;