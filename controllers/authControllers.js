const db = require('../models');
const users = db.Users;
const changePasswords = db.ChangePasswords;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require("fs")
const handlebars = require("handlebars")
const transporter = require("../middleware/transporter.js")

module.exports = {
    employeeLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            const checkLogin = await users.findOne({
                where: { username: username }
            });

            if (!checkLogin) throw { message: "User not Found." };
            if (checkLogin.isSuspended === true) throw { message: "You are Suspended." };
            if (!checkLogin.isAdmin === false) throw { message: "As a HRGA admin, you have to login on the admin tab." };

            const isValid = await bcrypt.compare(password, checkLogin.password);

            if (!isValid) throw { message: "Username or password is incorrect." };

            const payload = { id: checkLogin.id, isAdmin: checkLogin.isAdmin };
            const token = jwt.sign(payload, process.env.KEY_JWT, { expiresIn: "3h" });

            res.status(200).send({
                message: "Login success",
                user: checkLogin,
                token
            });
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error',
            });
        }
    },
    adminLogin: async (req, res) => {
        try {
            const { username, password } = req.body;
            const checkLogin = await users.findOne({
                where: { username: username }
            });

            if (!checkLogin) throw { message: "User not Found." }
            if (checkLogin.isSuspended === true) throw { message: "You are suspended." }
            if (checkLogin.isAdmin === false) throw { message: "You are not an admin. You have to login on the employee tab." }

            const isValid = await bcrypt.compare(password, checkLogin.password);

            if (!isValid) throw { message: "Username or password is incorrect." };

            const payload = { id: checkLogin.id, isAdmin: checkLogin.isAdmin };
            const token = jwt.sign(payload, process.env.KEY_JWT, { expiresIn: "3h" });

            res.status(200).send({
                message: "Login success",
                user: checkLogin,
                token
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error',
            });
        }
    },
    keepLogin: async (req, res) => {
        try {
            const result = await users.findOne({
                where: {
                    id: req.user.id
                }
            });
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            });
        }
    },
    forgetPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const findUser = await users.findOne({ where: { email: email } });
            if (!findUser) {
                return res.status(404).send({
                    status: 404,
                    message: "E-mail not found."
                });
            };
            const payload = { id: findUser.id };

            const token = jwt.sign(payload, process.env.KEY_JWT, { expiresIn: "1h" });

            await changePasswords.create({
                userId: findUser.id,
                token
            });

            const data = fs.readFileSync("./forget_password_template.html", "utf-8");
            const tempCompile = handlebars.compile(data);
            const tempResult = tempCompile({ username: findUser.username });
            const htmlWithToken = tempResult.replace('TOKEN_PLACEHOLDER', token);

            await transporter.sendMail({
                from: "asc33nzio.dev@gmail.com",
                to: email,
                subject: "Reset Your SCP AMS Account Password.",
                html: htmlWithToken
            });
            res.status(200).send(token);
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        };
    },
    resetPassword: async (req, res) => {
        try {
            const { newPassword, confirmPassword } = req.body;
            const authorizationHeader = req.headers.authorization;
            const token = authorizationHeader.split(' ')[1];

            const tokenStatus = await changePasswords.findOne({
                where: {
                    userId: req.user.id,
                    token: token
                }
            });

            if (tokenStatus.used === true) {
                return res.status(400).send({
                    status: 400,
                    message: "Expired. Token has been used."
                })
            };

            if (newPassword !== confirmPassword) throw { message: "Password does not match." }
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash(confirmPassword, salt);
            await users.update(
                { password: hashPassword },
                { where: { id: req.user.id } }
            );
            await changePasswords.update(
                { used: true },
                { where: { id: tokenStatus.id } }
            );
            res.status(200).send({ message: "Password has been changed." });
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
            console.log(error);
        };
    },
    updateProfile: async (req, res) => {
        try {
            const result = await users.update({
                avatar: req.file.filename,
            }, {
                where: { id: req.user.id }
            });
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
};