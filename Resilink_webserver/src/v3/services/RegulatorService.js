require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const Utils = require("./Utils.js");

/**
 * Creates a new regulator entity in ODEP.
 * Regulators oversee specific asset types and enforce platform compliance rules.
 *
 * @param {string} url - Base ODEP API URL for regulator endpoints
 * @param {Object} body - Regulator creation payload (name, regulatedAssetTypes, etc.)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdRegulator, statusCode] tuple
 */
const createRegulator = async (url, body, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  updateDataODEP.warn('data to send to ODEP', { from: 'createRegulator', dataToSend: body, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        "POST",
        url, 
        headers = {'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token},
        body);
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        updateDataODEP.error('error creating one regulator', { from: 'createRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        updateDataODEP.info('success creating one regulator', { from: 'createRegulator', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
};

/**
 * Retrieves all regulator entities registered in ODEP.
 * Used for admin dashboards and compliance management views.
 *
 * @param {string} url - Base ODEP API URL for regulator endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [regulators[], statusCode] tuple
 */
const getAllRegulator = async (url, token) => {
    const response = await Utils.fetchJSONData(
        "GET",
        url + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllRegulator', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else if(response.status != 200) {
        getDataLogger.error('error retrieving all regulators', { from: 'getAllRegulator', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      } else {
        getDataLogger.info('success retrieving all regulators', { from: 'getAllRegulator', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      }
    return [data, response.status];
}

/**
 * Retrieves a specific regulator entity by ID from ODEP.
 * Used for regulator detail views and compliance verification workflows.
 *
 * @param {string} url - Base ODEP API URL for regulator endpoints
 * @param {Object} body - Request body (may be empty for GET)
 * @param {string} id - Regulator identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [regulator, statusCode] tuple
 */
const getOneRegulator = async (url, body, id, token) => {
    const response = await Utils.fetchJSONData(
        "GET",
        url + id + "/", 
        headers = {'accept': 'application/json',
        'Authorization': token},
        body);
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getOneRegulator', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else if(response.status != 200) {
        getDataLogger.error('error retrieving one regulator', { from: 'getOneRegulator', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      } else {
        getDataLogger.info('success retrieving one regulator', { from: 'getOneRegulator', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      }
    return [data, response.status];
}

/**
 * Applies a partial update to a regulator entity in ODEP.
 * Used to update specific regulator attributes such as regulated asset types.
 *
 * @param {string} url - Base ODEP API URL for regulator endpoints
 * @param {Object} body - Partial update payload
 * @param {string} id - Regulator identifier to patch
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [patchResponse, statusCode] tuple
 */
const patchOneRegulator = async (url, body, id, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  patchDataODEP.warn('data & id to send to ODEP', { from: 'patchOneRegulator', dataToSend: body, id: id, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        "PATCH",
        url + id + "/", 
        headers = {'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token},
        body);
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      patchDataODEP.error('error: Unauthorize', { from: 'patchOneRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        patchDataODEP.error('error patching one regulator', { from: 'patchOneRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        patchDataODEP.info('success patching one regulator', { from: 'patchOneRegulator', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
}

/**
 * Permanently deletes a regulator entity by ID from ODEP.
 * Should only be used when the regulator has no active asset type associations.
 *
 * @param {string} url - Base ODEP API URL for regulator endpoints
 * @param {string} id - Regulator identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteResponse, statusCode] tuple
 */
const deleteRegulator = async (url, id, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  deleteDataODEP.warn('id to send to ODEP', { from: 'deleteRegulator', dataToSend: body, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        "DELETE",
        url + id + "/", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      deleteDataODEP.error('error: Unauthorize', { from: 'deleteRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        deleteDataODEP.error('error deleting one regulator', { from: 'deleteRegulator', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        deleteDataODEP.info('success deleting one regulator', { from: 'deleteRegulator', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
}

module.exports = {
    createRegulator,
    getAllRegulator,
    getOneRegulator,
    patchOneRegulator,
    deleteRegulator,
};