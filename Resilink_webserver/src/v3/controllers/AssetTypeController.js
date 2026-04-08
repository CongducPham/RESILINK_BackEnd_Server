require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const assettypeService = require("../services/AssetTypeService.js");
const _pathassetTypesODEP = config.PATH_ODEP_ASSETTYPE; 

/**
 * Creates a new asset type in ODEP.
 * Express handler delegating to assettypeService.createAssetTypes.
 *
 * @param {Object} req - Express request object (body: asset type payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created asset type or a 500 error
 */
const createAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.createAssetTypes(_pathassetTypesODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Error accessing ODEP', { from: 'createAssetTypes', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all asset types from ODEP.
 * Express handler delegating to assettypeService.getAllAssetTypes.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the asset type list or a 500 error
 */
const getAllAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypes(_pathassetTypesODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getAllAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all asset types from ODEP with dev-mode enrichment.
 * Express handler delegating to assettypeService.getAllAssetTypesDev.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched asset type list or a 500 error
 */
const getAllAssetTypesDev = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypesDev(_pathassetTypesODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getAllAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves a single asset type by its ID from ODEP.
 * Express handler delegating to assettypeService.getOneAssetTypes.
 *
 * @param {Object} req - Express request object (params.id: asset type ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the asset type data or a 500 error
 */
const getOneAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.getOneAssetTypes(_pathassetTypesODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getOneAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Updates an asset type by its ID in ODEP.
 * Express handler delegating to assettypeService.putAssetTypes.
 *
 * @param {Object} req - Express request object (params.id: asset type ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated asset type or a 500 error
 */
const putAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.putAssetTypes(_pathassetTypesODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Error accessing ODEP', { from: 'putAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Deletes an asset type by its ID from ODEP.
 * Express handler delegating to assettypeService.deleteAssetTypes.
 *
 * @param {Object} req - Express request object (params.id: asset type ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.deleteAssetTypes(_pathassetTypesODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Error accessing ODEP', { from: 'deleteAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all asset types enriched with RESILINK recommendation statistics.
 * Express handler delegating to assettypeService.getAllAssetTypesResilink.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the RESILINK-enriched asset type list or a 500 error
 */
const getAllAssetTypesResilink = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypesResilink(req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Error accessing ODEP', { from: 'deleteAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

module.exports = {
    createAssetTypes,
    getAllAssetTypes,
    getAllAssetTypesDev,
    getOneAssetTypes,
    putAssetTypes,
    deleteAssetTypes,
    getAllAssetTypesResilink
}