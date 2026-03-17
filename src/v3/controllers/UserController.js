require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const userService = require("../services/UserService.js");

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');

/**
 * HTTP POST - Authenticates user and returns JWT token.
 * Login endpoint that validates credentials and generates access token.
 * No middleware protection (public endpoint).
 * 
 * @route POST /users/token
 * @param {Request} req - Express request with email/password in body
 * @param {Response} res - Express response object
 * @returns {Object} JWT token and user information
 */
const getTokenUser = async (req, res) => {
  try {
    const response = await userService.functionGetTokenUser(req.body);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getTokenUser',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Creates new user account in RESILINK platform.
 * Registers user with email, username, password, and assigns localhost.
 * Initializes user profile for marketplace participation.
 * 
 * @route POST /users
 * @param {Request} req - Express request with user data in body
 * @param {Response} res - Express response object
 * @returns {Object} Created user profile with generated ID
 */
const createUser = async (req, res) => {
  try {
    const response = await userService.createUser(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'createUser',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes user account permanently.
 * Deletes user.
 * Only user owner or admin can delete.
 * 
 * @route DELETE /users/:userId
 * @param {Request} req - Express request with user ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteUser = async (req, res) => {
  try {
    const response = await userService.deleteUser(req.params.userId, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'deleteUser',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves user profile by ID.
 * Returns user details including email, username, and assigned localhost.
 * Used for displaying user information across platform.
 * 
 * @route GET /users/:userId
 * @param {Request} req - Express request with user ID in params
 * @param {Response} res - Express response object
 * @returns {Object} User profile or error if not found
 */
const getUserById = async (req, res) => {
  try {
    const response = await userService.getUserById(req.params.userId, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'getUserById',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all registered users.
 * Returns complete list of platform users.
 * Used for admin dashboard and user management.
 * 
 * @route GET /users
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} List of all user profiles
 */
const getAllUser = async (req, res) => {
  try {
    const response = await userService.getAllUser(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'getAllUser',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves user profile by email address.
 * Finds user account using unique email identifier.
 * Used during login and registration validation.
 * 
 * @route GET /users/email/:userEmail
 * @param {Request} req - Express request with email in params
 * @param {Response} res - Express response object
 * @returns {Object} User profile or error if not found
 */
const getUserByEmail = async (req, res) => {
  try {
    const response = await userService.getUserByEmail(req.params.userEmail, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'getUserByEmail',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves user profile by username.
 * Finds user account using unique username identifier.
 * Used for user search and profile viewing.
 * 
 * @route GET /users/username/:userName
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} User profile or error if not found
 */
const getUserByUsername = async (req, res) => {
  try {
    const response = await userService.getUserByUsername(req.params.userName, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'getUserByUsername',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates user profile information.
 * Users modify email, username, password, or preferences.
 * Only user owner or admin can update their profile.
 * 
 * @route PUT /users/:userId
 * @param {Request} req - Express request with user ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated user profile or error if unauthorized
 */
const updateUser = async (req, res) => {
  try {
    const response = await userService.updateUser(
      req.params.userId,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'updateUser',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes user activity logs.
 * Deletes user's operation logs while preserving account.
 * Used for privacy compliance (GDPR).
 * 
 * @route DELETE /users/:userName/logs
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteUserLogs = async (req, res) => {
  try {
    const response = await userService.deleteUserLogs(req.params.userName, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'deleteUserLogs',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes user account with all data and logs.
 * Complete user data erasure (account + activity logs).
 * Most comprehensive deletion for GDPR compliance.
 * 
 * @route DELETE /users/:userName/complete
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteUserDataAndLogs = async (req, res) => {
  try {
    const response = await userService.deleteUserDataAndLogs(
      req.params.userName,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'deleteUserDataAndLogs',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Changes the password of the authenticated user.
 * Accepts old password (plain-text or bcrypt hash) and new password.
 * Returns the new bcrypt hash so mobile apps can store it instead of plain text.
 * 
 * @route PUT /users/password
 * @param {Request} req - Express request with { oldPassword, newPassword } in body
 * @param {Response} res - Express response object
 * @returns {Object} Success message with new hashed password, or error
 */
const changePassword = async (req, res) => {
  try {
    const response = await userService.changePassword(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'changePassword',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getTokenUser,
  createUser,
  deleteUser,
  getUserById,
  getAllUser,
  getUserByEmail,
  getUserByUsername,
  updateUser,
  changePassword,
  deleteUserLogs,
  deleteUserDataAndLogs
};
