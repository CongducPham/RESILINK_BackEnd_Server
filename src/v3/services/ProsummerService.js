require('../loggers.js');
const winston = require('winston');
const { notValidBody } = require('../errors.js'); 

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const ProsummerDB = require("../database/ProsummerDB.js");
const userService = require("./UserService.js");
const Utils = require("./Utils.js");

/**
 * Creates a prosumer profile in the RESILINK platform.
 * Prosumers are energy producers/consumers who can both offer and request resources.
 * Requires a corresponding user account to exist before prosumer profile creation.
 * 
 * @param {Object} body - Prosumer data (id, sharingAccount, balance, activityDomain, etc.)
 * @param {Object} user - Authenticated user creating the prosumer
 * @returns {Promise<Array>} - [prosumerData, statusCode] or error if user doesn't exist
 */
const createProsummer = async (body, user) => {
  try {
    const username = user.username;
    
    const userExist = await userService.getUserByUsername(body["id"], user);
    if(userExist[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createProsummer', dataReceived: userExist[0]});
      return userExist;
    } else if(userExist[1] != 200) {
      updateDataODEP.error('error accessing one user by username', { from: 'createProsummer', dataReceived: userExist[0]});
      return [{message: 'No user with this username exists'}, 404];
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'createProsummer', username});
    }

    const data = await ProsummerDB.newProsumer(body);
    updateDataODEP.info('success creating user in ODEP', { from: 'createProsummer', username});

    return [body, 200];
  } catch (e) {
    updateDataODEP.error('error creating prosumer', { from: 'createProsummer', error: e.message, username: user.username});
    throw(e);
  }
};

/**
 * Creates both a user account and prosumer profile in a single operation.
 * Streamlined registration workflow for new prosumers joining the RESILINK platform.
 * Validates username/password format (Roman characters only) and phone number (digits only).
 * Automatically creates user with admin token, then links prosumer profile.
 * 
 * @param {Object} body - Combined user+prosumer data (userName, password, phoneNumber, activityDomain, etc.)
 * @param {Object} user - Authenticated user initiating creation (typically admin)
 * @returns {Promise<Array>} - [{user: {}, prosumer: {}}, statusCode] or validation error
 */
const createProsumerWithUser = async(body, user) => {
  try {
    const username = user.username;
  
    if (!Utils.containsNonRomanCharacters(body['userName']) || !Utils.containsNonRomanCharacters(body['password'])) {
      return [{"message": "userName or password are not in roman caracters"}, 405]
    } else if (body['phoneNumber'].length !== 0 && !Utils.isNumeric(body['phoneNumber'])) {
      return [{"message": "phone number is not in digits caracters"}, 405]
    }
  
    const bodyProsumer = {
      "id": body.userName,
      "sharingAccount": 100,
      "balance": 100,
      "activityDomain": body.activityDomain,
      "specificActivity": body.specificActivity,
      "location": body.location
    }
    delete body.sharingAccount;
    delete body.balance;
    delete body.activityDomain;
    delete body.specificActivity;
    delete body.location;
  
    const adminToken = await userService.functionGetTokenUser({userName: 'admin', password: 'admin123'});
    const userResponse = await userService.createUser(body, {username: 'admin', token: 'Bearer ' + adminToken[0]['accessToken']});
    if(userResponse[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createProsumerWithUser', dataReceived: userResponse[0]});
      return userResponse;
    } else if(userResponse[1] != 200) {
      updateDataODEP.error('error creating one user ' + body.userName, { from: 'createProsumerWithUser', dataReceived: userResponse[0]});
      return userResponse;
    } else {
      updateDataODEP.info('success creating one user', { from: 'createProsumerWithUser', username});
    }
    
    const prosumer = await ProsummerDB.newProsumer(bodyProsumer);
    updateDataODEP.info('success creating one user and his prosummer status in Resilink DB', { from: 'createProsumerWithUser', username});
    userResponse[0]['password'] = body['password'];
    return [{user: userResponse[0], prosumer: prosumer}, 200];
  } catch (e) {
    updateDataODEP.error('fail creating one user and his prosummer status in Resilink DB', { from: 'createProsumerWithUser', error: e.message, username: user.username});
    throw e;
  }
};

/**
 * Retrieves all prosumer profiles in the RESILINK platform.
 * Used for administrative monitoring and analytics dashboards.
 * 
 * @param {Object} user - Authenticated user requesting data
 * @returns {Promise<Array>} - [prosumers[], statusCode] with complete list
 */
const getAllProsummer = async (user) => {
  try {
    const username = user?.username ?? "no token required";
    const allProsummer = await ProsummerDB.getAllProsummer();
    
    getDataLogger.info('success retrieving all prosummers in Resilink DB', { from: 'getAllProsummer', username});
    return [allProsummer, 200];
  } catch (e) {
    getDataLogger.error('error retrieving all prosummers', { from: 'getAllProsummer', error: e.message, username: user.username});
    throw(e);
  }
};

/**
 * Updates both user account and prosumer profile information.
 * Synchronizes changes across user and prosumer collections.
 * Updates activity domain, specific activity, and location fields.
 * 
 * @param {Object} body - Combined payload {user: {...}, prosumer: {...}}
 * @param {string} id - User/prosumer identifier
 * @param {Object} user - Authenticated user performing update
 * @returns {Promise<Array>} - [{user: {}, prosumer: {}}, statusCode] or error
 */
const updateUserProsumer = async (body, id, user) => {
  try {
    const username = user.username;
    
    const userODEP = await userService.updateUser(id, body['user'], user);
    if(userODEP[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUserProsumer', dataReceived: userODEP[0]});
      return userODEP;
    } else if(userODEP[1] != 200) {
      updateDataODEP.error('error accessing one user by username', { from: 'updateUserProsumer', dataReceived: userODEP[0]});
      return userODEP;
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'updateUserProsumer', username});
    }

    await ProsummerDB.updateJob(body['user']['userName'], body['prosumer']['activityDomain']);
    await ProsummerDB.updateSpecificActivity(body['user']['userName'], body['prosumer']['specificActivity']);
    await ProsummerDB.updateLocation(body['user']['userName'], body['prosumer']['location']);
    
    getDataLogger.info('success updating user/prosumer data', { from: 'updateUserProsumer', username});
    return [{'user': userODEP[0], 'prosumer': body['prosumer']}, userODEP[1]];
  } catch (e) {
    getDataLogger.error("error updating user/prosumer data", {from: 'updateUserProsumer', error: e.message, username: user.username});
    throw e;
  }
}

/**
 * Retrieves a specific prosumer profile by identifier.
 * Returns prosumer-specific data like balance, sharing score, bookmarks, blocked offers.
 * 
 * @param {string} id - Prosumer identifier
 * @param {Object} user - Authenticated user requesting data
 * @returns {Promise<Array>} - [prosumer, statusCode] tuple
 */
const getOneProsummer = async (id, user) => {
  try {
    const username = user?.username ?? "no token required";
    const prosumer = await ProsummerDB.getOneProsummer(id);
    
    getDataLogger.info('success retrieving one prosummer', { from: 'getOneProsummer', username});
    return [prosumer, 200];
  } catch (e) {
    getDataLogger.error("error retrieving a prosummer", {from: 'getOneProsummer', error: e.message, username: user.username});
    throw (e);
  }
};

/**
 * Updates a prosumer's account balance (currency/credits).
 * Balance represents prosumer's purchasing power for marketplace transactions.
 * 
 * @param {Object} body - Payload containing accountUnits (new balance value)
 * @param {string} id - Prosumer identifier
 * @param {Object} user - Authenticated user performing update
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const patchBalanceProsummer = async (body, id, user) => {
  try {
    const username = user.username;
    
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchBalanceProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.updateSharingAccount(id, body['accountUnits']);
    
    patchDataODEP.info('success patching prosummer\'s balance', { from: 'patchBalanceProsummer', username});
    return [{message: "Prosumer balance successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchBalanceProsummer', dataReceived: body, username: user.username});
    } else {
      patchDataODEP.error('error patching prosummer\'s balance', { from: 'patchBalanceProsummer', dataReceived: body, username: user.username});
    }
    throw(e);
  }
};

/**
 * Updates a prosumer's activity domain (job/industry sector).
 * Activity domain helps categorize prosumers for targeted offers and analytics.
 * 
 * @param {Object} body - Payload containing activityDomain
 * @param {string} id - Prosumer identifier
 * @param {Object} user - Authenticated user performing update
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const patchJobProsummer = async (body, id, user) => {
  try {
    const username = user.username;
    
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchJobProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.updateJob(id, body['activityDomain']);
    
    patchDataODEP.info('success patching prosummer\'s job', { from: 'patchJobProsummer', username});
    return [{message: "Prosumer job successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchJobProsummer', dataReceived: body, username: user.username});
    } else {
      patchDataODEP.error('error patching prosummer\'s job', { from: 'patchJobProsummer', dataReceived: body, username: user.username});
    }
    throw(e);
  }
};

/**
 * Updates a prosumer's sharing score.
 * Sharing score represents prosumer's contribution to the collaborative economy.
 * Higher scores may unlock benefits or preferential treatment in the platform.
 * 
 * @param {Object} body - Payload containing sharingPoints (new score value)
 * @param {string} id - Prosumer identifier
 * @param {Object} user - Authenticated user performing update
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const patchSharingProsummer = async (body, id, user) => {
  try {
    const username = user.username;
    
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchSharingProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.updateSharingAccount(id, body['sharingPoints']);
    
    patchDataODEP.info('success patching prosummer\'s sharingAccount', { from: 'patchSharingProsummer', username});
    return [{message: "Prosumer sharingAccount successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchSharingProsummer', dataReceived: body, username: user.username});
    } else {
      patchDataODEP.error('error patching prosummer\'s sharingAccount', { from: 'patchSharingProsummer', dataReceived: body, username: user.username});
    }
    throw(e);
  }
};

/**
 * Adds a news item to a prosumer's bookmarked list.
 * Enables users to curate personalized news feeds about energy markets and policies.
 * 
 * @param {Object} body - Payload containing bookmarkId (news item identifier)
 * @param {string} id - Prosumer identifier
 * @param {Object} user - Authenticated user performing operation
 * @returns {Promise<Array>} - [successMessage, statusCode] or validation error
 */
const patchBookmarkProsummer = async (body, id, user) => {
  try {
    const username = user.username;
    
    patchDataODEP.warn('juste avant logger', { from: 'patchBookmarkProsummer', username});
    patchDataODEP.warn('juste avant isNaN', { from: 'patchBookmarkProsummer', username, nan: isNaN(body['bookmarkId'])});
    
    if (isNaN(body['bookmarkId'])) {
      throw new notValidBody("it's not a number in a string");
    }

    patchDataODEP.warn('data & id to send to local DB', { from: 'patchBookmarkProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.addbookmarked(id, body['bookmarkId']);
    
    patchDataODEP.info('success patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', username});
    return [{message: "Prosumer bookmark list successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchBookmarkProsummer', dataReceived: body, username: user.username});
    } else {
      patchDataODEP.error('error patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', dataReceived: body, username: user.username});
    }
    throw(e);
  }
};

/**
 * Removes a news item from a prosumer's bookmarked list.
 * Allows users to manage their saved news content.
 * 
 * @param {string} owner - Prosumer username/identifier
 * @param {string} id - News item identifier to remove
 * @param {Object} user - Authenticated user performing operation
 * @returns {Promise<Array>} - [successMessage, statusCode] or validation error
 */
const deleteIdBookmarkedList = async (owner, id, user) => {
  try {
    const username = user.username;
    
    if (isNaN(id)) {
      throw new notValidBody("it's not a number in a string");
    }
    
    await ProsummerDB.deleteBookmarkedId(id, owner);
    
    getDataLogger.info("success deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList', username});
    return [{message: "news " + id + " correctly removed in " + owner + " prosumer account"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('id is not valid', { from: 'deleteIdBookmarkedList', dataReceived: id, username: user.username});
    }
    getDataLogger.error("error deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList', error: e.message, username: user.username});
    throw e;
  }
};

/**
 * Blocks an offer from a specific server for a prosumer.
 * Modern implementation supporting multi-server federation blocking.
 * 
 * @param {Object} body - Request body { serverName: string, offerId: string }
 * @param {string} prosumerId - Prosumer identifier
 * @param {Object} user - Authenticated user performing operation
 * @returns {Promise<Array>} - [successMessage, statusCode] or validation error
 */
const blockOfferByServer = async (body, prosumerId, user) => {
  try {
    const username = user.username;
    
    // Validate required fields
    if (!body.serverName || typeof body.serverName !== 'string') {
      throw new notValidBody("serverName is required and must be a string");
    }
    
    if (!body.offerId || isNaN(body.offerId)) {
      throw new notValidBody("offerId is required and must be a number in string");
    }
    
    patchDataODEP.warn('Blocking offer by server', { 
      from: 'blockOfferByServer', 
      serverName: body.serverName,
      offerId: body.offerId,
      prosumerId
    });
    
    await ProsummerDB.addBlockedOfferByServer(prosumerId, body.serverName, body.offerId);
    
    patchDataODEP.info('Success blocking offer by server', { 
      from: 'blockOfferByServer', 
      username,
      serverName: body.serverName
    });
    
    return [{
      message: `Offer ${body.offerId} from server ${body.serverName} successfully blocked`
    }, 200];
    
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('Invalid request body', { 
        from: 'blockOfferByServer', 
        dataReceived: body, 
        username: user.username
      });
    } else {
      patchDataODEP.error('Error blocking offer by server', { 
        from: 'blockOfferByServer', 
        error: e.message,
        username: user.username
      });
    }
    throw(e);
  }
};

/**
 * Retrieves blocked offers for a specific server.
 * 
 * @param {string} prosumerId - Prosumer identifier
 * @param {string} serverName - Server identifier
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [blockedOffers array, statusCode]
 */
const getBlockedOffersByServer = async (prosumerId, serverName, user) => {
  try {
    const username = user.username;
    
    if (!serverName || typeof serverName !== 'string') {
      throw new notValidBody("serverName is required and must be a string");
    }
    
    const blockedOffers = await ProsummerDB.getBlockedOffersForServer(prosumerId, serverName);
    
    getDataLogger.info('Success retrieving blocked offers by server', {
      from: 'getBlockedOffersByServer',
      username,
      serverName,
      count: blockedOffers.length
    });
    
    return [{ blockedOffers, serverName }, 200];
    
  } catch (e) {
    getDataLogger.error('Error retrieving blocked offers by server', {
      from: 'getBlockedOffersByServer',
      error: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Retrieves all blocked offers for a prosumer (entire map of all servers).
 * 
 * @param {string} prosumerId - Prosumer identifier
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [blockedOffers map, statusCode]
 */
const getAllBlockedOffers = async (prosumerId, user) => {
  try {
    const username = user.username;
    
    const blockedOffersMap = await ProsummerDB.getProsumerBlockedOffers(prosumerId);
    
    getDataLogger.info('Success retrieving all blocked offers', {
      from: 'getAllBlockedOffers',
      username,
      serverCount: Object.keys(blockedOffersMap || {}).length
    });
    
    return [{ blockedOffers: blockedOffersMap }, 200];
    
  } catch (e) {
    getDataLogger.error('Error retrieving all blocked offers', {
      from: 'getAllBlockedOffers',
      error: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Unblocks an offer from a specific server for a prosumer.
 * 
 * @param {string} prosumerId - Prosumer identifier
 * @param {string} serverName - Server identifier
 * @param {string} offerId - Offer identifier to unblock
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [successMessage, statusCode]
 */
const unblockOfferByServer = async (prosumerId, serverName, offerId, user) => {
  try {
    const username = user.username;
    
    if (!serverName || typeof serverName !== 'string') {
      throw new notValidBody("serverName is required and must be a string");
    }
    
    if (!offerId || isNaN(offerId)) {
      throw new notValidBody("offerId is required and must be a number in string");
    }
    
    await ProsummerDB.removeBlockedOfferByServer(prosumerId, serverName, offerId);
    
    getDataLogger.info('Success unblocking offer by server', {
      from: 'unblockOfferByServer',
      username,
      serverName,
      offerId
    });
    
    return [{
      message: `Offer ${offerId} from server ${serverName} successfully unblocked`
    }, 200];
    
  } catch (e) {
    getDataLogger.error('Error unblocking offer by server', {
      from: 'unblockOfferByServer',
      error: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Permanently deletes a prosumer profile from RESILINK.
 * WARNING: This operation removes prosumer data but may leave user account intact.
 * Consider cascade deletion of related data (offers, bookmarks, etc.).
 * 
 * @param {string} owner - Prosumer identifier to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const deleteProsumer = async (owner, user) => {
  try {
    const username = user.username;
    
    await ProsummerDB.deleteProsumerODEPRESILINK(owner);
    
    deleteDataResilink.info("success deleting a prosumer with id " + owner, {from: 'deleteProsumer', username});
    return [{message: owner + " prosumer account correctly removed"}, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting a prosumer account", {from: 'deleteProsumer', error: e.message, username: user.username});
    throw e;
  }
}

module.exports = {
    createProsummer,
    createProsumerWithUser,
    getAllProsummer,
    getOneProsummer,
    updateUserProsumer,
    patchBalanceProsummer,
    patchSharingProsummer,
    patchBookmarkProsummer,
    patchJobProsummer,
    deleteIdBookmarkedList,
    deleteProsumer,
    blockOfferByServer,
    getBlockedOffersByServer,
    getAllBlockedOffers,
    unblockOfferByServer
}