require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const prosummerService = require("../services/ProsummerService.js");
const pathUserODEP = config.PATH_ODEP_USER + 'users/';
const _pathProsumerODEP = config.PATH_ODEP_PROSUMER;

/**
 * Creates a new prosumer in ODEP.
 * Express handler delegating to prosummerService.createProsummer.
 *
 * @param {Object} req - Express request object (body: prosumer payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created prosumer or a 500 error
 */
const createProsumer = async (req, res) => { 
  try {
    const response = await prosummerService.createProsummer(_pathProsumerODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves all prosumers from ODEP.
 * Express handler delegating to prosummerService.getAllProsummer.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the prosumer list or a 500 error
 */
const getAllProsummer = async (req, res) => { 
  try {
    const response = await prosummerService.getAllProsummer(_pathProsumerODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Creates a new prosumer in ODEP and the RESILINK database with extra custom fields.
 * Express handler delegating to prosummerService.createProsumerCustom.
 *
 * @param {Object} req - Express request object (body: prosumer payload with custom fields, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created prosumer or a 500 error
 */
const createProsumerCustom = async (req, res) => {
  try {
    const response = await prosummerService.createProsumerCustom(_pathProsumerODEP, pathUserODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createProsumerCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
}
  
/**
 * Retrieves all prosumers enriched with RESILINK-specific data.
 * Express handler delegating to prosummerService.getAllProsummerCustom.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched prosumer list or a 500 error
 */
const getAllProsummerCustom = async (req, res) => { 
  try {
    const response = await prosummerService.getAllProsummerCustom(_pathProsumerODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllProsummerCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};
  
/**
 * Retrieves a single prosumer by their ID from ODEP.
 * Express handler delegating to prosummerService.getOneProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the prosumer data or a 500 error
 */
const getOneProsumer = async (req, res) => {
  try {
    const response = await prosummerService.getOneProsummer(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOneProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves a single prosumer by their ID enriched with RESILINK-specific data.
 * Express handler delegating to prosummerService.getOneProsummerCustom.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched prosumer data or a 500 error
 */
const getOneProsummerCustom = async (req, res) => {
  try {
    const response = await prosummerService.getOneProsummerCustom(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOneProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};
  
/**
 * Deletes a prosumer by their ID from ODEP.
 * Express handler delegating to prosummerService.deleteOneProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteOneProsummer = async (req, res) => {
  try {
    const response = await prosummerService.deleteOneProsummer(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOneProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Updates the personal data (user profile) of a prosumer in ODEP and RESILINK.
 * Express handler delegating to prosummerService.updateUserProsumerCustom.
 *
 * @param {Object} req - Express request object (params.prosumerId: prosumer ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated prosumer or a 500 error
 */
const putUserProsumerPersonnalData = async (req, res) => {
  try {
    const response = await prosummerService.updateUserProsumerCustom(pathUserODEP ,req.body, req.params.prosumerId, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'putUserProsumerPersonnalData', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Updates the balance of a prosumer in ODEP.
 * Express handler delegating to prosummerService.patchBalanceProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: balance payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated balance or a 500 error
 */
const patchBalanceProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBalanceProsummer(_pathProsumerODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBalanceProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Updates the activity domain of a prosumer in the RESILINK database.
 * Express handler delegating to prosummerService.patchActivityDomainProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: activity domain payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated prosumer data or a 500 error
 */
const patchActivityDomainProsummer = async (req, res) => {
  try {
    const response = await prosummerService.patchActivityDomainProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBalanceProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Updates the sharing preferences of a prosumer in ODEP.
 * Express handler delegating to prosummerService.patchSharingProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: sharing payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated prosumer or a 500 error
 */
const patchSharingProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchSharingProsummer(_pathProsumerODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchSharingProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Adds a news ID to the bookmarked list of a prosumer in the RESILINK database.
 * Express handler delegating to prosummerService.patchBookmarkProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: bookmark payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated bookmark list or a 500 error
 */
const patchBookmarkProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBookmarkProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBookmarkProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Removes a news ID from the bookmarked list of a prosumer in the RESILINK database.
 * Express handler delegating to prosummerService.deleteIdBookmarkedList.
 *
 * @param {Object} req - Express request object (query.owner: prosumer ID, query.id: news ID to remove, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated bookmark list or a 500 error
 */
const deleteIdBookmarkedList = async (req, res) => { 
  try {
    const response = await prosummerService.deleteIdBookmarkedList(req.query.owner, req.query.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink Database', { from: 'deleteIdBookmarkedList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Adds an offer ID to the blocked offers list of a prosumer in the RESILINK database.
 * Express handler delegating to prosummerService.patchAddblockedOffersProsummer.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: blocked offer payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated blocked offers list or a 500 error
 */
const patchBlockedOfferProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchAddblockedOffersProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBlockedOfferProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Removes an offer ID from the blocked offers list of a prosumer in the RESILINK database.
 * Express handler delegating to prosummerService.deleteIdBlockedOffersList.
 *
 * @param {Object} req - Express request object (query.owner: prosumer ID, query.id: offer ID to remove, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated blocked offers list or a 500 error
 */
const deleteIdBlockedOfferList = async (req, res) => { 
  try {
    const response = await prosummerService.deleteIdBlockedOffersList(req.query.owner, req.query.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink Database', { from: 'deleteIdBlockedOfferList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Deletes a prosumer from both ODEP and the RESILINK local database.
 * Express handler delegating to prosummerService.deleteProsumerODEPRESILINK.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteProsumerODEPRESILINK = async (req, res) => {
  try {
    const response = await prosummerService.deleteProsumerODEPRESILINK(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOneProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

module.exports = {
    getAllProsummer,
    getOneProsumer,
    getOneProsummerCustom,
    createProsumer,
    deleteOneProsummer,
    putUserProsumerPersonnalData,
    patchBalanceProsumer,
    patchSharingProsumer,
    patchActivityDomainProsummer,
    createProsumerCustom,
    getAllProsummerCustom,
    patchBookmarkProsumer,
    deleteIdBookmarkedList,
    patchBlockedOfferProsumer,
    deleteIdBlockedOfferList,
    deleteProsumerODEPRESILINK
};
  