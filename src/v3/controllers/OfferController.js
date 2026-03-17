require('../loggers.js');
const { getDBError} = require('../errors.js');
const winston = require('winston');
const Utils = require("../services/Utils.js");

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const OfferService = require("../services/OfferService.js");

/**
 * HTTP GET - Retrieves offers from local server only (no federation).
 * Returns only offers from the current RESILINK instance.
 * Public endpoint - works with or without authentication.
 * 
 * @route GET /offers/local/all
 * @param {Request} req - Express request with optional authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Local server offers mapped by offerId
 */
const getLocalOffersOnly = async (req, res) => { 
  try {
    const response = await OfferService.getLocalOffersOnlyCustom(req.user, req.fromServer ?? false);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getLocalOffersOnly",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({message: error.message})
  }
};

/**
 * HTTP GET - Retrieves federated offers: local + favorite external servers.
 * Aggregates offers from user's configured favorite RESILINK servers.
 * Requires authentication to access federation functionality.
 * 
 * @route GET /offers/federated/all
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Federated offers from local and favorite servers
 */
const getFederatedOffers = async (req, res) => { 
  try {
    const response = await OfferService.getFederatedOffersCustom(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getFederatedOffers",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({message: error.message})
  }
};

/**
 * HTTP GET - Retrieves top 3 personalized recommended offers for user.
 * Number of offers can be adjusted by changing the query parameter 
 * (e.g., offerNbr=5, iteration=1 means the second batch of 5 offers).
 * Uses recommendation engine with weighted scoring based on user interaction history.
 * Frontend displays these in "Suggested for You" sections.
 * 
 * @route GET /offers/suggested
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Top recommended offers with relevance scores
 */
const getSuggestedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getWeightedLimitedOffersForResilink(req.query.offerNbr, req.query.iteration, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getSuggestedOfferForResilinkCustom",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves paginated offers for infinite scroll/lazy loading.
 * Clients request specific batch size and iteration for performance optimization.
 * Reduces initial load time and bandwidth for large marketplaces.
 * 
 * @route GET /offers/limited?offerNbr=20&iteration=0
 * @param {Request} req - Express request with offerNbr and iteration query params
 * @param {Response} res - Express response object
 * @returns {Array} Paginated subset of offers for the requested page
 */
const getLimitedOfferForResilinkCustom = async (req, res) => { 
  try {
    const federated = req.query.federated === 'true';
    const response = await OfferService.getLimitedOfferForResilinkCustom(req.query.offerNbr, req.query.iteration, req.user, federated);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getLimitedOfferForResilinkCustom",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves blocked offers for the authenticated user from the local server only.
 * Query param ?includeAssets=true includes associated assets in the response.
 * 
 * @route GET /offers/owner/blockedOffer/local
 * @param {Request} req - Express request (user from auth middleware)
 * @param {Response} res - Express response object
 * @returns {Object} { [serverUrl]: { offers: [], assets?: {} } }
 */
const getLocalBlockedOffers = async (req, res) => { 
  try {
    const includeAssets = req.query.includeAssets === 'true';
    const response = await OfferService.getLocalBlockedOffersCustom(includeAssets, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getLocalBlockedOffers",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves blocked offers for the authenticated user from local + favorite external servers.
 * Query param ?includeAssets=true includes associated assets in the response.
 * 
 * @route GET /offers/owner/blockedOffer/federated
 * @param {Request} req - Express request (user from auth middleware)
 * @param {Response} res - Express response object
 * @returns {Object} { [serverUrl]: { offers: [], assets?: {} }, ... }
 */
const getFederatedBlockedOffers = async (req, res) => { 
  try {
    const includeAssets = req.query.includeAssets === 'true';
    const response = await OfferService.getLocalBlockedOffersCustom(includeAssets, req.user, true);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getFederatedBlockedOffers",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Retrieves offers by a list of IDs with optional assets.
 * Used by external RESILINK servers for federated blocked offers retrieval.
 * Body: { offerIds: [1, 2, 3], includeAssets: true }
 * 
 * @route POST /offers/byIds
 * @param {Request} req - Express request with body { offerIds, includeAssets }
 * @param {Response} res - Express response object
 * @returns {Object} { [serverUrl]: { offers: [], assets?: {} } }
 */
const getOffersByIds = async (req, res) => { 
  try {
    const { offerIds, includeAssets } = req.body;
    const response = await OfferService.getOffersByIdsCustom(offerIds, includeAssets === true, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getOffersByIds",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Retrieves filtered offers from local server only (no federation).
 * Applies user filter criteria to offers from the current RESILINK instance.
 * Public endpoint - works with or without authentication.
 * 
 * @route POST /offers/local/all/filtered
 * @param {Request} req - Express request with filter criteria in body
 * @param {Response} res - Express response object
 * @returns {Object} { [serverUrl]: { offers: [], assets: {} } }
 */
const getLocalOffersFiltered = async (req, res) => {
  try {
    const response = await OfferService.getLocalOffersFilteredCustom(req.body, req.user, false, req.fromServer ?? false);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getLocalOffersFiltered",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Retrieves filtered offers from local server + user's favorite external servers.
 * Sends the same filter to each favorite server's filtered endpoint for server-side filtering.
 * Requires authentication to access federation functionality.
 * 
 * @route POST /offers/federated/all/filtered
 * @param {Request} req - Express request with filter criteria in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} { [serverUrl]: { offers: [], assets: {} }, ... }
 */
const getFederatedOffersFiltered = async (req, res) => {
  try {
    const response = await OfferService.getLocalOffersFilteredCustom(req.body, req.user, true);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getFederatedOffersFiltered",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all offers created by the authenticated user.
 * Prosumers manage their active listings and monitor trading activity.
 * Used for "My Offers" dashboard view.
 * 
 * @route GET /offers/owner
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} All offers owned by the authenticated user
 */
const getOfferOwner = async (req, res) => {
  try {
    const response = await OfferService.getAllOfferOwnerCustom(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getOfferOwner",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Creates a new offer in the marketplace.
 * Authenticated prosumers list resources for sale/rental with pricing and terms.
 * Validates offer data and links to existing assets.
 * 
 * @route POST /offers
 * @param {Request} req - Express request with offer data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created offer with generated ID and status
 */
const createOffer = async (req, res) => {
  try {
    const response = await OfferService.createOffer(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Catched error", {
      from: "createOffer",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Creates an offer with simultaneous asset creation.
 * Streamlined workflow for users listing new resources.
 * Creates asset first, then links it to the new offer automatically.
 * 
 * @route POST /offers/asset
 * @param {Request} req - Express request with combined offer+asset data in body
 * @param {Response} res - Express response object
 * @returns {Object} Created offer with embedded asset information
 */
const createOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.createOfferAsset(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Catched error", {
      from: "createOfferAsset",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

/**
 * HTTP GET - Retrieves all offers in the platform.
 * Basic endpoint without enrichment or federation.
 * 
 * @route GET /offers
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Raw list of all platform offers
 */
const getAllOffer = async (req, res) => {
  try {
    const response = await OfferService.getAllOffer(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getAllOffer",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

/**
 * HTTP GET - Retrieves purchase-type offers from a specific owner.
 * Used for viewing a seller's purchased (under contract) items .
 * 
 * @route GET /offers/owner/:id/purchase
 * @param {Request} req - Express request with owner ID in params
 * @param {Response} res - Express response object
 * @returns {Array} Purchase offers from the specified owner
 */
const getOwnerOfferPurchase = async (req, res) => {
  try {
    const response = await OfferService.getOwnerOfferPurchase(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getOwnerOfferPurchase",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

/**
 * HTTP GET - Retrieves detailed information for a specific offer.
 * Returns complete offer data including asset details, owner info, and availability.
 * Used for offer detail pages and transaction initiation.
 * 
 * @route GET /offers/:id
 * @param {Request} req - Express request with offer ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed offer information or 404 if not found
 */
const getOneOffer = async (req, res) => {
  try {
    const response = await OfferService.getOneOffer(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "getOneOffer",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    if (error instanceof getDBError) {
      res.status(404).send({message: error.message})
    } else {
      res.status(500).send({message: error.message})
    }
  }
}

/**
 * HTTP PUT - Updates an existing offer.
 * Only admin or offer owner can modify. Updates pricing, availability, description.
 * Active contracts prevent certain modifications.
 * 
 * @route PUT /offers/:id
 * @param {Request} req - Express request with offer ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated offer or error if unauthorized
 */
const putOffer = async (req, res) => {
  try {
    const response = await OfferService.putOffer(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Catched error", {
      from: "putOffer",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

/**
 * HTTP DELETE - Permanently removes an offer from the marketplace.
 * Only admin or offer owner can delete. Prevents deletion if active contracts exist.
 * Clears offer from all user feeds and recommendations.
 * 
 * @route DELETE /offers/:id
 * @param {Request} req - Express request with offer ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if in use
 */
const deleteOffer = async (req, res) => {
  try {
    const response = await OfferService.deleteOffer(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Catched error", {
      from: "deleteOffer",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

/**
 * HTTP PUT - Updates the asset associated with an offer.
 * Modifies linked asset details without recreating the offer.
 * Used when asset information changes (specs, images, condition).
 * 
 * @route PUT /offers/:id/asset
 * @param {Request} req - Express request with offer ID in params and asset data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated offer with modified asset information
 */
const putOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.putOfferAsset(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Catched error", {
      from: "putOfferAsset",
      data: error,
      username: req.user?.username ?? "no user context"
    });
    res.status(500).send({ message: error.message });
  }
}

module.exports = {
    getLocalOffersOnly,
    getFederatedOffers,
    getLimitedOfferForResilinkCustom,
    getSuggestedOfferForResilinkCustom,
    getLocalBlockedOffers,
    getFederatedBlockedOffers,
    getOffersByIds,
    getLocalOffersFiltered,
    getFederatedOffersFiltered,
    getOfferOwner,
    getOwnerOfferPurchase,
    createOfferAsset,
    createOffer,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}