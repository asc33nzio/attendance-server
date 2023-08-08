const adminControllers = require("../controllers/adminControllers");
const { verifyToken, checkRole } = require("../middleware/auth");
const { multerUpload } = require("../middleware/multer");
const router = require('express').Router();

router.post("/", verifyToken, checkRole, adminControllers.addEmployeePrelim);
router.post("/webmaster", multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.addAdmin);
router.post("/:token", multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.addEmployee);
router.get("/all", adminControllers.getAllEmployees);
router.get("/roles", adminControllers.getRoles);
router.get("/detail/:id", adminControllers.getEmployeeById);
router.patch("/:id", verifyToken, checkRole, multerUpload(`./public/avatars`, 'Avatar').single('avatar'), adminControllers.updateEmployeeData);
router.patch('/suspend/:id', verifyToken, checkRole, adminControllers.suspendEmployee);
router.delete('/:id', verifyToken, checkRole, adminControllers.deleteEmployee);

module.exports = router;