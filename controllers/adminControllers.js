const db = require("../models");
const users = db.Users;
const registrations = db.Registrations;
const salaries = db.Salaries;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const transporter = require('../middleware/transporter');
const fs = require('fs');
const handlebars = require('handlebars');
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
    getRoles: async (req, res) => {
        try {
            const results = await salaries.findAll();
            const roles = results.map(role => ({ id: role.id, name: role.name }));
            res.status(200).send(roles);
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "Internal server error."
            });
        }
    },
    addEmployeePrelim: async (req, res) => {
        try {
            const username = req.body.username;
            const email = req.body.email;
            const role = req.body.role;
            if (!username) throw { message: "Username is required." }
            const isUserExist = await users.findOne({ where: { username: username } });
            if (isUserExist) {
                return res.status(400).send({
                    status: 400,
                    message: "Username has been used."
                });
            };

            if (!email) throw { message: "E-mail is required." };
            const isEmailExist = await users.findOne({ where: { email } });
            if (isEmailExist) {
                return res.status(400).send({
                    status: 400,
                    message: "E-mail address has been used."
                });
            };

            const registrationId = uuidv4();

            await registrations.create({
                registrationId,
                username,
                email,
                role,
            });

            const token = jwt.sign({ registrationId, username, email, role }, process.env.KEY_JWT, { expiresIn: '1h' });

            const data = fs.readFileSync('./register_template.html', 'utf-8');
            const tempCompile = handlebars.compile(data);
            const tempResult = tempCompile({ username: username });
            const htmlWithToken = tempResult.replace('TOKEN_PLACEHOLDER', token);

            await transporter.sendMail({
                from: 'asc33nzio.dev@gmail.com',
                to: email,
                subject: 'SCP AMS New Account',
                html: htmlWithToken
            });

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
            console.error(error)
        }
    },
    addEmployee: async (req, res) => {
        try {
            const { token } = req.params;
            const { firstName, lastName, birthDate, password } = req.body;
            const avatar = req.file.filename;
            const decodedToken = jwt.verify(token, process.env.KEY_JWT);
            const { registrationId, username, email, role } = decodedToken;

            const registrationData = await registrations.findOne({ where: { registrationId } });
            if (!registrationData) {
                return res.status(400).send({
                    status: 400,
                    message: 'Invalid registration token. Please contact your HRGA admin and request a new registration link.',
                });
            }
            if (!firstName || !lastName) throw { message: "Both first name and last name are required." };
            if (!birthDate) throw { message: "Birth date is required." };
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
            console.error(error)
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
            const { id } = req.params;
            const avatar = req.file.filename;

            const findUser = await users.findOne({
                where: {
                    id: id
                }
            });

            if (findUser.username === username && findUser.email === email) {
                return res.status(400).send({
                    status: 400,
                    message: "Nothing has changed."
                })
            };

            if (findUser.username !== username) {
                const existingUsername = await users.findOne({
                    where: {
                        username: username
                    }
                });
                if (existingUsername) {
                    return res.status(400).send({
                        status: 400,
                        message: "Username already exists."
                    });
                };
            };

            if (findUser.email !== email) {
                const existingEmail = await users.findOne({
                    where: {
                        email: email
                    }
                });
                if (existingEmail) {
                    return res.status(400).send({
                        status: 400,
                        message: "E-mail already exists."
                    });
                };
            };

            const salt = await bcrypt.genSalt(5);
            const hashPassword = await bcrypt.hash(password, salt);
            await users.update({ username, email, password: hashPassword, avatar }, { where: { id } });

            const updatedUser = await users.findOne({
                where: {
                    id: id
                }
            });

            res.status(200).send({
                status: 200,
                message: "Employee info updated!",
                updatedUser
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
            const employeeId = req.params.id;
            const findUser = await users.findOne({ where: { id: employeeId } });
            if (!findUser) {
                return res.status(400).send({
                    status: 404,
                    message: "User not found."
                });
            };
            if (findUser.isSuspended) {
                await findUser.update(
                    { isSuspended: false },
                    { where: { id: findUser.id } }
                )
                res.status(200).send({ message: "Employee status: active" })
            }
            else {
                await findUser.update(
                    { isSuspended: true },
                    { where: { id: findUser.id } }
                )
                res.status(200).send({ message: "Employee Suspended" })
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
            const employeeId = req.params.id;
            const token = req.headers.authorization.split(' ')[1];
            const decodeUser = jwt.verify(token, process.env.KEY_JWT);
            const userId = decodeUser.id;
            const article = await users.findOne({ where: { id: employeeId } });
            if (!users) {
                return res.status(400).send({
                    status: 404,
                    message: "Employee not found."
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
                    where: { id: employeeId }
                });
            } else {
                return res.status(400).send({
                    status: 403,
                    WARNING: "EPERM(1): ACCESS DENIED",
                    message: "Forbidden. You are not an admin."
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