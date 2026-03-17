const express = require("express");
const userController = require("../controllers/UserController.js");
const router = express.Router();
const config = require('../config.js');
const auth = require("../../middlewares/optionalAuth.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * @swagger
 * tags:
 *   name: users
 *   description: User of the application.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       description: "Details required to create or manage a user account, including personal information and credentials."
 *       required:
 *         - userName
 *         - firstName
 *         - lastName
 *         - roleOfUser
 *         - email
 *         - password
 *       properties:
 *         userName:
 *           type: string
 *           description: "The username chosen by the user, must be unique."
 *         firstName:
 *           type: string
 *           description: "The first name of the user."
 *         lastName:
 *           type: string
 *           description: "The last name of the user."
 *         roleOfUser:
 *           type: string
 *           description: "The role assigned to the user (e.g., admin, user)."
 *         email:
 *           type: string
 *           description: "The user's email address, used for login and communication."
 *         phoneNumber: 
 *           type: string
 *           description: "The phone number of the user"
 *         password:
 *           type: string
 *           description: "The password for the user account, must have a minimum length of 6 characters."
 *           minLength: 6
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserDetails:
 *       type: object
 *       description: "Details about a user, including identification, roles, and account information."
 *       properties:
 *         _id:
 *           type: string
 *           description: "The unique identifier of the user."
 *         userName:
 *           type: string
 *           description: "The username chosen by the user."
 *         firstName:
 *           type: string
 *           description: "The first name of the user."
 *         lastName:
 *           type: string
 *           description: "The last name of the user."
 *         roleOfUser:
 *           type: string
 *           description: "The role assigned to the user (e.g., admin, user)."
 *         email:
 *           type: string
 *           description: "The email address of the user."
 *         provider:
 *           type: string
 *           description: "The authentication provider for the user (e.g., Google, Facebook)."
 *         account:
 *           type: string
 *           description: "The account information associated with the user, often related to the provider."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: "The timestamp when the user was created."
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: "The timestamp when the user details were last updated."
 *         phoneNumber: 
 *           type: string
 *           description: "The phone number of the user"
 *         gps: 
 *           type: string
 *           description: "The gps of the user"
 */

/**
 * @swagger
 * /v3/users/auth/sign_in:
 *   post: 
 *     security:
 *         - noAuth: []
 *     summary: Retrieve data and access token from a user
 *     description: |
 *       Authenticates a user and returns JWT token.
 *       The password field accepts both plain-text and bcrypt-hashed passwords.
 *       Mobile apps can store the bcrypt hash (returned by sign-in or change-password)
 *       and use it directly for future sign-ins, avoiding plain-text password storage.
 *     tags: [users]
 *     requestBody:
 *       description: Sign in to get access token.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Plain-text password or bcrypt hash (starting with $2b$ or $2a$)
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userName:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleOfUser:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string
 *                   description: Bcrypt hash — store this locally instead of plain-text for future sign-ins
 *                 provider:
 *                   type: string
 *                 account:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 gps:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.post('/users/auth/sign_in/', auth({ required: false }), userController.getTokenUser);

/**
 * @swagger
 * /v3/users/password:
 *   put: 
 *     summary: Change the password of the authenticated user
 *     description: |
 *       Accepts the old password as either plain-text or bcrypt hash.
 *       This allows mobile apps to store the bcrypt hash instead of the plain-text password.
 *       Returns the new bcrypt hash in the response for local storage.
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Current password (plain-text or bcrypt hash)
 *               newPassword:
 *                 type: string
 *                 description: New password (plain-text, min 6 characters)
 *     responses:
 *       200:
 *         description: Password successfully changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 hashedPassword:
 *                   type: string
 *                   description: New bcrypt hash to store locally instead of plain-text password
 *       400:
 *         description: Missing fields or new password too short
 *       401:
 *         description: Old password is incorrect
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

router.put('/users/password/', auth({ required: true }), userController.changePassword);

/**
 * @swagger
 * /v3/users/:
 *   post: 
 *     summary: Create a new User 
 *     tags: [users]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *            type: string
 *            enum: [http://localhost:22000, http://localhost:22001, http://localhost:22002, http://localhost:22003, http://localhost:22004, http://localhost:22005, http://localhost:22006]
 *         description: provider value that needs to be considered for account allocation
 *     requestBody:
 *       description: User object that needs to be added to the application
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleOfUser:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string 
 *               phoneNumber:
 *                 type: string
 *               gps: 
 *                 type: string
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userName:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleOfUser:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string 
 *                 provider:
 *                   type: string
 *                 account:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 gps: 
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.post('/users/', auth({ required: true }), userController.createUser);

/**
 * @swagger
 * /v3/users/:
 *   get:
 *     summary: Return list of users 
 *     tags: [users]
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: 
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userName:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   roleOfUser:
 *                     type: string
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string 
 *                   provider:
 *                     type: string
 *                   account:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   gps: 
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.get('/users/', auth({ required: tokenRequired }), userController.getAllUser);

/**
 * @swagger
 * /v3/users/{userId}/:
 *   get: 
 *     summary: Find user by ID 
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
 *         description: ID of user to return
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userName:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleOfUser:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string 
 *                 provider:
 *                   type: string
 *                 account:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 gps: 
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.get('/users/:userId', auth({ required: tokenRequired }), userController.getUserById);

/**
 * @swagger
 * /v3/users/getUserByEmail/{userEmail}/:
 *   get: 
 *     summary: get user by Email 
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userEmail
 *         schema:
 *           type: string 
 *         required: true
 *         description: Email of user to return
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userName:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleOfUser:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string 
 *                 provider:
 *                   type: string
 *                 account:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 gps: 
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.get('/users/getUserByEmail/:userEmail', auth({ required: tokenRequired }), userController.getUserByEmail);

/**
 * @swagger
 * /v3/users/getUserByUserName/{userName}/:
 *   get: 
 *     summary: Username of user to return 
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userName
 *         schema:
 *           type: string 
 *         required: true
 *         description: the user username
 *     responses:
 *       200:
 *         description: successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userName:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 roleOfUser:
 *                   type: string
 *                 email:
 *                   type: string
 *                 password:
 *                   type: string 
 *                 provider:
 *                   type: string
 *                 account:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 gps: 
 *                   type: string
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.get('/users/getUserByUserName/:userName', auth({ required: tokenRequired }), userController.getUserByUsername);

/**
 * @swagger
 * /v3/users/{userId}:
 *   delete: 
 *     summary: Delete user
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
 *         description: ID of user to delete
 *     responses:
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.delete('/users/:userId/', auth({ required: true }), userController.deleteUser);

/**
 * @swagger
 * /v3/users/{userId}/:
 *   put: 
 *     summary: Update an existing user
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string 
 *         required: true
 *         description: ID of user to update
 *     requestBody:
 *       description: User object that needs to be added to the application
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               roleOfUser:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string 
 *               phoneNumber:
 *                 type: string
 *               gps:
 *                 type: string
 *     responses:
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.put('/users/:userId', auth({ required: true }), userController.updateUser);

/**
 * @swagger
 * /v3/users/allData/{userName}:
 *   delete: 
 *     summary: Delete user
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userName
 *         schema:
 *           type: string 
 *         required: true
 *         description: userName of user data and logs to delete
 *     responses:
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.delete('/users/allData/:userName/', auth({ required: true }), userController.deleteUserDataAndLogs);

/**
 * @swagger
 * /v3/users/logs/{userName}:
 *   delete: 
 *     summary: Delete user logs
 *     tags: [users]
 *     parameters:
 *       - in: path
 *         name: userName
 *         schema:
 *           type: string 
 *         required: true
 *         description: userName of user to delete
 *     responses:
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Error from RESILINK server.
 *         content:
 *           application/json:
 *             schema:
 *                type: object
 *                properties:
 *                    message:
 *                        type: string
 */

router.delete('/users/logs/:userName/', auth({ required: true }), userController.deleteUserLogs);

module.exports = router;
