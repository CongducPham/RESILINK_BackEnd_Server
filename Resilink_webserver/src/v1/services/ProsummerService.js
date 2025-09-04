require('../loggers.js');
const winston = require('winston');
const { notValidBody } = require('../errors.js'); 

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const ProsummerDB = require("../database/ProsummerDB.js");
const userService = require("./UserService.js");
const Utils = require("./Utils.js");

//Creates a prosumer
const createProsummer = async (url, body, token) => {
  patchDataODEP.warn('data to send to ODEP', { from: 'createProsummer', dataToSend: body, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  
  const job = body["job"];
  const location = body["location"];
  delete body["job"];
  delete body["location"];
  
  const response = await Utils.fetchJSONData(
    "POST",
    url, 
    headers = {'accept': 'application/json',
     'Content-Type': 'application/json',
     'Authorization': token},
     body
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'createProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    updateDataODEP.error('error creating one prosummer', { from: 'createProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success creating one prosummer', { from: 'createProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }

  ProsummerDB.newProsumer(body['id'], job, location);
  updateDataODEP.info('success creating one prosummer status in ODEP and Resilink DB', { from: 'createProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});

  return [data, response.status];
};

//Retrieves all prosumers in ODEP
const getAllProsummer = async (url, token) => {
  const response = await Utils.fetchJSONData(
    "GET",
    url + "all", 
    headers = {'accept': 'application/json',
     'Authorization': token}
     );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all prosummers', { from: 'getAllProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving all prosummers', { from: 'getAllProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

/*
 * Calls the function to create a user in ODEP and RESILINK
 * Then creates a prosumer profile in ODEP and RESILINK 
 */
const createProsumerCustom = async(url, urlUser, body, token) => {

  //Calls the functions to get admin token then calls the function to create a user in ODEP & RESILINK
  const admin = await userService.functionGetTokenUser({userName: "admin", password: "admin123"});
  patchDataODEP.warn('data to send to Resilink DB & ODEP', { from: 'createProsumerCustom', dataToSend: body, username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token"});

  const job = body["job"];
  const location = body["location"];
  delete body["job"];
  delete body["location"];

  const user = await userService.createUserResilink(urlUser, body, admin[0]["accessToken"]);
  if(user[1] == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'createProsumerCustom', dataReceived: user[0], username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
    return user;
  } else if(user[1] != 201) { 
    updateDataODEP.error('error creating user in ODEP', { from: 'createProsumerCustom', dataReceived: user[0], username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
    return user;
  } else {
    updateDataODEP.info('success creating user in ODEP and Resilink DB', { from: 'createProsumerCustom', username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
  }

  //Creates a prosumer profile in ODEP with the information from the user profile created
  const response = await Utils.fetchJSONData(
    "POST",
    url, 
    headers = {'accept': 'application/json',
     'Authorization': 'Bearer ' + admin[0]["accessToken"],
     'Content-Type': 'application/json'},
    body = {'id': user[0].userName,
    'sharingAccount': 100, 
    "balance": 0}
  );
  const data = await Utils.streamToJSON(response.body);

  //Calls the function to create a prosumer in RESILINK if no errors caught
  if(response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'createProsumerCustom', dataReceived: data, username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    updateDataODEP.error('error creating one user but not his prosummer status', { from: 'createProsumerCustom', dataReceived: data, username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
    return [data, response.status];
  } else {
    updateDataODEP.info('success creating one user and his prosummer status in ODEP', { from: 'createProsumerCustom', username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
  }

  ProsummerDB.newProsumer(user[0].userName, job, location);
  updateDataODEP.info('success creating one user and his prosummer status in ODEP and Resilink DB', { from: 'createProsumerCustom', username: Utils.getUserIdFromToken(admin[0]["accessToken"]) ?? "no user associated with the token".replace(/^Bearer\s+/i, '')});
  body['job'] = job ?? "";
  body['location'] = location ?? "";
  body['bookMarked'] = [];
  return [{user: user[0], prosumer: body}, response.status];
};

//Retrieves all prosumers in ODEP and RESILINK
const getAllProsummerCustom = async (url, token) => {

  const response = await Utils.fetchJSONData(
    "GET",
    url + "all", 
    headers = 
      {'accept': 'application/json',
      'Authorization': token}
  );
  const data = await Utils.streamToJSON(response.body);
  
  //Calls the function to retrieve all prosumers data in RESILINK if no errors caught
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllProsummerCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all prosummers and his data in Resilink DB', { from: 'getAllProsummerCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else {
    getDataLogger.info('success retrieving all prosummers and his data in Resilink DB', { from: 'getAllProsummerCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await ProsummerDB.getAllProsummer(data);
  }
  return [data, response.status];
};

//ODEP actually broken, don't know if the url is the same - have to check later
//Updates user profile in ODEP & RESILINK
const updateUserProsumerCustom = async (url, body, id, token) => {
  try {
    const userODEP = await userService.updateUserCustom(url, id, body['user'], token);
    if(userODEP[1] == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'updateUserProsumerCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
      return userODEP;
    } else if(userODEP[1] != 200) {
      updateDataODEP.error('error accessing one user by username ' + username, { from: 'updateUserProsumerCustom', dataReceived: userODEP[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return userODEP;
    } else {
      updateDataODEP.info('success accessing one user by username', { from: 'updateUserProsumerCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    }

    await ProsummerDB.updateJob(body['user']['userName'], body['prosumer']['job']);
    await ProsummerDB.updateLocation(body['user']['userName'], body['prosumer']['location']);
    return [{'user': userODEP[0], 'prosumer': body['prosumer']}, userODEP[1]];
  } catch (e) {
    getDataLogger.error("error accessing ODEP", {from: 'updateUserProsumerCustom', dataReceiver: e.message, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    throw e;
  }
}

//Retrieves a prosumer by id in ODEP 
const getOneProsummer = async (url, id, token) => {
  const response = await Utils.fetchJSONData(
    "GET",
    url + id, 
    headers = {'accept': 'application/json',
     'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving one prosummer', { from: 'getOneProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving one prosummer', { from: 'getOneProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

//Retrieves a prosumer by id in ODEP and RESILINK
const getOneProsummerCustom = async (url, id, token) => {

  const response = await Utils.fetchJSONData(
    "GET",
    url + id, 
    headers = {'accept': 'application/json',
     'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);

  //Calls the function to retrieve prosumer data in RESILINK if no errors caught
  if(response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneProsummerCustom', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving one prosummer', { from: 'getOneProsummerCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving one prosummer', { from: 'getOneProsummerCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await ProsummerDB.getOneProsummer(data);
  }

  return [data, response.status];
};

//Deletes a prosumer by id in ODEP
const deleteOneProsummer = async (url, id, token) => {
  deleteDataODEP.warn('id to send to ODEP', { from: 'deleteOneProsummer', id: id, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
    "DELETE",
    url + id, 
    headers = {'accept': 'application/json',
     'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    deleteDataODEP.error('error: Unauthorize', { from: 'deleteOneProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    deleteDataODEP.error('error deleting one prosummer', { from: 'deleteOneProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    deleteDataODEP.info('success deleting one prosummer', { from: 'deleteOneProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

//Patches a prosumer balance in ODEP
const patchBalanceProsummer = async (url, body, id, token) => {
  patchDataODEP.warn('data & id to send to ODEP', { from: 'patchBalanceProsummer', dataToSend: body, id: id, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
    "PATCH",
    url + id + "/balance", 
    headers = {'accept': 'application/json',
     'Content-Type': 'application/json',
     'Authorization': token},
    body
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    patchDataODEP.error('error: Unauthorize', { from: 'patchBalanceProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    patchDataODEP.error('error patching prosummer\'s balance', { from: 'patchBalanceProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    patchDataODEP.info('success patching prosummer\'s balance', { from: 'patchBalanceProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

//Patches a prosumer job in RESILINK
const patchJobProsummer = async (body, id, token) => {
  try {
    const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    if (username == null || username != id || username != "admin") {
      return [{message: "no user associated with the token"}, 401]
    }
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchJobProsummer', dataToSend: body, id: id, username: username});
    const data = await ProsummerDB.updateJob(id, body['job']);
    patchDataODEP.info('success patching prosummer\'s bookmark list', { from: 'patchJobProsummer', username: username});
    return [{message: "Prosumer job successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchJobProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      patchDataODEP.error('error patching prosummer\'s job', { from: 'patchJobProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    }
    throw(e);
  }
};

//Patches a prosumer sharing score in ODEP
const patchSharingProsummer = async (url, body, id, token) => {
  patchDataODEP.warn('data & id to send to ODEP', { from: 'patchSharingProsummer', dataToSend: body, id: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
    "PATCH",
    url + id + "/sharingAccount", 
    headers = {'accept': 'application/json',
     'Content-Type': 'application/json',
     'Authorization': token},
     body
  );
  const data = await Utils.streamToJSON(response.body);
  if(response.status == 401) {
    patchDataODEP.error('error: Unauthorize', { from: 'patchSharingProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    patchDataODEP.error('error patching prosummer\'s sharing', { from: 'patchSharingProsummer', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    patchDataODEP.info('success patching prosummer\'s sharing', { from: 'patchSharingProsummer', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

//Patches a prosumer book marked list in RESILINK
const patchBookmarkProsummer = async (body, id, token) => {
  try {
    const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    if (username == null || username != id || username != "admin") {
      return [{message: "no user associated with the token"}, 401]
    }
    if (isNaN(body['bookmarkId'])) {
      throw new notValidBody("it's not a number in a string");
    }
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchBookmarkProsummer', dataToSend: body, id: id});
    const data = await ProsummerDB.addbookmarked(id, body['bookmarkId']);
    patchDataODEP.info('success patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', username: username});
    return [{message: "Prosumer bookmark list successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchBookmarkProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      patchDataODEP.error('error patching prosummer\'s bookmark list', { from: 'patchBookmarkProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    }
    throw(e);
  }
};

//Deletes a news id in prosumer book marked list in RESILINK
const deleteIdBookmarkedList = async (owner, id, token) => {
  try {
    const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    if (username == null || username != owner || username != "admin") {
      return [{message: "no user associated with the token"}, 401]
    }
    if (isNaN(id)) {
      throw new notValidBody("it's not a number in a string");
    }
    await ProsummerDB.deleteBookmarkedId(id, owner);
    getDataLogger.info("success deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList', username: username});
    return [{message: "news " + id + " correctly removed in " + owner + " prosumer account"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('id is not valid', { from: 'deleteIdBookmarkedList', dataReceived: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      getDataLogger.error("error deleting a news from an owner's bookmarked list", {from: 'deleteIdBookmarkedList', dataReceiver: e});
    }
    throw e;
  }
};

//Patches a prosumer book marked list in RESILINK
const patchAddblockedOffersProsummer = async (body, id, token) => {
  try {
    const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    if (username == null || username != id || username != "admin") {
      return [{message: "no user associated with the token"}, 401]
    }
    if (isNaN(body['offerId'])) {
      throw new notValidBody("it's not a number in a string");
    }
    patchDataODEP.warn('data & id to send to local DB', { from: 'patchAddblockedOffersProsummer', dataToSend: body, id: id, username: username});
    const data = await ProsummerDB.addIdToBlockedOffers(id, body['offerId']);
    patchDataODEP.info('success patching prosummer\'s blocked offers list', { from: 'patchAddblockedOffersProsummer', username: username});
    return [{message: "Prosumer blocked offers list successfully changed"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      patchDataODEP.error('body is not valid', { from: 'patchAddblockedOffersProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      patchDataODEP.error('error patching prosummer\'s blocked offers list', { from: 'patchAddblockedOffersProsummer', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    }
    throw(e);
  }
};

//Deletes a news id in prosumer book marked list in RESILINK
const deleteIdBlockedOffersList = async (owner, id, token) => {
  try {
    const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
    if (username == null || username != owner || username != "admin") {
      return [{message: "no user associated with the token"}, 401]
    }
    if (isNaN(id)) {
      throw new notValidBody("it's not a number in a string");
    }
    await ProsummerDB.deleteBlockedOffersId(id, owner);
    getDataLogger.info("success deleting an offer from an owner's blocked offers list", {from: 'deleteIdBlockedOffersList', username: username});
    return [{message: "offer " + id + " correctly removed in " + owner + " prosumer account"}, 200];
  } catch (e) {
    if (e instanceof notValidBody) {
      e.message = "id is not valid";
      patchDataODEP.error('id is not valid', { from: 'deleteIdBlockedOffersList', dataReceived: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      getDataLogger.error("error deleting an offer from an owner's blocked offers list", {from: 'deleteIdBlockedOffersList', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    }
    throw e;
  }
};

//Deletes a prosumer by id in ODEP & RESILINK
const deleteProsumerODEPRESILINK = async (url, owner, token) => {
  try {
    //Calls the function to delete a user in ODEP and if an error is caught, return the error
    const delProsODEP = await deleteOneProsummer(url, owner, token);
    if (delProsODEP[1] != 200) {
      deleteDataODEP.error("error deleting a prosumer account in RESILINK DB", {from: 'deleteProsumerODEPRESILINK', dataReceiver: delProsODEP[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return delProsODEP;
    }

    //Calls the function to delete a user in RESILINK
    await ProsummerDB.deleteProsumerODEPRESILINK(owner);
    deleteDataResilink.info("success deleting a news from an owner's bookmarked list", {from: 'deleteProsumerODEPRESILINK', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [{message: owner + " prosumer account correctly removed in RESILINK and ODEP DB"}, 200];
  } catch (e) {
    deleteDataResilink.error("error deleting a prosumer account in RESILINK and ODEP DB", {from: 'deleteProsumerODEPRESILINK', dataReceiver: e.message, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    throw e;
  }
}

module.exports = {
    createProsummer,
    getAllProsummer,
    getAllProsummerCustom,
    getOneProsummer,
    getOneProsummerCustom,
    createProsumerCustom,
    updateUserProsumerCustom,
    deleteOneProsummer,
    patchBalanceProsummer,
    patchSharingProsummer,
    patchBookmarkProsummer,
    patchJobProsummer,
    patchAddblockedOffersProsummer,
    deleteIdBookmarkedList,
    deleteIdBlockedOffersList,
    deleteProsumerODEPRESILINK
}