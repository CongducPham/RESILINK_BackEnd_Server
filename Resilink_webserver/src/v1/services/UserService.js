require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');

const User = require("../database/UserDB.js");
const Utils = require("./Utils.js");

/*
 * localhost indicates the machine address on which to save a user (place limited on each machine)
 * can have the value 22000 to 22004
 */
const _localhost = "22003";

//Retrieves user data (token is associated with "accesToken" key)
const functionGetTokenUser = async (body) => {
  try {

    var data = {};
    await User.getUserAndToken(body, data);
    return [data, 200];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'functionGetTokenUser', dataReceiver: e.message});
    throw e;
  }
};

//Creates a user
const createUser = async (body, token) => {
  try {    
    if(!Utils.validityToken(token)) {
      updateDataODEP.error('error: Unauthorize', { from: 'createUser', dataReceived: body, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
      return [{"message": "Unauthorize"}, 401];
    } else if (!Utils.isValidEmail(body['email'])) {
      updateDataODEP.error('error: email format not respected', { from: 'createUser', dataReceived: body, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
      return [{"message": "email format not respected"}, 402];
    } else if (body['roleOfUser'] != 'prosumer' && body['roleOfUser'] != 'regulator') {
      updateDataODEP.error('error: roleOfUser value not respected', { from: 'createUser', dataReceived: body, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
      return [{"message": "roleOfUser must be either 'prosumer' or 'regulator'"}, 402];
    }

    body['localhost'] = _localhost;
    const data = await User.newUser(body);
    updateDataODEP.info('success creating user in ODEP', { from: 'createUser', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
    return [data, 200];
  } catch (e) {
    updateDataODEP.error('error creating user in ODEP or local Resilink DB', { from: 'createUser', error: e, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
    throw(e)
  }
};

//Deletes an RESILINK user
const deleteUser = async (id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'deleteUser', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 200];
    }

    const adminToken = await User.getUserByToken(token);
    if (adminToken[0]['userName'] != "admin" || adminToken[0]['_id'] != id ) {
      updateDataODEP.error('error: not the owner or administrator', { from: 'deleteUser', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "not the owner or administrator"}, 401];
    }

    await User.deleteUser(id);
    deleteDataResilink.info("success deleting a user in RESILINK", {from: 'deleteUser'});

    return [{message: id + " user account correctly removed in RESILINK "}, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting a user account in RESILINK", {from: 'deleteUser', dataReceiver: e.message});
    throw e;
  }
}

//Retrieves all user in ODEP & RESILINK
const getAllUser = async (token) => {
  try {
    
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllUser', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 200];
    }
    
    const listUser = await User.getAllUser();
    getDataLogger.info('success accessing all users', { from: 'getAllUser', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [listUser, 200];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getAllUser', dataReceiver: e.message});
    throw e;
  }
}

//Retrieves a user by email
const getUserByEmail = async (email, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByUsername', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 200];
    }
    
    const data = await User.getUserByEmail(email);
    getDataLogger.info('success accessing one user by email', { from: 'getUserByEmail', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [data, 200];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserByEmail', dataReceiver: e.message});
    throw e;
  }
}

//Retrieves a user by username
const getUserByUsername = async (username, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByUsername', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 200];
    }

    const data = await User.getUserByUserName(username);
    updateDataODEP.info('success accessing one user by username', { from: 'getUserByUsername', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [data, 200];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserByUsername', dataReceiver: e.message});
    throw e;
  }
}

//Updates user profile in RESILINK
const updateUser = async (id, body, token) => {
  try {
    if(!Utils.validityToken(token)) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUser', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    } else if (!Utils.isValidEmail(body['email'])) {
      updateDataODEP.error('error: email format not respected', { from: 'updateUser', dataReceived: body, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
      return [{"message": "email format not respected"}, 402];
    } 

    const adminToken = await User.getUserByToken(token.replace(/^Bearer\s+/i, ''));
    if (adminToken['userName'] != "admin" && adminToken['userName'] != id ) {
      updateDataODEP.error('error: not the owner or administrator', { from: 'updateUser', dataReceived: "Unauthorize", tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "not the owner or administrator"}, 401];
    }

    await User.updateUser(id, body);
    updateDataODEP.info('success updating one user', { from: 'updateUser', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [{"message": "successful update"}, 200];
  } catch (e) {
    getDataLogger.error("error updating", {from: 'updateUser', dataReceiver: e.message});
    throw e;
  }
}

//Retrieves a user by id in ODEP & RESILINK
const getUserById = async (id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      updateDataODEP.error('error: Unauthorize', { from: 'getUserById', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 200];
    }
    const data = await User.getUser(id);

    updateDataODEP.info('success accessing one user by id', { from: 'getUserById', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [data, 200];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserById', dataReceiver: e.message});
    throw e;
  }
}

module.exports = {
    functionGetTokenUser,
    createUser,
    deleteUser,
    getAllUser,
    getUserByEmail,
    getUserByUsername,
    getUserById,
    updateUser
}