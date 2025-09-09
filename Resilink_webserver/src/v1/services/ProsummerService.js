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

//Creates a prosumer in ODEP
const createProsummer = async (body, token) => {
  try {
    if(!Utils.validityToken(token)) {
      updateDataODEP.error('error: Unauthorize', { from: 'createProsummer', dataReceived: body, tokenUsed: token != null ? token.replace(/^Bearer\s+/i, '') : ""});
      return [{"message": "Unauthorize"}, 401];
    } 

    const userExist = await userService.getUserByUsername(body["id"], token);
    if(userExist[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUserProsumer', dataReceived: userExist[0], tokenUsed: token == null ? "Token not given" : token});
      return userExist;
    } else if(userExist[1] != 200) {
      updateDataODEP.error('error accessing one user by username ' + username, { from: 'updateUserProsumer', dataReceived: userExist[0], tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return [{message: 'No user with this username exists'}, 404];
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'updateUserProsumer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    }

    const data = await ProsummerDB.newProsumer(body);
    updateDataODEP.info('success creating user in ODEP', { from: 'createProsummer', tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});

    return [body, 200];
  } catch (e) {
    throw(e);
  }
};

/*
 * Calls the function to create a user in RESILINK
 * Then creates a prosumer profile in RESILINK 
 */
const createProsumerWithUser = async(body, token) => {
  try {
    if(!Utils.validityToken(token)) {
      updateDataODEP.error('error: Unauthorize', { from: 'createProsumerWithUser', dataReceived: body, tokenUsed: token.replace(/^Bearer\s+/i, '') ?? ""});
      return [{"message": "Unauthorize"}, 401];
    } 
  
    if (!Utils.containsNonRomanCharacters(body['userName']) || !Utils.containsNonRomanCharacters(body['password'])) {
      return [{"message": "userName or password are not in roman caracters"}, 405]
    } else if (body['phoneNumber'].length !== 0 && !Utils.isNumeric(body['phoneNumber'])) {
      return [{"message": "phone number is not in digits caracters"}, 405]
    }
  
    const bodyProsumer = {
      "id": body.userName,
      "sharingAccount": 100,
      "balance": 100,
      "job": body.job,
      "location": body.location
    }
    delete body.sharingAccount;
    delete body.balance;
    delete body.job;
    delete body.location;
  
    const adminToken = await userService.functionGetTokenUser({userName: 'admin', password: 'admin123'});
    const userResponse = await userService.createUser(body, adminToken[0]['accessToken']);
    if(userResponse[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createProsumerWithUser', dataReceived: userResponse[0], tokenUsed: token == null ? "Token not given" : token});
      return userResponse;
    } else if(userResponse[1] != 200) {
      updateDataODEP.error('error creating one user' + body.userName, { from: 'createProsumerWithUser', dataReceived: userResponse[0], tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return userResponse;
    } else {
      updateDataODEP.info('success creating one user', { from: 'createProsumerWithUser', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    }
    const prosumer = await ProsummerDB.newProsumer(bodyProsumer);
    updateDataODEP.info('success creating one user and his prosummer status in Resilink DB', { from: 'createProsumerWithUser', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    userResponse[0]['password'] = body['password'];
    return [{user: userResponse[0], prosumer: prosumer}, 200];
  } catch (e) {
    updateDataODEP.error('fail creating one user and his prosummer status in Resilink DB', { from: 'createProsumerWithUser', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw e;
  }

  
};

//Retrieves all prosumers in ODEP and RESILINK
const getAllProsummer = async (token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
  
    //Calls the function to retrieve all prosumers data in RESILINK if no errors caught
    const allProsummer = await ProsummerDB.getAllProsummer();
    getDataLogger.info('success retrieving all prosummers in Resilink DB', { from: 'getAllProsummer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
  
    return [allProsummer, 200];
  } catch (e) {
    getDataLogger.error('error retrieving all prosummers', { from: 'getAllProsummer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    throw(e);
  }
};

//Updates user profile in RESILINK
const updateUserProsumer = async (body, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'updateUserProsumer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const userODEP = await userService.updateUser(id, body['user'], token);
    if(userODEP[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUserProsumer', dataReceived: userODEP[0], tokenUsed: token == null ? "Token not given" : token});
      return userODEP;
    } else if(userODEP[1] != 200) {
      updateDataODEP.error('error accessing one user by username ' + username, { from: 'updateUserProsumer', dataReceived: userODEP[0], tokenUsed: token.replace(/^Bearer\s+/i, '')});
      return userODEP;
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'updateUserProsumer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    }

    await ProsummerDB.updateJob(body['user']['userName'], body['prosumer']['job']);
    await ProsummerDB.updateLocation(body['user']['userName'], body['prosumer']['location']);
    getDataLogger.info('success updating user/prosumer data', { from: 'updateUserProsumer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [{'user': userODEP[0], 'prosumer': body['prosumer']}, userODEP[1]];
  } catch (e) {
    getDataLogger.error("error updating user/prosumer data", {from: 'updateUserProsumer', dataReceiver: e.message});
    throw e;
  }
}

//Retrieves a prosumer by id in RESILINK
const getOneProsummer= async (id, token) => {

  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'getOneProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
  
    const prosumer = await ProsummerDB.getOneProsummer(id);
    getDataLogger.info('success retrieving one prosummer', { from: 'getOneProsummer', tokenUsed: token.replace(/^Bearer\s+/i, '')});
    return [prosumer, 200];
  } catch (e) {
    getDataLogger.error("error retrieving a prosummer", {from: 'getOneProsummer', dataReceiver: e.message});
    throw (e);
  }
};

//Patches a prosumer balance in ODEP
const patchBalanceProsummer = async (body, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'patchBalanceProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    patchDataODEP.warn('data & id to send to local DB', { from: 'patchBalanceProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.updateSharingAccount(id, body['accountUnits']);
    patchDataODEP.info('success patching prosummer\'s balance', { from: 'patchBalanceProsummer', /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    return [{message: "Prosumer balance successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchBalanceProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    } else {
      patchDataODEP.error('error patching prosummer\'s balance', { from: 'patchBalanceProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    throw(e);
  }
};

//Patches a prosumer job in RESILINK
const patchJobProsummer = async (body, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'patchJobProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    patchDataODEP.warn('data & id to send to local DB', { from: 'patchJobProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.updateJob(id, body['job']);
    patchDataODEP.info('success patching prosummer\'s bookmark list', { from: 'patchJobProsummer', /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    return [{message: "Prosumer job successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchJobProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    } else {
      patchDataODEP.error('error patching prosummer\'s job', { from: 'patchJobProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    throw(e);
  }
};

//Patches a prosumer sharing score in ODEP
const patchSharingProsummer = async (url, body, id, token) => {
  try {
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchSharingProsummer', dataToSend: body, id: id});
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'patchSharingProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    const data = await ProsummerDB.updateSharingAccount(id, body['sharingPoints']);
    patchDataODEP.info('success patching prosummer\'s sharingAccount', { from: 'patchSharingProsummer', /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    return [{message: "Prosumer sharingAccount successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchSharingProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    } else {
      patchDataODEP.error('error patching prosummer\'s sharingAccount', { from: 'patchSharingProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    throw(e);
  }
};

//Patches a prosumer book marked list in RESILINK
const patchBookmarkProsummer = async (body, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'patchBookmarkProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
    patchDataODEP.warn('juste avant logger', { from: 'patchBookmarkProsummer', tokenUsed: token == null ? "Token not given" : token});
    patchDataODEP.warn('juste avant isNaN', { from: 'patchBookmarkProsummer', tokenUsed: token == null ? "Token not given" : token, nan: isNaN(body['bookmarkId'])});
    if (isNaN(body['bookmarkId'])) {
      throw new notValidBody("it's not a number in a string");
    }

    patchDataODEP.warn('data & id to send to local DB', { from: 'patchBookmarkProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.addbookmarked(id, body['bookmarkId']);
    patchDataODEP.info('success patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    return [{message: "Prosumer bookmark list successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchBookmarkProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    } else {
      patchDataODEP.error('error patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    throw(e);
  }
};

//Deletes a news id in prosumer book marked list in RESILINK
const deleteIdBookmarkedList = async (owner, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'deleteIdBookmarkedList', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    if (isNaN(id)) {
      throw new notValidBody("it's not a number in a string");
    }
    await ProsummerDB.deleteBookmarkedId(id, owner);
    getDataLogger.info("success deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList'});
    return [{message: "news " + id + " correctly removed in " + owner + " prosumer account"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('id is not valid', { from: 'deleteIdBookmarkedList', dataReceived: id, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    getDataLogger.error("error deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList', dataReceiver: e});
    throw e;
  }
};

//Patches a prosumer book marked list in RESILINK
const patchAddblockedOffersProsummer = async (body, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'patchAddblockedOffersProsummer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
    if (isNaN(body['offerId'])) {
      throw new notValidBody("it's not a number in a string");
    }
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchAddblockedOffersProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.addIdToBlockedOffers(id, body['offerId']);
    patchDataODEP.info('success patching prosummer\'s blocked offers list', { from: 'patchAddblockedOffersProsummer', /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    return [{message: "Prosumer blocked offers list successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchAddblockedOffersProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    } else {
      patchDataODEP.error('error patching prosummer\'s blocked offers list', { from: 'patchAddblockedOffersProsummer', dataReceived: body, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    throw(e);
  }
};

//Deletes a news id in prosumer book marked list in RESILINK
const deleteIdBlockedOffersList = async (owner, id, token) => {
  try {
    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'deleteIdBlockedOffersList', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }
    if (isNaN(id)) {
      throw new notValidBody("it's not a number in a string");
    }
    await ProsummerDB.deleteBlockedOffersId(id, owner);
    getDataLogger.info("success deleting a news from an owner's blocked offers list", {from: 'deleteIdBlockedOffersList'});
    return [{message: "news " + id + " correctly removed in " + owner + " prosumer account"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('id is not valid', { from: 'deleteIdBlockedOffersList', dataReceived: id, /*tokenUsed: token.replace(/^Bearer\s+/i, '')*/});
    }
    getDataLogger.error("error deleting an offer from an owner's blocked offers list", {from: 'deleteIdBlockedOffersList', dataReceiver: e});
    throw e;
  }
};

//Deletes a prosumer by id in ODEP & RESILINK
const deleteProsumer = async (owner, token) => {
  try {

    if(!Utils.validityToken(token)) {
      getDataLogger.error('error: Unauthorize', { from: 'deleteProsumer', tokenUsed: token == null ? "Token not given" : token});
      return [{"message" : "Unauthorize"}, 401];
    }

    //Calls the function to delete a user in RESILINK
    await ProsummerDB.deleteProsumerODEPRESILINK(owner);
    deleteDataResilink.info("success deleting a prosumer with id " + owner, {from: 'deleteProsumer'});
    return [{message: owner + " prosumer account correctly removed"}, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting a prosumer account", {from: 'deleteProsumer', dataReceiver: e.message});
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
    patchAddblockedOffersProsummer,
    deleteIdBookmarkedList,
    deleteIdBlockedOffersList,
    deleteProsumer 
}