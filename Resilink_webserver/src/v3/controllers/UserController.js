require('../loggers.js');
const config = require('../config.js');
const winston = require('winston');
const userService = require("../services/UserService.js");

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');

const pathUserODEP = config.PATH_ODEP_USER + 'users/';

/**
 * Authenticates a user and retrieves a JWT token from ODEP.
 * Express handler delegating to userService.functionGetTokenUser.
 *
 * @param {Object} req - Express request object (body: credentials payload)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the authentication token or a 500 error
 */
const getTokenUser = async (req, res) => {
    try {
      const response = await userService.functionGetTokenUser(req.body);
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getTokenUser', data: error, bodySent: req.body});
      res.status(500).send({message: error.message})
    }
};

/**
 * Creates a new user in ODEP.
 * Express handler delegating to userService.createUser.
 *
 * @param {Object} req - Express request object (body: user payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created user or a 500 error
 */
const createUser = async (req, res) => {
  try {
    const response = await userService.createUser(pathUserODEP, req.body, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Creates a new user in ODEP and stores their custom data in the RESILINK database.
 * Express handler delegating to userService.createUserResilink.
 *
 * @param {Object} req - Express request object (body: user payload with custom fields, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created user or a 500 error
 */
const createUserCustom = async (req, res) => {
  try {
    const response = await userService.createUserResilink(pathUserODEP, req.body, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUserCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Deletes a user by their ID from ODEP.
 * Express handler delegating to userService.deleteUser.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteUser = async (req, res) => {
  try {
    const response = await userService.deleteUser(pathUserODEP, req.params.userId, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Deletes a user from both ODEP and the RESILINK local database.
 * Express handler delegating to userService.deleteUserODEPRESILINK.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteUserODEPRESILINK = async (req, res) => {
  try {
    const response = await userService.deleteUserODEPRESILINK(pathUserODEP, req.params.userId, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a user by their ID from ODEP.
 * Express handler delegating to userService.getUserById.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the user data or a 500 error
 */
const getUserById = async (req, res) => {
  try {
    const response = await userService.getUserById(pathUserODEP, req.params.userId, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves all users from ODEP.
 * Express handler delegating to userService.getAllUser.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the full user list or a 500 error
 */
const getAllUser = async (req, res) => {
  try {
    const response = await userService.getAllUser(pathUserODEP, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves all users enriched with RESILINK-specific data (phone number, GPS).
 * Express handler delegating to userService.getAllUserCustom.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched user list or a 500 error
 */
const getAllUserCustom = async (req, res) => {
  try {
    const response = await userService.getAllUserCustom(pathUserODEP, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'getAllUserCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}


/**
 * Retrieves a user by their email address from ODEP.
 * Express handler delegating to userService.getUserByEmail.
 *
 * @param {Object} req - Express request object (params.userEmail: user email, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the user data or a 500 error
 */
const getUserByEmail = async (req, res) => {
  try {
    const response = await userService.getUserByEmail(pathUserODEP, req.params.userEmail, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a user by email enriched with RESILINK data (phone number, GPS).
 * Express handler delegating to userService.getUserByEmailCustom.
 *
 * @param {Object} req - Express request object (params.userEmail: user email, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched user data or a 500 error
 */
const getUserByEmailCustom = async (req, res) => {
  try {
    const response = await userService.getUserByEmailCustom(pathUserODEP, req.params.userEmail, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a user by their username from ODEP.
 * Express handler delegating to userService.getUserByUsername.
 *
 * @param {Object} req - Express request object (params.userName: username, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the user data or a 500 error
 */
const getUserByUsername = async (req, res) => {
  try {
    const response = await userService.getUserByUsername(pathUserODEP, req.params.userName, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a user by username enriched with RESILINK data (phone number, GPS).
 * Express handler delegating to userService.getUserByUsernameCustom.
 *
 * @param {Object} req - Express request object (params.userName: username, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched user data or a 500 error
 */
const getUserByUsernameCustom = async (req, res) => {
  try {
    const response = await userService.getUserByUsernameCustom(pathUserODEP, req.params.userName, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Updates a user's profile data in ODEP by their ID.
 * Express handler delegating to userService.updateUser.
 *
 * @param {Object} req - Express request object (params.userId: user ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated user or a 500 error
 */
const updateUser = async (req, res) => {
  try {
    const response = await userService.updateUser(pathUserODEP, req.params.userId, req.body, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Updates a user's profile in ODEP and their custom data in the RESILINK database.
 * Express handler delegating to userService.updateUserCustom.
 *
 * @param {Object} req - Express request object (params.userId: user ID, body: update payload with RESILINK fields, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated user or a 500 error
 */
const updateUserCustom = async (req, res) => {
  try {
    const response = await userService.updateUserCustom(pathUserODEP, req.params.userId, req.body, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a user by their ID enriched with RESILINK-specific data.
 * Express handler delegating to userService.getUserByIdCustom.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched user data or a 500 error
 */
const getUserbyIdCustom = async (req, res) => {
  try {
    const response = await userService.getUserByIdCustom(pathUserODEP, req.params.userId, req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, ''));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') == null ? "" : req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

  module.exports = {
    getTokenUser,
    createUser,
    createUserCustom,
    deleteUser,
    deleteUserODEPRESILINK,
    getUserById,
    getAllUser,
    getAllUserCustom,
    getUserByEmail,
    getUserByEmailCustom,
    getUserByUsername,
    getUserByUsernameCustom,
    updateUser,
    updateUserCustom,
    getUserbyIdCustom
};
  