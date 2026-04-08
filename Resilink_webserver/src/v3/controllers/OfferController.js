require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const OfferService = require("../services/OfferService.js");
const _pathofferODEP = config.PATH_ODEP_OFFER; 

/**
 * Retrieves all available offers enriched with RESILINK-specific data.
 * Express handler delegating to OfferService.getAllOfferForResilinkCustom.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched offer list or a 500 error
 */
const getAllOfferResilinkCustom = async (req, res) => { 
    try {
      const response = await OfferService.getAllOfferForResilinkCustom(_pathofferODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllOfferResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
};

/**
 * Retrieves suggested offers for a specific prosumer based on their activity domain.
 * Express handler delegating to OfferService.getSuggestedOfferForResilinkCustom.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the suggested offer list or a 500 error
 */
const getSuggestedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getSuggestedOfferForResilinkCustom(_pathofferODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getSuggestedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

/**
 * Retrieves a paginated subset of RESILINK-enriched offers.
 * Express handler delegating to OfferService.getLimitedOfferForResilinkCustom.
 *
 * @param {Object} req - Express request object (query.offerNbr: page size, query.iteration: page index, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the paginated offer list or a 500 error
 */
const getLimitedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getLimitedOfferForResilinkCustom(_pathofferODEP, req.query.offerNbr, req.query.iteration, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getLimitedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

/**
 * Retrieves offers blocked by a specific prosumer.
 * Express handler delegating to OfferService.getBlockedOfferForResilinkCustom.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the blocked offer list or a 500 error
 */
const getBlockedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getBlockedOfferForResilinkCustom(_pathofferODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getBlockedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

/**
 * Retrieves offers filtered by criteria provided in the request body.
 * Express handler delegating to OfferService.getAllOfferFilteredCustom.
 *
 * @param {Object} req - Express request object (body: filter criteria, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the filtered offer list or a 500 error
 */
const getOfferFiltered = async (req, res) => {
  try {
    const response = await OfferService.getAllOfferFilteredCustom(_pathofferODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOfferFiltered', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

/**
 * Retrieves all offers created by the authenticated owner.
 * Express handler delegating to OfferService.getAllOwnerOffer.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the owner's offer list or a 500 error
 */
const getAllOwnerOffer = async (req, res) => {
  try {
    const response = await OfferService.getAllOwnerOffer(_pathofferODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllOwnerOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

/**
 * Creates a new offer in ODEP.
 * Express handler delegating to OfferService.createOffer.
 *
 * @param {Object} req - Express request object (body: offer payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created offer or a 500 error
 */
const createOffer = async (req, res) => {
  try {
    const response = await OfferService.createOffer(_pathofferODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Creates a new offer linked to an existing asset in ODEP.
 * Express handler delegating to OfferService.createOfferAsset.
 *
 * @param {Object} req - Express request object (body: offer-asset link payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created offer-asset or a 500 error
 */
const createOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.createOfferAsset(_pathofferODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves all offers from ODEP.
 * Express handler delegating to OfferService.getAllOffer.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the full offer list or a 500 error
 */
const getAllOffer = async (req, res) => {
  try {
    const response = await OfferService.getAllOffer(_pathofferODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves all offers purchased by the authenticated owner.
 * Express handler delegating to OfferService.getOwnerOfferPurchase.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the purchased offer list or a 500 error
 */
const getOwnerOfferPurchase = async (req, res) => {
  try {
    const response = await OfferService.getOwnerOfferPurchase(_pathofferODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOwnerOfferPurchase', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Retrieves a single offer by its ID from ODEP.
 * Express handler delegating to OfferService.getOneOffer.
 *
 * @param {Object} req - Express request object (params.id: offer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the offer data or a 500 error
 */
const getOneOffer = async (req, res) => {
  try {
    const response = await OfferService.getOneOffer(_pathofferODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOneOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Updates an offer by its ID in ODEP.
 * Express handler delegating to OfferService.putOffer.
 *
 * @param {Object} req - Express request object (params.id: offer ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated offer or a 500 error
 */
const putOffer = async (req, res) => {
  try {
    const response = await OfferService.putOffer(_pathofferODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'putOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Deletes an offer by its ID from ODEP.
 * Express handler delegating to OfferService.deleteOffer.
 *
 * @param {Object} req - Express request object (params.id: offer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteOffer = async (req, res) => {
  try {
    const response = await OfferService.deleteOffer(_pathofferODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

/**
 * Updates the asset linked to an offer by the offer ID in ODEP.
 * Express handler delegating to OfferService.putOfferAsset.
 *
 * @param {Object} req - Express request object (params.id: offer ID, body: asset update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the update result or a 500 error
 */
const putOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.putOfferAsset(_pathofferODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'putOfferAsset', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

module.exports = {
    getAllOfferResilinkCustom,
    getLimitedOfferForResilinkCustom,
    getSuggestedOfferForResilinkCustom,
    getBlockedOfferForResilinkCustom,
    getOfferFiltered,
    getAllOwnerOffer,
    getOwnerOfferPurchase,
    createOfferAsset,
    createOffer,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}