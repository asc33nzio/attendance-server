const db = require("../models");
const users = db.Users;
const registrations = db.Registrations;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    getAllEmployees: async (req, res) => {
        try {
            const result = await users.findAll({ where: { isAdmin: false } });
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            });
        };
    },
    addEmployeePrelim: async (req, res) => {
        try {
            const { username, role } = req.body;
            const isUserExist = await users.findOne({ where: { username } });
            if (isUserExist) {
                return res.status(400).send({
                    status: 400,
                    message: "Username has been used."
                });
            };

            const registrationId = uuidv4();

            await registrations.create({
                registrationId,
                username,
                role,
            });

            const token = jwt.sign({ registrationId, username, role }, process.env.KEY_JWT, { expiresIn: '1h' });

            res.status(200).send({
                status: 200,
                message: "Preliminary registration process successful.",
                token
            });
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    addEmployee: async (req, res) => {
        try {
            const { token } = req.params;
            const { firstName, lastName, birthDate, email, password } = req.body;
            const avatar = req.file.filename;

            const decodedToken = jwt.verify(token, process.env.KEY_JWT);
            const { registrationId, username, role } = decodedToken;

            const registrationData = await registrations.findOne({ where: { registrationId } });
            if (!registrationData) {
                return res.status(400).send({
                    status: 400,
                    message: 'Invalid registration token.',
                });
            }

            const isEmailExist = await users.findOne({ where: { email } });
            if (isEmailExist) {
                throw { message: 'E-mail has been used.' };
            };
            if (!firstName || !lastName) throw { message: "Both first name and last name are required." };
            if (!birthDate) throw { message: "Birth date is required." };
            if (!email) throw { message: "E-mail is required." };
            if (!password) throw { message: "Password is required." };
            if (!avatar) throw { message: "Profile image is required." };

            const salt = await bcrypt.genSalt(5);
            const hashPassword = await bcrypt.hash(password, salt);

            const result = await users.create({
                username,
                firstName,
                lastName,
                birthDate,
                email,
                password: hashPassword,
                role,
                avatar,
            });

            await registrations.destroy({ where: { registrationId } });

            res.status(200).send({
                status: 200,
                message: 'New user registration successful.',
                result,
            });
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    addAdmin: async (req, res) => {
        try {
            const { username, firstName, lastName, birthDate, email, password, masterKey } = req.body;
            const avatar = req.file.filename;
            const isUserExist = await users.findOne({ where: { username } });
            const isEmailExist = await users.findOne({ where: { email } });
            if (isUserExist) throw { message: "Username has been used." };
            if (isEmailExist) throw { message: "E-mail has been used." };
            if (!firstName || !lastName) throw { message: "Both first name and last name are required." };
            if (!birthDate) throw { message: "Birth date is required." };
            if (!email) throw { message: "E-mail is required." };
            if (!password) throw { message: "Password is required." };
            if (masterKey !== process.env.MASTER_KEY || !masterKey) {
                return res.status(403).send({
                    status: 403,
                    message: "Forbidden. Wrong Master Key."
                });
            };

            const salt = await bcrypt.genSalt(5);
            const hashPassword = await bcrypt.hash(password, salt);
            const result = await users.create({ username, firstName, lastName, birthDate, email, role: "hrga", password: hashPassword, avatar, isAdmin: true });

            res.status(200).send({
                status: 200,
                message: `Admin registration success. Welcome ${username}.`,
                result
            });
        } catch (error) {
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    updateEmployeeData: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            const avatar = req.file.filename;
            const { id } = req.params;

            const salt = await bcrypt.genSalt(5);
            const hashPassword = await bcrypt.hash(password, salt);
            const result = await users.update({ username, email, password: hashPassword, avatar }, { where: { id } });

            res.status(200).send({
                status: 200,
                message: "Updated!",
                result
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({
                error,
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    suspendEmployee: async (req, res) => {
        try {
            const cashierId = req.params.id;
            const findUser = await users.findOne({ where: { id: cashierId } });
            if (!findUser) {
                return res.status(400).send({
                    status: 404,
                    message: "User not found.",
                    Error
                });
            };
            if (findUser.isSuspended) {
                await findUser.update(
                    { isSuspended: false },
                    { where: { id: findUser.id } }
                )
                res.status(200).send({ message: "cashier already active" })
            }
            else {
                await findUser.update(
                    { isSuspended: true },
                    { where: { id: findUser.id } }
                )
                res.status(200).send({ message: "Cashier Suspended" })
            }
        } catch (error) {
            return res.status(500).send({
                status: 500,
                message: 'Internal server error.',
            });
        }
    },
    deleteEmployee: async (req, res) => {
        try {
            const cashierId = req.params.id;
            const token = req.headers.authorization.split(' ')[1];
            const decodeUser = jwt.verify(token, process.env.KEY_JWT);
            const userId = decodeUser.id;
            const article = await users.findOne({ where: { id: cashierId } });
            if (!users) {
                return res.status(400).send({
                    status: 404,
                    message: "Cashier not found."
                });
            };
            const validUser = await users.findByPk(userId);
            if (!validUser) {
                return res.status(400).send({
                    status: 404,
                    message: "User not found."
                });
            };
            if (validUser.isAdmin === true || article.authorId === userId) {
                await users.destroy({
                    where: { id: cashierId }
                });
            } else {
                return res.status(400).send({
                    status: 403,
                    WARNING: "EPERM(1): ACCESS DENIED",
                    message: "Forbidden. You are not the author of this article and you are not an administrator."
                });
            };
            res.status(200).send({ message: "Deleted" })
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            });
        }
    },
    getEmployeeById: async (req, res) => {
        try {
            const result = await users.findOne({
                where: { id: req.params.id }
            })
            res.status(200).send(result)
        } catch (error) {
            res.status(200).send(error)
        }
    },
};