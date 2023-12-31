require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { join } = require("path");
const db = require('./models');
const { adminRouters, authRouters, attendanceRouters } = require("./routers");
const PORT = process.env.PORT || 8000;
const server = express();

// server.use(
//   cors({
//     origin: [
//       process.env.WHITELISTED_DOMAIN &&
//         process.env.WHITELISTED_DOMAIN.split(","),
//     ],
//   })
// );

server.use(cors())
server.use(express.json());
server.use(express.static('./public'));

//#region API ROUTES
// ===========================
server.use('/api/users', authRouters);
server.use('/api/admin', adminRouters);
server.use('/api/attendance', attendanceRouters);


server.get("/api", (req, res) => {
  res.send(`Welcome to SCP Attendance REST API.`);
});

server.get("/api/greetings", (req, res, next) => {
  res.status(200).json({
    message: "Greetings SCP Admin.",
  });
});

// ===========================

// not found
server.use((req, res, next) => {
  if (req.path.includes("/api/")) {
    res.status(404).send("Not found !");
  } else {
    next();
  }
});

// error
server.use((err, req, res, next) => {
  if (req.path.includes("/api/")) {
    console.error("Error : ", err.stack);
    res.status(500).send("Error !");
  } else {
    next();
  }
});

//#endregion

//#region CLIENT
const clientPath = "../../client/build";
server.use(express.static(join(__dirname, clientPath)));

// Serve the HTML page
server.get("*", (req, res) => {
  res.sendFile(join(__dirname, clientPath, "index.html"));
});

//#endregion

server.listen(PORT, (err) => {
  if (err) {
    console.log(`ERROR: ${err}`);
  } else {
    db.sequelize.sync({ alter: true });
    console.log(`SERVER IS RUNNING AT PORT:${PORT} ✅`);
  }
});