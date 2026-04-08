require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const RequestService = require("../services/RequestService.js");

const _pathRequestODEP = config.PATH_ODEP_REQUEST;

/**
 * Creates a new transaction request in ODEP.
 * Express handler delegating to RequestService.createRequest.
 *
 * @param {Object} req - Express request object (body: request payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created request or a 500 error
 */
const createRequest = async (req, res) => {
    try {
      const response = await RequestService.createRequest(_pathRequestODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createRequest', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Retrieves a single transaction request by its ID from ODEP.
 * Express handler delegating to RequestService.getOneRequest.
 *
 * @param {Object} req - Express request object (params.id: request ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the request data or a 500 error
 */
const getOneRequest = async (req, res) => {
    try {
      const response = await RequestService.getOneRequest(_pathRequestODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneRequest', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Retrieves all transaction requests from ODEP.
 * Express handler delegating to RequestService.getAllRequest.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the full request list or a 500 error
 */
const getAllRequest = async (req, res) => {
    try {
      const response = await RequestService.getAllRequest(_pathRequestODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllRequest', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Updates a transaction request by its ID in ODEP.
 * Express handler delegating to RequestService.putRequest.
 *
 * @param {Object} req - Express request object (params.id: request ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated request or a 500 error
 */
const putRequest = async (req, res) => {
    try {
      const response = await RequestService.putRequest(_pathRequestODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'putRequest', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Deletes a transaction request by its ID from ODEP.
 * Express handler delegating to RequestService.deleteRequest.
 *
 * @param {Object} req - Express request object (params.id: request ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteRequest = async (req, res) => {
    try {
      const response = await RequestService.deleteRequest(_pathRequestODEP, req.params.id,req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Catched error', { from: 'deleteRequest', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

module.exports = {
    createRequest,
    getOneRequest,
    getAllRequest,
    putRequest,
    deleteRequest,
}