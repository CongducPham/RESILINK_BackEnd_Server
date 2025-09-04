require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");

const pathOdepAssetType = config.PATH_ODEP_ASSETTYPE

// Same result as the function getAllAssetTypes except its not a list of object but a map with key and an asset type associeted
const getAllAssetTypesResilink = async (token) => {
  try {
    const allAssetTypes = await Utils.fetchJSONData(
        'GET',
        pathOdepAssetType + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    var allAssetTypesResilink = {};
    const data = await Utils.streamToJSON(allAssetTypes.body);
    if (allAssetTypes.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllAssetTypesResilink', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [data, allAssetTypes.status];
    } else if (allAssetTypes.status != 200) {
      getDataLogger.warn('error retrieving all assetTypes', { from: 'getAllAssetTypesResilink', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return[data, allAssetTypes.status];
    }
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const element = data[key];
          allAssetTypesResilink[element['name']] = element;
        }
    }
    getDataLogger.info('success retrieving all assetTypes', { from: 'getAllAssetTypesResilink', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [allAssetTypesResilink, allAssetTypes.status];
  } catch (e) {
    getDataLogger.error('error retrieving all assetTypes', { from: 'getAllAssetTypesResilink', dataReceived: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
};

//Creates an asset type in ODEP
const createAssetTypes = async (url, body, token) => {
  updateDataODEP.warn('data to send to ODEP', { from: 'createAssetTypes', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'POST',
      url, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body);
    const data = await Utils.streamToJSON(response.body);
    if (response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [data, response.status];
    } else if(response.status != 200) {
      updateDataODEP.error('error creating one assetType', { from: 'createAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else {
      updateDataODEP.info('success creating one assetType', { from: 'createAssetTypes', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    };
    return [data, response.status];
};

//Retrieves all asset types with Resilink in their description in ODEP
const getAllAssetTypes = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "all", 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if (response.status != 200) {
    getDataLogger.error('error retrieving/processing all assetTypes', { from: 'getAllAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else {

    //Push all assetTypes containing RESILINK in their description into a list
    var allAssetTypesResilink = [];
    for (const element in data) {
      if (data[element].description.toUpperCase() === "RESILINK") {
        allAssetTypesResilink.push(data[element]);
      }
    }
    return [allAssetTypesResilink, response.status];
  }  
};

//Retrieves all asset types in ODEP
const getAllAssetTypesDev = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "all", 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if (response.status != 200) {
    getDataLogger.error('error retrieving/processing all assetTypes', { from: 'getAllAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving/processing all assetTypes', { from: 'getAllAssetTypes', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }  
  return [data, response.status];
};

//Retrieves an asset type by id in ODEP
const getOneAssetTypes = async (url, id, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving one assetType', { from: 'getOneAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving one assetType', { from: 'getOneAssetTypes', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

//Updates an asset type by id in ODEP
const putAssetTypes = async (url, body, id, token) => {
  updateDataODEP.warn('data to send to ODEP', { from: 'putAssetTypes', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'PUT',
      url + id, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body);
      const data = await Utils.streamToJSON(response.body);
      if (response.status == 401) {
        updateDataODEP.error('error: Unauthorize', { from: 'putAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        return [data, response.status];
      } else if(response.status != 200) {
        updateDataODEP.error('error updating one assetType', { from: 'putAssetTypes', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      } else {
        updateDataODEP.info('success updating one assetType', { from: 'putAssetTypes', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      };
      return [data, response.status];
};

//Delete an asset type by id in ODEP
const deleteAssetTypes = async (url, id, token) => {
  updateDataODEP.warn('data to send to ODEP', { from: 'deleteAssetTypes', idAssetType: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'DELETE',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    deleteDataODEP.error('error: Unauthorize', { from: 'deleteAssetTypes', idAssetType: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    deleteDataODEP.error('error deleting one assetType', { from: 'deleteAssetTypes', idAssetType: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    deleteDataODEP.info('success deleting one assetType', { from: 'deleteAssetTypes', idAssetType: id, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  };
  return [data, response.status];
};

module.exports = {
    createAssetTypes,
    getAllAssetTypesResilink,
    getAllAssetTypes,
    getAllAssetTypesDev,
    getOneAssetTypes,
    putAssetTypes,
    deleteAssetTypes,
}