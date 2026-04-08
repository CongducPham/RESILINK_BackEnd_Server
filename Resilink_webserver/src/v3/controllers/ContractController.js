require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const ContractService = require("../services/ContractService.js");

const _pathContractODEP = config.PATH_ODEP_CONTRACT;

/**
 * Creates a new contract in ODEP.
 * Express handler delegating to ContractService.createContract.
 *
 * @param {Object} req - Express request object (body: contract payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created contract or a 500 error
 */
const createContract = async (req, res) => {
    try {
      const response = await ContractService.createContract(_pathContractODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Retrieves all contracts from ODEP.
 * Express handler delegating to ContractService.getAllContract.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the contract list or a 500 error
 */
const getAllContract = async (req, res) => {
    try {
      const response = await ContractService.getAllContract(_pathContractODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Retrieves all ongoing contracts owned by the authenticated user from ODEP.
 * Express handler delegating to ContractService.getOwnerContractOngoing.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the ongoing contract list or a 500 error
 */
const getOwnerContractOngoing = async (req, res) => {
  try {
    const response = await ContractService.getOwnerContractOngoing(_pathContractODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOwnerContractOngoing', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves a single contract by its ID from ODEP.
 * Express handler delegating to ContractService.getOneContract.
 *
 * @param {Object} req - Express request object (params.id: contract ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the contract data or a 500 error
 */
const getOneContract = async (req, res) => {
    try {
      const response = await ContractService.getOneContract(_pathContractODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Retrieves all contracts where the authenticated user is a party.
 * Express handler delegating to ContractService.getContractFromOwner.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the owner's contract list or a 500 error
 */
const getContractFromOwner = async (req, res) => {
    try {
      const response = await ContractService.getContractFromOwner(_pathContractODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getContractFromOwner', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Patches the time-based measurement data of a contract in ODEP.
 * Express handler delegating to ContractService.patchMeasurableByTimeContract.
 *
 * @param {Object} req - Express request object (params.id: contract ID, body: time data, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated contract or a 500 error
 */
const patchMeasurableByTimeContract = async (req, res) => {
    try {
      const response = await ContractService.patchMeasurableByTimeContract(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchMeasurableByTimeContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Patches the quantity-based measurement data of a contract in ODEP.
 * Express handler delegating to ContractService.patchMeasurableByQuantityContract.
 *
 * @param {Object} req - Express request object (params.id: contract ID, body: quantity data, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated contract or a 500 error
 */
const patchMeasurableByQuantityContract = async (req, res) => {
    try {
      const response = await ContractService.patchMeasurableByQuantityContract(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchMeasurableByQuantityContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

/**
 * Cancels a contract by its ID in ODEP.
 * Express handler delegating to ContractService.patchContractCancel.
 *
 * @param {Object} req - Express request object (params.id: contract ID, body: cancellation payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the cancellation result or a 500 error
 */
const patchContractCancel = async (req, res) => {
    try {
      const response = await ContractService.patchContractCancel(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchContractCancel', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

module.exports = {
    createContract,
    getOneContract,
    getAllContract,
    getOwnerContractOngoing,
    getContractFromOwner,
    patchMeasurableByTimeContract,
    patchMeasurableByQuantityContract,
    patchContractCancel,
}