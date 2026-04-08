require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');
const { getDBError } = require('../errors.js'); 

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');

const User = require("../database/UserDB.js");
const Utils = require("./Utils.js");

const _ipAdress = config.PATH_ODEP_USER;
const _urlSignIn = 'auth/sign_in';
const _urlCreateUser = 'users?provider=http%3A%2F%2F127.0.0.1%3A';
/*
 * localhost indicates the machine address on which to save a user (place limited on each machine)
 * can have the value 22000 to 22006
 */
const _localhost = ["22000","22001","22002","22003","22004","22005","22006"];

/**
 * Authenticates a user against ODEP and retrieves their access token.
 * Saves the token locally for subsequent calls and synchronizes the user record in the RESILINK database.
 *
 * @param {Object} body - Login payload containing userName and password
 * @returns {Promise<Array>} - [userData{accessToken, userName, ...}, statusCode] tuple
 */
const functionGetTokenUser = async (body) => {
    const response = await Utils.fetchJSONData(
            "POST",
            _ipAdress + _urlSignIn,  
            headers = { 'Content-Type': 'application/json', 'accept': 'application/json'},
            body
        );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'functionGetTokenUser', dataReceived: data});
    } else if(response.status != 200) {
      getDataLogger.error('error retrieving user\'s token', { from: 'functionGetTokenUser', dataReceived: data, bodyUsed: body});
    } else {
      getDataLogger.info('success retrieving user\'s token', { from: 'functionGetTokenUser'});
    }
    Utils.saveUserToken(data['userName'], data['accessToken']);
    if (data['userName'] != "admin") {
      await User.getUser(data['_id'], data);
    }
    return [data, response.status];
};

/**
 * Creates a new user in ODEP and registers their RESILINK-specific data in the local database.
 * Validates Roman characters, phone number format, and GPS coordinates before creation.
 * Checks for duplicate username and email in ODEP before proceeding.
 *
 * @param {string} pathUserODEP - Base ODEP API URL for user endpoints
 * @param {Object} body - User creation payload (userName, password, email, phoneNumber, gps, etc.)
 * @param {string} token - Bearer JWT authorization token (admin token required)
 * @returns {Promise<Array>} - [createdUser, statusCode] tuple
 */
const createUserResilink = async (pathUserODEP, body, token) => {
  try {
    updateDataODEP.warn('data to send to ODEP', { from: 'createUserResilink', dataToSend: body, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});

    //Deletes data not relevant to ODEP to create a user and check validity of key's values
    let phoneNumber;
    let gps;

    if (!Utils.containsNonRomanCharacters(body['userName']) || !Utils.containsNonRomanCharacters(body['password'])) {
      return [{"message": "userName or password are not in roman caracters"}, 405]
    }

    if (body['phoneNumber'] != null && body['phoneNumber'] != "" && !Utils.isNumeric(body['phoneNumber'])) {
      return [{message: "phoneNumber is not null and is invalid. Set it to null or use numbers"}, 402]
    } else {
      phoneNumber = body['phoneNumber'] ?? "";
      delete body['phoneNumber'];
    }
    if (body['gps'] != null && body['gps'] != "" && !Utils.isValidGeographicalPoint(body['gps'])) {
      return [{message: "gps is not null and is invalid. Set it to null or a geographicalpoint"}, 402]
    } else {
      gps = body['gps'] ?? "";
      delete body['gps'];
    }

    
    const findUserUserName = await getUserByUsername(pathUserODEP, body['userName'], token);

    if(findUserUserName[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createUserResilink', dataReceived: findUserUserName[0],username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return findUserUserName;
    } else if(findUserUserName[1] == 200) {
      updateDataODEP.error('error userName already taken in ODEP', { from: 'createUserResilink', dataReceived: findUserUserName[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return [{'message': 'userName already taken'}, 404]
    }

    const findUserMail = await getUserByEmail(pathUserODEP, body['email'], token);
    if(findUserMail[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createUserResilink', dataReceived: findUserMail[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return findUserMail;
    } else if(findUserMail[1] == 200) {
      updateDataODEP.error('error email already taken in ODEP', { from: 'createUserResilink', dataReceived: findUserMail[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return [{'message': 'email already taken'}, 404]
    }

    const response = await Utils.fetchJSONData(
      "POST",
      _ipAdress + _urlCreateUser + _localhost[0],  
      headers = {'Content-Type': 'application/json', 'Authorization': token.replace(/^Bearer /, ''), 'accept': 'application/json'},
      body
    );
    
    /*
     * Create a user in ODEP DB
     * Call this function again with a different localhost until you find one, or run through them all.
     */
    const data = await Utils.streamToJSON(response.body);
    let currentIndex = 0;
    if(response.status == 401 && data === "string") {
      updateDataODEP.error('No available accounts, trying next localhost', {from: 'createUser', errorMessage: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token", triedLocalhost: currentLocalhost});
      let isProviderGood = false;
      while (currentIndex < 8 && isProviderGood == false) {
        const response = await Utils.fetchJSONData(
          "POST",
          _ipAdress + _urlCreateUser + _localhost[currentIndex],  
          headers = {'Content-Type': 'application/json', 'Authorization': token.replace(/^Bearer /, ''), 'accept': 'application/json'},
          body
        );
        const data = await Utils.streamToJSON(response.body);
        if(response.status == 401 && data === "string") {
          updateDataODEP.error('No available accounts, trying next localhost', {from: 'createUser', errorMessage: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token", triedLocalhost: currentLocalhost});
        } else {
          isProviderGood = true;
        }
      }
    } else if (response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createUserResilink', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200 && response.status != 201) {
      updateDataODEP.error('error creating user in ODEP', { from: 'createUserResilink', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      updateDataODEP.info('success creating user in ODEP', { from: 'createUserResilink', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      data['phoneNumber'] = phoneNumber;
      data['gps'] = gps;
      await User.newUser(data);
    }
    data['password'] = body['password'];
    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('error creating user in ODEP or local Resilink DB', { from: 'createUserResilink', error: e, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw(e)
  }
};

/**
 * Creates a new user in ODEP only, without adding a RESILINK database entry.
 * Retries across multiple localhost providers if the first is unavailable.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {Object} body - User creation payload
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdUser, statusCode] tuple
 */
const createUser = async (url, body, token) => {
  try {
    let currentIndex = 0;
    const response = await Utils.fetchJSONData(
      "POST",
      _ipAdress + _urlCreateUser + _localhost[currentIndex],  
      headers = {'Content-Type': 'application/json', 'Authorization': token.replace(/^Bearer /, ''), 'accept': 'application/json'},
      body
    );
    const data = await Utils.streamToJSON(response.body);


    if(response.status == 401 && data === "string") {
      updateDataODEP.error('No available accounts, trying next localhost', {from: 'createUser', errorMessage: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token", triedLocalhost: currentLocalhost});
      let isProviderGood = false;
      while (currentIndex < 8 && isProviderGood == false) {
        const response = await Utils.fetchJSONData(
          "POST",
          _ipAdress + _urlCreateUser + _localhost[currentIndex],  
          headers = {'Content-Type': 'application/json', 'Authorization': token.replace(/^Bearer /, ''), 'accept': 'application/json'},
          body
        );
        const data = await Utils.streamToJSON(response.body);
        if(response.status == 401 && data === "string") {
          updateDataODEP.error('No available accounts, trying next localhost', {from: 'createUser', errorMessage: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token", triedLocalhost: currentLocalhost});
        } else {
          isProviderGood = true;
        }
      }
    } else if (response.status == 401 && "message" in data){
      updateDataODEP.error('error: Unauthorize', { from: 'createUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      updateDataODEP.error('error creating user in ODEP', { from: 'createUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      updateDataODEP.info('success creating user in ODEP', { from: 'createUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('error creating user in ODEP or local Resilink DB', { from: 'createUser', error: e, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw(e)
  }
};

/**
 * Permanently deletes a user account from ODEP only.
 * Use deleteUserODEPRESILINK to also remove the user's RESILINK database record.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - User identifier (ODEP _id) to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteUser = async (url, id, token) => {
  try {
    deleteDataODEP.warn('id to send to ODEP', { from: 'deleteUser', id: id, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "DELETE",
      url + id, 
      headers = {
       'accept': 'application/json',
       'Authorization': token},
    );
    if(response.status == 401) {
      deleteDataODEP.error('error: Unauthorize', { from: 'deleteUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 202) {
      deleteDataODEP.error('error deleting one user', { from: 'deleteUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      deleteDataODEP.info('success deleting one user', { from: 'deleteUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [{message: "user correctly deleted"}, response.status];
  } catch (e) {
    deleteDataODEP.error("error deleting a user account in ODEP DB", {from: 'deleteUser', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Permanently deletes a user account from both ODEP and the RESILINK database.
 * First deletes from ODEP, then removes the RESILINK user record if ODEP deletion succeeds.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - User identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteUserODEPRESILINK = async (url, id, token) => {
  try {
    //Calls the function to delete a user in ODEP 
    const delUserODEP = await deleteUser(url, id, token);
    if (delUserODEP[1] != 202) {
      deleteDataODEP.error("error deleting a user account in ODEP", {from: 'deleteUserODEPRESILINK', dataReceiver: delUserODEP[0]});
      return delUserODEP;
    }
    //Creates a user in RESILINK DB
    await User.deleteUser(id);
    deleteDataResilink.info("success deleting a user in RESILINK and ODEP DB", {from: 'deleteUserODEPRESILINK'});
    return [{message: id + " user account correctly removed in RESILINK and ODEP DB"}, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting a user account in RESILINK and ODEP DB", {from: 'deleteUserODEPRESILINK', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by their ODEP internal ID from ODEP.
 * Used when the user's unique database identifier is known.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - ODEP user identifier (_id)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserById = async (url, id, token) => {
  try {
    getDataLogger.warn('id to send to ODEP', { from: 'getUserById', id: id, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "GET",
      url + id, 
      headers = {'accept': 'application/json',
       'Authorization': token},
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserById', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing one user by ID ' + id, { from: 'getUserById', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by ID', { from: 'getUserById', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserById', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves all user accounts registered in ODEP.
 * Used for admin management and user listing features.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [users[], statusCode] tuple
 */
const getAllUser = async (url, token) => {
  try {
    const response = await Utils.fetchJSONData(
      "GET",
      url, 
      headers = {'accept': 'application/json',
       'Authorization': token},
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing all user', { from: 'getAllUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing all user', { from: 'getAllUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getAllUser', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves all users from ODEP and synchronizes their records in the RESILINK database.
 * Ensures the RESILINK database stays up-to-date with ODEP user data.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [users[], statusCode] tuple
 */
const getAllUserCustom = async (url, token) => {
  try {
    const response = await Utils.fetchJSONData(
      "GET",
      url, 
      headers = {'accept': 'application/json',
       'Authorization': token},
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllUserCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing all user', { from: 'getAllUserCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing all user', { from: 'getAllUserCustom', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      await User.getAllUser(data);
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getAllUserCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by their email address from ODEP.
 * Used during registration to check for existing email addresses.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} email - Email address to search for
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByEmail = async (url, email, token) => {
  try {
    getDataLogger.warn('email to send to ODEP', { from: 'getUserByEmail', email: email, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "GET",
      url + "getUserByEmail/" + email, 
      headers = {'accept': 'application/json',
       'Authorization': token},
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByEmail', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing one user by email ' + email, { from: 'getUserByEmail', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by email', { from: 'getUserByEmail', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserByEmail', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by email from ODEP and synchronizes their data in the RESILINK database.
 * Used when the full user profile including RESILINK-specific data is needed.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} email - Email address to search for
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByEmailCustom = async (url, email, token) => {
  try {
    getDataLogger.warn('email to send to ODEP', { from: 'getUserByEmailCustom', email: email, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "GET",
      url + "getUserByEmail/" + email, 
      headers = {'accept': 'application/json',
       'Authorization': token},
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByEmailCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing one user by email ' + email, { from: 'getUserByEmailCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by email', { from: 'getUserByEmailCustom', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    await User.getUser(data["_id"], data);
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserByEmailCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by their username from ODEP.
 * Used during registration and authentication to check for existing usernames.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} username - Username to search for
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByUsername = async (url, username, token) => {
  try {
    getDataLogger.warn('username to send to ODEP', { from: 'getUserByUsername', username: username, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "GET",
      url + "getUserByUserName/" + username, 
      headers = {
        'accept': 'application/json',
        'Authorization': token
      },
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByUsername', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing one user by username ' + username, { from: 'getUserByUsername', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by username', { from: 'getUserByUsername', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUserByUsername', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by username from ODEP and synchronizes their record in the RESILINK database.
 * Throws a getDBError if the user exists in ODEP but not in the RESILINK local database.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} username - Username to search for
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple with RESILINK-synchronized data
 */
const getUserByUsernameCustom = async (url, username, token) => {
  try {
    getDataLogger.warn('username to send to ODEP', { from: 'getUserByUsernameCustom', username: username, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "GET",
      url + "getUserByUserName/" + username, 
      headers = {
        'accept': 'application/json',
        'Authorization': token
      },
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUserByUsernameCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error accessing one user by username ' + username, { from: 'getUserByUsernameCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by username', { from: 'getUserByUsernameCustom', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      await User.getUser(data["_id"], data);
    }
    return [data, response.status];
  } catch (e) {
    if (e instanceof getDBError) {
      e.message = "user does not exist in RESILINK database but exist in ODEP"
      getDataLogger.error("error finding user", {from: 'getUserByUsernameCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.error("error accessing ODEP", {from: 'getUserByUsernameCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    throw e;
  }
}

/**
 * Updates a user's profile data in ODEP.
 * Use updateUserCustom to also synchronize the update in the RESILINK database.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - User identifier to update
 * @param {Object} body - Updated user fields
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updateResponse, statusCode] tuple
 */
const updateUser = async (url, id, body, token) => {
  try {
    getDataLogger.warn('username to send to ODEP', { from: 'updateUser', data: {body: body, id: id}, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
      "PUT",
      url + id, 
      headers = {
       'accept': 'application/json',
       'Authorization': token,
       'Content-Type': 'application/json'},
       body
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'updateUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(response.status != 200) {
      getDataLogger.error('error updating one user' + username, { from: 'updateUser', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success updating one user', { from: 'updateUser', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }
    return [data, response.status];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'updateUser', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Updates a user's profile in both ODEP and the RESILINK database.
 * Validates Roman characters, phone number, and GPS format before forwarding to ODEP.
 * Note: currently requires an active ODEP endpoint — may need URL verification.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - User identifier to update
 * @param {Object} body - Updated user fields (userName, password, phoneNumber, gps, etc.)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updatedUser, statusCode] tuple
 */
const updateUserCustom = async (url, id, body, token) => {
  try {

    //Deletes data not relevant to ODEP to update a user in ODEP
    let phoneNumber;
    let gps;

    if (!Utils.containsNonRomanCharacters(body['userName']) || !Utils.containsNonRomanCharacters(body['password'])) {
      updateDataODEP.error('userName or password are not in roman caracters ' + username, { from: 'updateUserCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return [{"message": "userName or password are not in roman caracters"}, 405]
    }

    if (body['phoneNumber'] != null && body['phoneNumber'] != "" && !Utils.isNumeric(body['phoneNumber'])) {
      updateDataODEP.error('phoneNumber is not null and is invalid. Set it to null or use numbers', { from: 'updateUserCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return [{message: "phoneNumber is not null and is invalid. Set it to null or use numbers"}, 402]
    } else {
      phoneNumber = body['phoneNumber'] ?? "";
      delete body['phoneNumber'];
    }
    if (body['gps'] != null && body['gps'] != "" && !Utils.isValidGeographicalPoint(body['gps'])) {
      updateDataODEP.error('gps is not null and is invalid. Set it to null or a geographicalpoint', { from: 'updateUserCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return [{message: "gps is not null and is invalid. Set it to null or a geographicalpoint"}, 402]
    } else {
      gps = body['gps'] ?? "";
      delete body['gps'];
    }

    const userODEP = await updateUser(url, id, body, token);
    if(userODEP[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUserCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return userODEP;
    } else if(userODEP[1] != 200) {
      updateDataODEP.error('error accessing one user by username ' + username, { from: 'updateUserCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return userODEP;
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'updateUserCustom', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }

    //Returns RESILINK data to map and calls function to update user in RESILINK db
    body['phoneNumber'] = phoneNumber;
    body['gps'] = gps;

    await User.updateUser(id, body);
    return [body, userODEP[1]];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'updateUserCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

/**
 * Retrieves a user by ID from ODEP and synchronizes their record in the RESILINK database.
 * Combines getUserById with a RESILINK database sync to ensure data consistency.
 *
 * @param {string} url - Base ODEP API URL for user endpoints
 * @param {string} id - User identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [user, statusCode] tuple
 */
const getUserByIdCustom = async (url, id, token) => {
  try {
    const userODEP = await getUserById(url, id, token);
    if(userODEP[1] == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getUSerByIdCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else if(userODEP[1] != 200) {
      getDataLogger.error('error accessing one user by username ' + username, { from: 'getUSerByIdCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    } else {
      getDataLogger.info('success accessing one user by username', { from: 'getUSerByIdCustom', username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    }

    await User.getUser(id, userODEP[0]);
    return userODEP;
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'getUSerByIdCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
    throw e;
  }
}

module.exports = {
    functionGetTokenUser,
    createUser,
    createUserResilink,
    deleteUser,
    deleteUserODEPRESILINK,
    getAllUser,
    getAllUserCustom,
    getUserByEmail,
    getUserByEmailCustom,
    getUserById,
    getUserByUsername,
    getUserByUsernameCustom,
    updateUser,
    getUserByIdCustom,
    updateUserCustom
}