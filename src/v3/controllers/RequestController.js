require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const RequestService = require("../services/RequestService.js");

const _pathRequestODEP = config.PATH_ODEP_REQUEST;

/**
 * HTTP POST - Creates new resource request in ODEP system.
 * Users initiate requests for assets or services.
 * Links to marketplace offers and contract workflow.
 * 
 * @route POST /requests
 * @param {Request} req - Express request with request data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created request with generated ID
 */
const createRequest = async (req, res) => {
  try {
    const response = await RequestService.createRequest(
      _pathRequestODEP,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'createRequest',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves specific resource request by ID.
 * Returns detailed request information including status and linked contracts.
 * Used for request detail view and tracking.
 * 
 * @route GET /requests/:id
 * @param {Request} req - Express request with request ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Request details or error if not found
 */
const getOneRequest = async (req, res) => {
  try {
    const response = await RequestService.getOneRequest(
      _pathRequestODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOneRequest',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all resource requests from ODEP system.
 * Returns complete list of requests across all users.
 * Used for admin monitoring and request management.
 * 
 * @route GET /requests
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} List of all resource requests
 */
const getAllRequest = async (req, res) => {
  try {
    const response = await RequestService.getAllRequest(
      _pathRequestODEP,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getAllRequest',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates existing resource request.
 * Users modify pending request details (quantities, specifications).
 * Only pending requests can be updated.
 * 
 * @route PUT /requests/:id
 * @param {Request} req - Express request with request ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated request or error if unauthorized/approved
 */
const putRequest = async (req, res) => {
  try {
    const response = await RequestService.putRequest(
      _pathRequestODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'putRequest',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes resource request from ODEP system.
 * Users cancel unfulfilled requests.
 * 
 * @route DELETE /requests/:id
 * @param {Request} req - Express request with request ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteRequest = async (req, res) => {
  try {
    const response = await RequestService.deleteRequest(
      _pathRequestODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', {
      from: 'deleteRequest',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getOneRequest,
  getAllRequest,
  putRequest,
  deleteRequest
};
