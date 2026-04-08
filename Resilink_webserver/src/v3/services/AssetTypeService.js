require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");

const pathOdepAssetType = config.PATH_ODEP_ASSETTYPE

/**
 * Retrieves all asset types from ODEP in a key-value map format optimized for RESILINK operations.
 * Same result as getAllAssetTypes but returns a map (name -> assetType) instead of a list, enabling efficient lookup.
 * No URL parameter since this function is called internally by other service files.
 *
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assetTypeMap{}, statusCode] where keys are asset type names
 */
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

/**
 * Creates a new asset type in ODEP.
 * Asset types categorize assets by nature (measurableByQuantity, measurableByTime) and platform affiliation.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {Object} body - Asset type creation payload (name, description, nature, etc.)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdAssetType, statusCode] tuple
 */
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

/**
 * Retrieves all asset types from ODEP that are affiliated with RESILINK.
 * Filters the full ODEP list to return only types with "RESILINK" in their description.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [resilinkAssetTypes[], statusCode] tuple
 */
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

/**
 * Retrieves all asset types registered in ODEP without any filter.
 * Used for development/admin views where all asset types need to be accessible.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [allAssetTypes[], statusCode] tuple
 */
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

/**
 * Retrieves detailed information for a specific asset type from ODEP.
 * Used when a single asset type record needs to be inspected or verified.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {string} id - Unique asset type identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assetType, statusCode] tuple
 */
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

/**
 * Updates an existing asset type by its ID in ODEP.
 * Allows modifying asset type metadata such as description, nature, or name.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {Object} body - Updated asset type fields
 * @param {string} id - Asset type identifier to update
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updateResponse, statusCode] tuple
 */
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

/**
 * Permanently deletes an asset type by its ID from ODEP.
 * Should only be used when no assets are referencing this asset type.
 *
 * @param {string} url - Base ODEP API URL for asset type endpoints
 * @param {string} id - Asset type identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteResponse, statusCode] tuple
 */
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