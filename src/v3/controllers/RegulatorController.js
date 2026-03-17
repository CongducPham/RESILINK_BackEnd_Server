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
 * HTTP POST - Creates a new regulator entity in the ODEP system.
 * Registers official energy market regulators or certification bodies.
 * Enables compliance tracking and regulatory oversight of contracts.
 * 
 * @route POST /regulators
 * @param {Request} req - Express request with regulator details in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created regulator with ODEP registration ID
 */
const createRegulator = async (req, res) => {
  try {
    const response = await RegulatorService.createRegulator(
      _pathRegulatorODEP,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'createRegulator',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all registered regulators from ODEP.
 * Displays available regulatory bodies and certification authorities.
 * Users select appropriate regulator when creating contracts.
 * 
 * @route GET /regulators
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of registered regulators
 */
const getAllRegulator = async (req, res) => {
  try {
    const response = await RegulatorService.getAllRegulator(
      _pathRegulatorODEP,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getAllRegulator',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves details for a specific regulator.
 * Returns contact information, jurisdiction, and certification criteria.
 * Used for compliance verification and contract validation.
 * 
 * @route GET /regulators/:id
 * @param {Request} req - Express request with regulator ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed regulator information from ODEP
 */
const getOneRegulator = async (req, res) => {
  try {
    const response = await RegulatorService.getOneRegulator(
      _pathRegulatorODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOneRegulator',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates an existing regulator's information.
 * Admin or regulator updates contact details, jurisdiction, or policies.
 * Maintains accuracy of regulatory compliance database.
 * 
 * @route PATCH /regulators/:id
 * @param {Request} req - Express request with regulator ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated regulator information or error if unauthorized
 */
const patchOneRegulator = async (req, res) => {
  try {
    const response = await RegulatorService.patchOneRegulator(
      _pathRegulatorODEP,
      req.body,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', {
      from: 'patchOneRegulator',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes a regulator from the ODEP system.
 * Admin decommissions inactive or obsolete regulatory entities.
 * Prevents new contracts from referencing removed regulators.
 * 
 * @route DELETE /regulators/:id
 * @param {Request} req - Express request with regulator ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if in use
 */
const deleteRegulator = async (req, res) => {
  try {
    const response = await RegulatorService.deleteRegulator(
      _pathRegulatorODEP,
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', {
      from: 'deleteRegulator',
      error: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createRegulator,
  getAllRegulator,
  getOneRegulator,
  patchOneRegulator,
  deleteRegulator
};
