require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const ContractService = require('../services/ContractService.js');

const _pathContractODEP = config.PATH_ODEP_CONTRACT;

/**
 * HTTP POST - Creates a new contract in the ODEP system.
 * Formalizes agreements between prosumers for resource trading (purchase/rental).
 * Validated users initiate contracts specifying terms, duration, and pricing.
 * 
 * @route POST /contracts
 * @param {Request} req - Express request with contract data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created contract with ODEP ID and status
 */
const createContract = async (req, res) => {
  try {
    const response = await ContractService.createContract(
      _pathContractODEP,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'createContract',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all contracts registered in the ODEP system.
 * Admin users view complete contract database for monitoring and auditing.
 * 
 * @route GET /contracts
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of platform contracts
 */
const getAllContract = async (req, res) => {
  try {
    const response = await ContractService.getAllContract(
      _pathContractODEP,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getAllContract',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves active ongoing contracts for a specific user.
 * Prosumers track their current trading agreements (not completed or cancelled).
 * Used by dashboard to show active commitments and obligations.
 * 
 * @route GET /contracts/owner/:id/ongoing
 * @param {Request} req - Express request with owner ID in params
 * @param {Response} res - Express response object
 * @returns {Array} List of active contracts for the specified owner
 */
const getOwnerContractOngoing = async (req, res) => {
  try {
    const response = await ContractService.getOwnerContractOngoing(
      _pathContractODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOwnerContractOngoing',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves detailed information for a specific contract.
 * Returns complete contract terms, parties involved, status, and transaction history.
 * 
 * @route GET /contracts/:id
 * @param {Request} req - Express request with contract ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed contract information from ODEP
 */
const getOneContract = async (req, res) => {
  try {
    const response = await ContractService.getOneContract(
      _pathContractODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOneContract',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all contracts (any status) for a specific owner.
 * Prosumers view complete contract history including completed and cancelled ones.
 * 
 * @route GET /contracts/owner/:id
 * @param {Request} req - Express request with owner ID in params
 * @param {Response} res - Express response object
 * @returns {Array} Complete contract list for the specified owner
 */
const getContractFromOwner = async (req, res) => {
  try {
    const response = await ContractService.getContractFromOwner(
      _pathContractODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getContractFromOwner',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates an immaterial (digital/service) contract.
 * Modifies terms for intangible resources like data, software licenses, or services.
 * Only contract parties can update before finalization.
 * 
 * @route PATCH /contracts/:id/immaterial
 * @param {Request} req - Express request with contract ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated contract status from ODEP
 */
const patchContractImmaterial = async (req, res) => {
  try {
    const response = await ContractService.patchContractImmaterial(
      _pathContractODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', {
      from: 'patchContractImmaterial',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates a material purchase contract.
 * Modifies terms for physical asset sales (equipment, batteries, vehicles).
 * Handles ownership transfer details, payment terms, and delivery logistics.
 * 
 * @route PATCH /contracts/:id/material/purchase
 * @param {Request} req - Express request with contract ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated contract status from ODEP
 */
const patchContractMaterialPurchase = async (req, res) => {
  try {
    const response = await ContractService.patchContractMaterialPurchase(
      _pathContractODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', {
      from: 'patchContractMaterialPurchase',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates a material rental contract.
 * Modifies terms for physical asset rentals (temporary use agreements).
 * Adjusts rental duration, pricing, deposit requirements, or return conditions.
 * 
 * @route PATCH /contracts/:id/material/rent
 * @param {Request} req - Express request with contract ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated contract status from ODEP
 */
const patchContractMaterialRent = async (req, res) => {
  try {
    const response = await ContractService.patchContractMaterialRent(
      _pathContractODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', {
      from: 'patchContractMaterialRent',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Cancels an existing contract.
 * Either party can initiate cancellation (subject to contract terms).
 * Triggers refund logic, asset unlocking, and notification workflows.
 * 
 * @route PATCH /contracts/:id/cancel
 * @param {Request} req - Express request with contract ID in params and cancellation reason in body
 * @param {Response} res - Express response object
 * @returns {Object} Cancellation confirmation from ODEP
 */
const patchContractCancel = async (req, res) => {
  try {
    const response = await ContractService.patchContractCancel(
      _pathContractODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', {
      from: 'patchContractCancel',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createContract,
  getOneContract,
  getAllContract,
  getOwnerContractOngoing,
  getContractFromOwner,
  patchContractImmaterial,
  patchContractMaterialPurchase,
  patchContractMaterialRent,
  patchContractCancel
};
