require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');

const User = require("../database/UserDB.js");
const AssetTypeDB = require("../database/AssetTypeDB.js");
const RecommendationStatsDB = require("../database/RecommendationStatsDB.js");
const FavoriteServersDB = require("../database/FavoriteServersDB.js");
const Utils = require('./Utils.js');
const bcrypt = require('bcrypt');

/**
 * Server instance identifier indicating this machine's address in the RESILINK network.
 * Used for distributed architecture where users are partitioned across multiple servers.
 * Each server instance has a unique localhost value (e.g., 22000-22004 for load balancing).
 */
const _localhost = "22003";

/**
 * Authenticates a user and retrieves their access token.
 * Primary login endpoint that validates credentials and generates JWT tokens.
 * Automatically stores token in session store for subsequent authentication checks.
 * 
 * @param {Object} body - Login credentials (userName, password)
 * @returns {Promise<Array>} - [userData with accessToken, statusCode] tuple
 */
const functionGetTokenUser = async (body) => {
  try {
    const data = {};
    await User.getUserAndToken(body, data);
    Utils.saveUserToken(data['userName'], data['accessToken']);

    getDataLogger.info('Token successfully retrieved for user', {
      from: 'functionGetTokenUser',
      username: data.userName
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving token', {
      from: 'functionGetTokenUser',
      error: e.message
    });
    throw e;
  }
};

/**
 * Creates a new user account in the RESILINK platform.
 * Validates email format and role assignment (prosumer or regulator).
 * Prevents reserved usernames ('anonymous', 'token not required').
 * Assigns server instance (localhost) for distributed architecture.
 * Automatically initializes user-linked documents:
 * - `RecommendationStats` with dynamic `assetType` keys loaded from existing AssetTypes,
 * - `FavoriteServers` with an empty `servers` list.
 * 
 * @param {Object} body - User registration data (userName, password, email, roleOfUser, etc.)
 * @param {Object} user - Authenticated user creating the account (typically admin)
 * @returns {Promise<Array>} - [createdUser, statusCode] or validation error
 */
const createUser = async (body, user) => {
  try {
    if (!body.email || !body.email.includes('@')) {
      return [{ message: 'Invalid email format' }, 400];
    }

    if (body.roleOfUser !== 'prosumer' && body.roleOfUser !== 'regulator') {
      return [{ message: "roleOfUser must be either 'prosumer' or 'regulator'" }, 400];
    }

    if (body.userName == "anonymous" || body.userName == "token not required" ) {
      return [{ message: "This username is prohibited." }, 400];
    }

    body.localhost = _localhost;

    const data = await User.newUser(body);

    const existingAssetTypes = await AssetTypeDB.getAllAssetType();
    const dynamicAssetTypeStats = {};

    for (const assetType of (existingAssetTypes || [])) {
      if (assetType?.name) {
        dynamicAssetTypeStats[assetType.name] = 0;
      }
    }

    const recommendationStatsBody = {
      name: body.userName,
      totalOffersCreated: 0,
      assetType: dynamicAssetTypeStats
    };

    const favoriteServersBody = {
      id: body.userName,
      servers: []
    };

    await RecommendationStatsDB.newRecommendationStats(recommendationStatsBody);
    await FavoriteServersDB.createFavoriteServers(favoriteServersBody);

    updateDataODEP.info('User successfully created', {
      from: 'createUser',
      username: user.username
    });

    return [data, 200];
  } catch (e) {
    updateDataODEP.error('Error creating user', {
      from: 'createUser',
      error: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Permanently deletes a user account from the platform.
 * Only the account owner or admin can perform deletion.
 * WARNING: Consider cascade deletion of related data (prosumer profile, offers, etc.).
 * 
 * @param {string} id - User identifier to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteUser = async (id, user) => {
  try {
    const requester = await User.getUserByUserName(user.username);

    if (!requester || (requester.username !== 'admin' && requester._id !== id)) {
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await User.deleteUser(id);

    deleteDataResilink.info('User successfully deleted', {
      from: 'deleteUser',
      username: user.username
    });

    return [{ message: 'User account successfully removed' }, 200];
  } catch (e) {
    deleteDataResilink.error('Error deleting user', {
      from: 'deleteUser',
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves all user accounts in the platform.
 * Used for administrative monitoring and user management dashboards.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [users[], statusCode] with complete user list
 */
const getAllUser = async (user) => {
  const username = user?.username ?? "anonymous";

  try {
    const users = await User.getAllUser(username);
    getDataLogger.info('All users successfully retrieved', {
      from: 'getAllUser',
      username: username
    });

    return [users, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving users', {
      from: 'getAllUser',
      error: e.message,
      username: username
    });
    throw e;
  }
};

/**
 * Retrieves a user account by email address.
 * Used for email-based lookups during password recovery or duplicate checking.
 * 
 * @param {string} email - User email address to search for
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByEmail = async (email, user) => {
  const usernameToken = user?.username ?? "anonymous";

  try {
    const data = await User.getUserByEmail(email, usernameToken);

    getDataLogger.info('User retrieved by email', {
      from: 'getUserByEmail',
      username: user?.username
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving user by email', {
      from: 'getUserByEmail',
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves a user account by username.
 * Primary user lookup method for profile viewing and authentication flows.
 * 
 * @param {string} username - Username to search for
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByUsername = async (username, user) => {
  const usernameToken = user?.username ?? "anonymous";
  console.log(usernameToken);
  
  try {
    const data = await User.getUserByUserName(username, usernameToken);

    getDataLogger.info('User retrieved by username', {
      from: 'getUserByUsername',
      username: user?.username
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving user by username', {
      from: 'getUserByUsername',
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves a user account by unique identifier.
 * Used for direct database lookups when ID is known.
 * 
 * @param {string} id - User unique identifier
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserById = async (id, user) => {
  const usernameToken = user?.username ?? "anonymous";

  try {
    const data = await User.getUser(id, usernameToken);

    getDataLogger.info('User retrieved by id', {
      from: 'getUserById',
      username: user?.username
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving user by id', {
      from: 'getUserById',
      error: e.message
    });
    throw e;
  }
};

/**
 * Updates user account information.
 * Only the account owner or admin can perform updates.
 * Allows modification of profile fields, contact information, and settings.
 * 
 * @param {string} id - User identifier to update
 * @param {Object} body - Updated user fields (partial or complete)
 * @param {Object} user - Authenticated user performing update
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const updateUser = async (id, body, user) => {
  try {
    const requester = await User.getUserByUserName(id, user.username);

    if (!requester || (requester.username !== 'admin' && requester._id !== id)) {
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await User.updateUser(id, body);

    updateDataODEP.info('User successfully updated', {
      from: 'updateUser',
      username: user.username
    });

    return [{ message: 'User successfully updated' }, 200];
  } catch (e) {
    updateDataODEP.error('Error updating user', {
      from: 'updateUser',
      error: e.message
    });
    throw e;
  }
};

/**
 * Deletes all log entries associated with a user.
 * Only the account owner or admin can delete logs.
 * Used for privacy compliance (e.g., GDPR right to be forgotten).
 * 
 * @param {string} username - Username whose logs to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteUserLogs = async (username, user) => {
  try {
    const requester = await User.getUserByUserName(username, user.username);

    if (!requester || (requester.username !== 'admin' && requester.username !== username)) {
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await User.deleteUserLogs(username);

    deleteDataResilink.info('User logs successfully deleted', {
      from: 'deleteUserLogs',
      username: user.username
    });

    return [{ message: 'User logs successfully removed' }, 200];
  } catch (e) {
    deleteDataResilink.error('Error deleting user logs', {
      from: 'deleteUserLogs',
      error: e.message
    });
    throw e;
  }
};

/**
 * Permanently deletes all user data and logs from the platform.
 * Complete data removal for account closure or privacy compliance.
 * Only the account owner or admin can perform this operation.
 * WARNING: This is irreversible and removes all user-related information.
 * 
 * @param {string} username - Username whose data to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteUserDataAndLogs = async (username, user) => {
  try {
    const requester = await User.getUserByUserName(user.username);

    if (!requester || (requester.username !== 'admin' && requester.username !== username)) {
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await User.deleteUserLogs(username);
    await User.deleteUserData(username);

    deleteDataResilink.info('User data and logs successfully deleted', {
      from: 'deleteUserDataAndLogs',
      username: user.username
    });

    return [{ message: 'User data and logs successfully removed' }, 200];
  } catch (e) {
    deleteDataResilink.error('Error deleting user data and logs', {
      from: 'deleteUserDataAndLogs',
      error: e.message
    });
    throw e;
  }
};

/**
 * Changes the password of the authenticated user.
 * Accepts the old password as either plain-text or bcrypt-hashed (for mobile apps).
 * Validates old password before applying the new one.
 * Returns the new bcrypt hash so the mobile app can store it instead of plain text.
 * 
 * @param {Object} body - { oldPassword, newPassword }
 * @param {Object} user - Authenticated user (from JWT middleware)
 * @returns {Promise<Array>} - [{ message, hashedPassword }, statusCode]
 */
const changePassword = async (body, user) => {
  try {
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return [{ message: 'oldPassword and newPassword are required' }, 400];
    }

    if (newPassword.length < 6) {
      return [{ message: 'newPassword must be at least 6 characters long' }, 400];
    }

    // Retrieve user with hashed password
    const userData = await User.getUserWithPassword(user.username);
    const storedHash = userData.password;

    // Accept old password as plain-text OR bcrypt hash
    let isOldPasswordValid = false;

    if (oldPassword.startsWith('$2b$') || oldPassword.startsWith('$2a$')) {
      // Already a bcrypt hash → direct comparison
      isOldPasswordValid = (oldPassword === storedHash);
    } else {
      // Plain-text → bcrypt compare
      isOldPasswordValid = await bcrypt.compare(oldPassword, storedHash);
    }

    if (!isOldPasswordValid) {
      updateDataODEP.error('old password does not match', {
        from: 'changePassword',
        username: user.username
      });
      return [{ message: 'old password is incorrect' }, 401];
    }

    // Hash new password and update
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateUserPassword(user.username, newHashedPassword);

    updateDataODEP.info('Password successfully changed', {
      from: 'changePassword',
      username: user.username
    });

    return [
      {
        message: 'Password successfully changed',
        hashedPassword: newHashedPassword
      },
      200
    ];
  } catch (e) {
    updateDataODEP.error('Error changing password', {
      from: 'changePassword',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

module.exports = {
  functionGetTokenUser,
  createUser,
  deleteUser,
  getAllUser,
  getUserByEmail,
  getUserByUsername,
  getUserById,
  updateUser,
  changePassword,
  deleteUserLogs,
  deleteUserDataAndLogs
};
