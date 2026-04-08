require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const RegulatorService = require("../services/RegulatorService.js");

const _pathRegulatorODEP = config.PATH_ODEP_REGULATOR;


/**
 * Creates a new regulator entity in ODEP.
 * Express handler delegating to RegulatorService.createRegulator.
 *
 * @param {Object} req - Express request object (body: regulator payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created regulator or a 500 error
 */
const createRegulator = async (req, res) => {
    try {
      const response = await RegulatorService.createRegulator(_pathRegulatorODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createRegulator', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Retrieves all regulators from ODEP.
 * Express handler delegating to RegulatorService.getAllRegulator.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the regulator list or a 500 error
 */
const getAllRegulator = async (req, res) => {
    try {
      const response = await RegulatorService.getAllRegulator(_pathRegulatorODEP, req.header('Authorization') ?? ""); 
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllRegulator', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Retrieves a single regulator by its ID from ODEP.
 * Express handler delegating to RegulatorService.getOneRegulator.
 *
 * @param {Object} req - Express request object (params.id: regulator ID, body: optional filter, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the regulator data or a 500 error
 */
const getOneRegulator = async (req, res) => {
    try {
      const response = await RegulatorService.getOneRegulator(_pathRegulatorODEP, req.body, req.params.id, req.header('Authorization') ?? ""); 
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneRegulator', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Partially updates a regulator by its ID in ODEP.
 * Express handler delegating to RegulatorService.patchOneRegulator.
 *
 * @param {Object} req - Express request object (params.id: regulator ID, body: partial update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated regulator or a 500 error
 */
const patchOneRegulator = async (req, res) => {
    try {
      const response = await RegulatorService.patchOneRegulator(_pathRegulatorODEP, req.body, req.params.id, req.header('Authorization') ?? ""); 
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchOneRegulator', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

/**
 * Deletes a regulator by its ID from ODEP.
 * Express handler delegating to RegulatorService.deleteRegulator.
 *
 * @param {Object} req - Express request object (params.id: regulator ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteRegulator = async (req, res) => {
    try {
      const response = await RegulatorService.deleteRegulator(_pathRegulatorODEP, req.params.id, req.header('Authorization') ?? ""); 
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Catched error', { from: 'deleteRegulator', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
}

module.exports = {
    createRegulator,
    getAllRegulator,
    getOneRegulator,
    patchOneRegulator,
    deleteRegulator,
};
  