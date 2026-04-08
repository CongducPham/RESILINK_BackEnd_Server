require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");

/**
 * Creates a new purchase or rental request in ODEP.
 * Requests are used by prosumers to express interest in acquiring an offered asset.
 *
 * @param {string} url - Base ODEP API URL for request endpoints
 * @param {Object} body - Request creation payload (offerId, quantity, etc.)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdRequest, statusCode] tuple
 */
const createRequest = async (url, body, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  updateDataODEP.warn('data to send to ODEP', { from: 'createRequest', dataToSend: body, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        'POST',
        url, 
        headers = {'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token},
        body
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'createRequest', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        updateDataODEP.error('error creating one request', { from: 'createRequest', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        updateDataODEP.info('success creating one request', { from: 'createRequest', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
};

/**
 * Retrieves a specific request by ID from ODEP.
 * Used to display the current status and details of a transaction request.
 *
 * @param {string} url - Base ODEP API URL for request endpoints
 * @param {string} id - Unique request identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [request, statusCode] tuple
 */
const getOneRequest = async (url, id, token) => {
    const response = await Utils.fetchJSONData(
        'GET',
        url + id, 
        headers = {'accept': 'application/json',
        'Authorization': token});
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getOneRequest', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else if(response.status != 200) {
        getDataLogger.error('error retrieving one regulator', { from: 'getOneRequest', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      } else {
        getDataLogger.info('success retrieving one regulator', { from: 'getOneRequest', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      }
    return [data, response.status];
};

/**
 * Retrieves all requests registered in ODEP.
 * Used for admin panels and overview of platform transaction activity.
 *
 * @param {string} url - Base ODEP API URL for request endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [requests[], statusCode] tuple
 */
const getAllRequest = async (url, token) => {
    const response = await Utils.fetchJSONData(
        'GET',
        url + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllRequest', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    } else if(response.status != 200) {
        getDataLogger.error('error retrieving all regulators', { from: 'getAllRequest', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      } else {
        getDataLogger.info('success retrieving all regulators', { from: 'getAllRequest', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      }
    return [data, response.status];
};

/**
 * Updates a request by ID in ODEP.
 * Used to modify request parameters such as quantity or status during negotiation.
 *
 * @param {string} url - Base ODEP API URL for request endpoints
 * @param {Object} body - Updated request fields
 * @param {string} id - Request identifier to update
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updateResponse, statusCode] tuple
 */
const putRequest = async (url, body, id, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  updateDataODEP.warn('data to send to ODEP', { from: 'putRequest', dataToSend: body, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        'PUT',
        url + id, 
        headers = {'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token},
        body
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      updateDataODEP.error('error: Unauthorize', { from: 'putRequest', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        updateDataODEP.error('error updating one regulator', { from: 'putRequest', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        updateDataODEP.info('success updating one regulator', { from: 'putRequest', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
};

/**
 * Permanently deletes a request by ID from ODEP.
 * Used when a prosumer withdraws a transaction request before contract creation.
 *
 * @param {string} url - Base ODEP API URL for request endpoints
 * @param {string} id - Request identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteResponse, statusCode] tuple
 */
const deleteRequest = async (url, id, token) => {
  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
  deleteDataODEP.warn('id to send to ODEP', { from: 'deleteRequest', dataToSend: body, username: username ?? "no user associated with the token"});
    const response = await Utils.fetchJSONData(
        'DELETE',
        url + id, 
        headers = {'accept': 'application/json',
        'Authorization': token}
    );
    const data = await Utils.streamToJSON(response.body);
    if(response.status == 401) {
      deleteDataODEP.error('error: Unauthorize', { from: 'deleteRequest', dataReceived: data, username: username ?? "no user associated with the token"});
    } else if(response.status != 200) {
        deleteDataODEP.error('error deleting one regulator', { from: 'deleteRequest', dataReceived: data, username: username ?? "no user associated with the token"});
      } else {
        deleteDataODEP.info('success deleting one regulator', { from: 'deleteRequest', username: username ?? "no user associated with the token"});
      }
    return [data, response.status];
};

module.exports = {
    createRequest,
    getOneRequest,
    getAllRequest,
    putRequest,
    deleteRequest,
}