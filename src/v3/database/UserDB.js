const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js'); 
const { ObjectId } = require('mongodb');
const connectToDatabase = require('./ConnectDB.js');
const cryptData = require("./CryptoDB.js");
const bcrypt = require('bcrypt');
const Utils = require("../services/Utils.js");

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');


/**
 * Creates a user document with encrypted sensitive fields.
 * @param {Object} user - User creation payload.
 * @returns {Promise<Object>} Inserted user document, or duplicate error tuple.
 */
const newUser = async (user) => {
  const _database = await connectToDatabase.connectToDatabase();
  const _collection = _database.collection('user');

  try {
    updateData.warn('before inserting data', {
      from: 'newUser',
      data: { user }
    });

    const uniqueObjectId = await connectToDatabase.generateUniqueObjectId(_collection);

    const userDocument = {
      _id: uniqueObjectId,
      phoneNumber: user.phoneNumber
        ? cryptData.encryptAES(user.phoneNumber)
        : "",
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      roleOfUser: user.roleOfUser,
      email: cryptData.encryptAES(user.email),
      password: await bcrypt.hash(user.password, 10),
      gps: user.gps ?? "",
      createdAt: Utils.getDateGMT0(),
      updatedAt: Utils.getDateGMT0(),
      accessToken: ""
    };

    const result = await _collection.insertOne(userDocument);

    if (!result.acknowledged) {
      throw new InsertDBError('User not created in local DB');
    }

    updateData.info('success creating a user in Resilink DB', {
      from: 'newUser',
      userName: user.userName
    });

    return userDocument;

  } catch (e) {
    // Duplicate key error thrown by MongoDB.
    if (e.code === 11000) {
      // Determine which unique index failed.
      if (e.keyPattern?.userName) {
        return [{ message: `User with userName "${user.userName}" already exists` }, 404];
      }

      if (e.keyPattern?.email) {
        return [{ message: `User with email "${user.email}" already exists` }, 404];
      }

      return [{ message: 'User already exists' }, 404];
    }

    updateData.error('error creating a user in Resilink DB', {
      from: 'newUser',
      error: e.message
    });

    throw e;
  }
};

/**
 * Deletes one user by database ID.
 * @param {string} userId - User document ID.
 * @returns {Promise<void>} Resolves when deletion completes.
 */
const deleteUser = async (userId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const result = await _collection.deleteOne({ "_id": userId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${userId} successfully deleted`, { from: 'deleteUser'});
    } else {
      throw new DeleteDBError();
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error delete user in Resilink DB', { from: 'deleteUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteUser', error: e.message});
    }
    throw(e);
  }
}

/**
 * Updates one user by database ID.
 * @param {string} id - User document ID.
 * @param {Object} body - User fields to update.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateUser = async (id, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    updateData.warn('before updating data', { from: 'updateUser', data: {phoneNumber: body.phoneNumber ?? ""}});

    var updateFields = { 
      userName: body.userName,
      firstName: body.firstName,
      lastName: body.lastName,
      roleOfUser: body.roleOfUser,
      password: await bcrypt.hash(body.password, 10),
      email: cryptData.encryptAES(body.email),
      updatedAt: Utils.getDateGMT0()
    };
    
    // Add `phoneNumber` if not null.
    if (body.phoneNumber != null) {
      updateFields.phoneNumber = cryptData.encryptAES(body.phoneNumber).toString();
    }
    
    // Add `gps` if not null.
    if (body.gps != null) {
      updateFields.gps = body.gps;
    }
    
    const result = await _collection.updateOne(
      { _id: id },
      { $set: updateFields }
    );

    if (result.modifiedCount === 1) {

      updateData.info(`Document with username ${body.userName} successfully updated`, { from: 'updateUser'});
    } else {
      throw new UpdateDBError();
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating user in Resilink DB', { from: 'updateUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'updateUser', error: e.message});
    }
    throw(e);
  }
}

/**
 * Retrieves one user by database ID and optionally decrypts sensitive fields.
 * @param {string} id - User document ID.
 * @param {string} username - Requester username for masking rules.
 * @returns {Promise<Object>} User document without password/token.
 */
const getUser = async (id, username) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ _id: id });
    if (user != null) {
      user.phoneNumber = username !== "anonymous" && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      user.email = username !== "anonymous" && user.email.length > 60 ? cryptData.decryptAES(user.email) : user.email;
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError("not found in our database");
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUser'});
    return user;
  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUser', error: e.message});
    }
    throw(e);
  }
}

/**
 * Authenticates a user and assigns a fresh access token.
 * Supports two password modes:
 *   1. Plain-text password → compared via bcrypt.compare
 *   2. Already-hashed password (bcrypt $2b$ prefix) → compared directly
 * This allows mobile apps to store the hashed password instead of plain text.
 * 
 * @param {Object} body - Authentication payload (`userName`, `password`).
 * @param {Object} data - Mutable output object populated with user data.
 * @returns {Promise<void>} Resolves after token creation and persistence.
 */
const getUserAndToken = async (body, data) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: body['userName'] });
    if (user != null) {
      Object.assign(data, user); 
      data['phoneNumber'] = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      data['email'] = user.email.length > 60 ? cryptData.decryptAES(user.email) : user.email;
    } else {
      throw new getDBError();
    }

    // Support both plain-text and pre-hashed password
    const suppliedPassword = body.password;
    const storedHash = data['password'];
    let isPasswordValid = false;

    if (suppliedPassword.startsWith('$2b$') || suppliedPassword.startsWith('$2a$')) {
      // Already a bcrypt hash → direct comparison
      isPasswordValid = (suppliedPassword === storedHash);
    } else {
      // Plain-text → bcrypt compare
      isPasswordValid = await bcrypt.compare(suppliedPassword, storedHash);
    }

    if (!isPasswordValid) {
      throw new getDBError("password not valid");
    }

    const accessToken = Utils.createJWSToken(body['userName']);
    await _collection.updateOne(
      { userName: body.userName },
      { $set: {
        accessToken: accessToken
      } }
    );
    data['accessToken'] = accessToken;
    getDataLogger.info('succes retrieving an user and creating jws token in Resilink DB', { from: 'getUserAndToken'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserAndToken', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserAndToken', error: e.message});
    }
    throw(e);
  }
}

/**
 * Retrieves one user by username and optionally decrypts sensitive fields.
 * @param {string} userName - Username to query.
 * @param {string} username - Requester username for masking rules.
 * @returns {Promise<Object>} User document without password/token.
 */
const getUserByUserName = async (userName, username) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: userName });
    if (user != null) {
      user.phoneNumber = username !== "anonymous" && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      user.email = username !== "anonymous" && user.email.length > 60 ? cryptData.decryptAES(user.email) : user.email;
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUserByUserName'});
    return user;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserByUserName', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserByUserName', error: e.message});
    }
    throw(e);
  }
}

/**
 * Retrieves one user by plaintext email via decrypt-and-scan strategy.
 * @param {string} email - Plain email address.
 * @param {string} username - Requester username for masking rules.
 * @returns {Promise<Object>} User document without password/token.
 */
const getUserByEmail = async (email, username) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    // Scan + decrypt to find user by email (AES random IV prevents direct query).
    const allUsers = await _collection.find().toArray();
    var user = null;
    for (const u of allUsers) {
      try {
        const decryptedEmail = u.email && u.email.length > 60
          ? cryptData.decryptAES(u.email)
          : u.email;
        if (decryptedEmail === email) {
          user = u;
          break;
        }
      } catch (_) { /* skip entries that can't be decrypted */ }
    }

    if (user != null) {
      user.phoneNumber = username !== "anonymous" && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      user.email = email; // Plain-text email is already known.
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUserByEmail'});
    return user;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserByEmail', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserByEmail', error: e.message});
    }
    throw(e);
  }
}

/**
 * Retrieves all users and removes sensitive fields.
 * @param {string} username - Requester username for masking rules.
 * @returns {Promise<Array>} List of sanitized user documents.
 */
const getAllUser = async (username) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const users = await _collection.find().toArray();
    const decryptedUsers = users.map(user => {
      user.phoneNumber = username !== "anonymous" && user.phoneNumber !== null && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      user.email = username !== "anonymous" && user.email !== null && user.email.length > 60 ? cryptData.decryptAES(user.email) : user.email;
      delete user.accessToken;
      delete user.password;
      return user;
    });
    getDataLogger.info('succes retrieving all user in Resilink DB', { from: 'getAllUser'});

    return decryptedUsers;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getAllUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllUser', error: e.message});
    }
    throw(e);
  }
}

/**
 * Fetches one user's phone number and injects it into a target object.
 * @param {string} userName - Username to query.
 * @param {Object} body - Target object updated with `phoneNumber`.
 * @returns {Promise<void>} Resolves when the target object is updated.
 */
const insertUserPhoneNumber = async (userName, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: userName });
    if (user != null) {
      body['phoneNumber'] = userName !== "anonymous" && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'insertuserPhoneNumber', error: e.message});
    }
    throw(e)
  }
}

/**
 * Retrieves phone numbers for multiple users in one batch.
 * @param {Array<string>} userNames - Usernames to query.
 * @param {string} username - Requester username for masking rules.
 * @returns {Promise<Object>} Map in the form `{ userName: phoneNumber }`.
 */
const bulkInsertUserPhoneNumbers = async (userNames, username) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    // Remove duplicates.
    userNames = [...new Set(userNames)];

    // Fetch all users with userName in the list.
    const users = await _collection
      .find({ userName: { $in: userNames } })
      .project({ userName: 1, phoneNumber: 1 })
      .toArray();

    const phoneMap = {};

    if (username !== "anonymous") {
      for (const user of users) {
        phoneMap[user.userName] = user.phoneNumber && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      }    
    } else {  
      for (const user of users) {
        phoneMap[user.userName] = user.phoneNumber;
      }   
    }


    return phoneMap;

  } catch (e) {
    getDataLogger.error('bulk phone retrieval failed', { from: 'bulkInsertUserPhoneNumbers', error: e.message });
    throw e;
  }
};

/**
 * Deletes a user's related data across RESILINK collections.
 * @param {string} userId - Username identifier.
 * @returns {Promise<void>} Resolves when cleanup completes.
 */
const deleteUserData = async (userId) => {
  try {

    const _database = await connectToDatabase.connectToDatabase();

    const userCol = _database.collection("user");
    const prosumerCol = _database.collection("Prosumer");
    const recStatsCol = _database.collection("RecommendationStats");
    const ratingCol = _database.collection("Rating");
    const offerCol = _database.collection("Offer");
    const assetCol = _database.collection("Asset");

    await userCol.deleteOne({ userName: userId });
    await prosumerCol.deleteOne({ id: userId });
    await recStatsCol.deleteOne({ name: userId });
    await ratingCol.deleteMany({ userId });
    await offerCol.deleteMany({ offerer: userId });
    await assetCol.deleteMany({ owner: userId });

    deleteData.info(`All Resilink data deleted for user ${userId}`, { from: "deleteUserData" });
    
  } catch (e) {
    deleteData.error("Error deleting user data", { from: "deleteUserData", error: e });
    throw e;
  }
};

/**
 * Deletes a user's log traces from the Logs database.
 * @param {string} userId - Username identifier.
 * @returns {Promise<void>} Resolves when log cleanup completes.
 */
const deleteUserLogs = async (userId) => {
  try {
    const logsClient = new MongoClient(config.DB_URL);
    await logsClient.connect();
    const logsDB = logsClient.db("Logs");

    const putLogs = logsDB.collection("PutLogs");
    const patchLogs = logsDB.collection("PatchLogs");
    const getLogs = logsDB.collection("GetLogs");
    const deleteLogs = logsDB.collection("DeleteLogs");

    await putLogs.deleteMany({
      $or: [
        { "meta.username": userId },
        { "meta.prosumer": userId }
      ]
    });

    await patchLogs.deleteMany({
      "meta.id": userId
    });

    await getLogs.deleteMany({
      "meta.username": userId
    });

    await deleteLogs.deleteMany({
      "meta.username": userId
    });

    deleteData.info(
      `All logs deleted for user ${userId}`,
      { from: "deleteUserLogs" }
    );
    await logsClient.close();

  } catch (e) {
    deleteData.error("Error deleting logs", { from: "deleteUserLogs", error: e });
    throw e;
  }
};

/**
 * Retrieves a user document with password for password verification.
 * Does NOT strip password/token fields (needed for comparison).
 * @param {string} userName - Username to look up.
 * @returns {Promise<Object>} Raw user document including hashed password.
 */
const getUserWithPassword = async (userName) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const user = await _collection.findOne({ userName: userName });
    if (!user) {
      throw new getDBError("user not found");
    }

    getDataLogger.info('success retrieving user with password', { from: 'getUserWithPassword' });
    return user;
  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserWithPassword', error: e.message });
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserWithPassword', error: e.message });
    }
    throw e;
  }
};

/**
 * Updates only the password field for a user.
 * @param {string} userName - Username whose password to update.
 * @param {string} newHashedPassword - New bcrypt-hashed password.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateUserPassword = async (userName, newHashedPassword) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const result = await _collection.updateOne(
      { userName: userName },
      { $set: { password: newHashedPassword, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount !== 1) {
      throw new UpdateDBError(`User ${userName} not found`);
    }

    updateData.info(`Password updated for user ${userName}`, { from: 'updateUserPassword' });
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating password in Resilink DB', { from: 'updateUserPassword', error: e.message });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateUserPassword', error: e.message });
    }
    throw e;
  }
};

module.exports = {
  newUser,
  deleteUser,
  updateUser,
  getUser,
  getUserAndToken,
  getUserByEmail,
  getUserByUserName,
  getUserWithPassword,
  updateUserPassword,
  getAllUser,
  insertUserPhoneNumber,
  bulkInsertUserPhoneNumbers,
  deleteUserData,
  deleteUserLogs
}