require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const prosummerService = require("../services/ProsummerService.js");

/**
 * HTTP POST - Creates a new prosumer profile (producer-consumer).
 * Registers participants who can trade resources.
 * Links to existing user account.
 * 
 * @route POST /prosummers
 * @param {Request} req - Express request with prosumer data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created prosumer profile with generated ID
 */
const createProsumer = async (req, res) => {
  try {
    const response = await prosummerService.createProsummer(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Error creating prosumer', { from: 'createProsumer', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Creates a prosumer profile simultaneously with a user account.
 * Streamlined registration flow for new marketplace participants.
 * Single transaction creates both authentication and trading profiles.
 * 
 * @route POST /prosummers/withuser
 * @param {Request} req - Express request with combined user+prosumer data in body
 * @param {Response} res - Express response object
 * @returns {Object} Created prosumer profile with linked user account
 */
const createProsumerWithUser = async (req, res) => {
  try {
    const response = await prosummerService.createProsumerWithUser(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Error creating prosumer with user', { from: 'createProsumerWithUser', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all prosumer profiles in the platform.
 * 
 * @route GET /prosummers
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of prosumer profiles
 */
const getAllProsummer = async (req, res) => {
  try {
    const response = await prosummerService.getAllProsummer(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving prosumers', { from: 'getAllProsummer', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves detailed profile for a specific prosumer.
 * Returns balance, preferences, and contact information if authorized.
 * 
 * @route GET /prosummers/:id
 * @param {Request} req - Express request with prosumer ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed prosumer profile information
 */
const getOneProsumer = async (req, res) => {
  try {
    const response = await prosummerService.getOneProsummer(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving prosumer', { from: 'getOneProsumer', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates user and prosumer personal information.
 * Users modify contact details, location, bio, or profile preferences.
 * Only user owner or admin can update.
 * 
 * @route PUT /prosummers/:prosumerId/personal
 * @param {Request} req - Express request with prosumer ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated prosumer profile or error if unauthorized
 */
const putUserProsumerPersonnalData = async (req, res) => {
  try {
    const response = await prosummerService.updateUserProsumer(req.body, req.params.prosumerId, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error updating prosumer personal data', {
      from: 'putUserProsumerPersonnalData',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Adjusts prosumer's account balance.
 * Admin or owner updates credits.
 * Means to reflect transactions, penalties, or rewards in the marketplace;
 * Contract not being locally implemented yet, this endpoint allows manual balance adjustments for testing and administration.
 * 
 * @route PATCH /prosummers/:id/balance
 * @param {Request} req - Express request with prosumer ID in params and balance change in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated balance or error if unauthorized
 */
const patchBalanceProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBalanceProsummer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error patching prosumer balance', {
      from: 'patchBalanceProsumer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates prosumer's job/occupation information.
 * Helps identify industry-specific trading opportunities.
 * Admin or owner can update this information.
 * 
 * @route PATCH /prosummers/:id/job
 * @param {Request} req - Express request with prosumer ID in params and job data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated job information
 */
const patchJobProsummer = async (req, res) => {
  try {
    const response = await prosummerService.patchJobProsummer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error patching prosumer job', {
      from: 'patchJobProsummer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Updates prosumer's data sharing scores.
 * Users control visibility of their profile.
 * 
 * @route PATCH /prosummers/:id/sharing
 * @param {Request} req - Express request with prosumer ID in params and sharing settings in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated sharing scores
 */
const patchSharingProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchSharingProsummer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error patching prosumer sharing', {
      from: 'patchSharingProsumer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PATCH - Adds a news to prosumer's bookmark list.
 * Users save favorite news.
 * Enables "Saved News" collections for quick access.
 * 
 * @route PATCH /prosummers/:id/bookmarks
 * @param {Request} req - Express request with prosumer ID in params and bookmark data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated bookmark list
 */
const patchBookmarkProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBookmarkProsummer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error patching prosumer bookmarks', {
      from: 'patchBookmarkProsumer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes a specific news from prosumer's bookmarks.
 * Users clean up saved news that are no longer relevant.
 * 
 * @route DELETE /prosummers/bookmarks?owner=prosumerId&id=itemId
 * @param {Request} req - Express request with owner and item ID in query params
 * @param {Response} res - Express response object
 * @returns {Object} Updated bookmark list without the removed item
 */
const deleteIdBookmarkedList = async (req, res) => {
  try {
    const response = await prosummerService.deleteIdBookmarkedList(req.query.owner, req.query.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error deleting bookmarked ID', {
      from: 'deleteIdBookmarkedList',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Blocks an offer from a specific server for the prosumer.
 * Modern multi-server federation blocking implementation.
 * Allows blocking offers from local server or any federated external server.
 * 
 * @route POST /prosummers/:id/blocked-offers/server
 * @param {Request} req - Express request with prosumer ID in params and { serverName, offerId } in body
 * @param {Response} res - Express response object
 * @returns {Object} Success message confirming offer is blocked
 */
const blockOfferByServer = async (req, res) => {
  try {
    const response = await prosummerService.blockOfferByServer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Error blocking offer by server', {
      from: 'blockOfferByServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves blocked offers for a specific server.
 * Returns array of offer IDs blocked from the specified server.
 * 
 * @route GET /prosummers/:id/blocked-offers/server/:serverName
 * @param {Request} req - Express request with prosumer ID and serverName in params
 * @param {Response} res - Express response object
 * @returns {Object} Array of blocked offer IDs for the specified server
 */
const getBlockedOffersByServer = async (req, res) => {
  try {
    const response = await prosummerService.getBlockedOffersByServer(
      req.params.id, 
      req.query.serverName, 
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error getting blocked offers by server', {
      from: 'getBlockedOffersByServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all blocked offers for the prosumer.
 * Returns complete map of all servers with their respective blocked offer IDs.
 * 
 * @route GET /prosummers/:id/blocked-offers/all
 * @param {Request} req - Express request with prosumer ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Map structure { serverName: [offerIds] }
 */
const getAllBlockedOffers = async (req, res) => {
  try {
    const response = await prosummerService.getAllBlockedOffers(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error getting all blocked offers', {
      from: 'getAllBlockedOffers',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Unblocks an offer from a specific server.
 * Removes offer from the blocked list of the specified server.
 * 
 * @route DELETE /prosummers/:id/blocked-offers/server/:serverName/:offerId
 * @param {Request} req - Express request with prosumer ID, serverName, and offerId in params
 * @param {Response} res - Express response object
 * @returns {Object} Success message confirming offer is unblocked
 */
const unblockOfferByServer = async (req, res) => {
  try {
    const response = await prosummerService.unblockOfferByServer(
      req.params.id,
      req.query.serverName,
      req.params.offerId,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error unblocking offer by server', {
      from: 'unblockOfferByServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Permanently removes a prosumer profile.
 * Users close their marketplace account.
 * Only prosumer owner or admin can delete.
 * 
 * @route DELETE /prosummers/:id
 * @param {Request} req - Express request with prosumer ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteProsumer = async (req, res) => {
  try {
    const response = await prosummerService.deleteProsumer(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Error deleting prosumer', {
      from: 'deleteProsumer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getAllProsummer,
  getOneProsumer,
  createProsumer,
  createProsumerWithUser,
  putUserProsumerPersonnalData,
  patchBalanceProsumer,
  patchSharingProsumer,
  patchJobProsummer,
  patchBookmarkProsumer,
  deleteIdBookmarkedList,
  deleteProsumer,
  // New multi-server blocked offers controllers
  blockOfferByServer,
  getBlockedOffersByServer,
  getAllBlockedOffers,
  unblockOfferByServer
};
