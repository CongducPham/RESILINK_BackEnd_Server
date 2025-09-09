const express = require("express");
const userController = require("../controllers/UserController.js");
const router = express.Router();

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
 * /v1/users/auth/sign_in:
 *   post: 
 *     security:
 *         - noAuth: []
 *     summary: Retrieve data and access token from a user
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

router.post('/users/auth/sign_in/', userController.getTokenUser);

/**
 * @swagger
 * /v1/users/:
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

router.post('/users/', userController.createUser);

/**
 * @swagger
 * /v1/users/:
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

router.get('/users/', userController.getAllUser);

/**
 * @swagger
 * /v1/users/{userId}/:
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

router.get('/users/:userId', userController.getUserById);

/**
 * @swagger
 * /v1/users/getUserByEmail/{userEmail}/:
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

router.get('/users/getUserByEmail/:userEmail', userController.getUserByEmail);

/**
 * @swagger
 * /v1/users/getUserByUserName/{userName}/:
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

router.get('/users/getUserByUserName/:userName', userController.getUserByUsername);

/**
 * @swagger
 * /v1/users/{userName}/:
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

router.delete('/users/:userName', userController.deleteUser);

/**
 * @swagger
 * /v1/users/{userName}/:
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

router.put('/users/:userName', userController.updateUser);

module.exports = router;
