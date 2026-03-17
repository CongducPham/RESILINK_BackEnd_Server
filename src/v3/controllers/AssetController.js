require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const assetService = require("../services/AssetService.js");

/**
 * HTTP GET - Retrieves all assets in key-value map format.
 * Returns assets optimized for RESILINK operations with efficient ID-based lookups.
 * Used by frontend for offer aggregation and asset browsing.
 * 
 * @route GET /assets/mapped
 * @param {Request} req - Express request object with optional user authentication
 * @param {Response} res - Express response object
 * @returns {Object} Map of assets {assetId: assetData}
 */
const getAllAssetMapped = async (req, res) => {
  try {
    const response = await assetService.getAllAssetResilink(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getAllAssetMapped',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Creates a new asset in the RESILINK marketplace.
 * Validates asset data, processes Base64 images, and stores metadata.
 * Authenticated prosumers can list physical/digital resources for trading.
 * 
 * @route POST /assets
 * @param {Request} req - Express request with asset data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created asset with generated ID and image URLs
 */
const createAsset = async (req, res) => {
  try {
    const response = await assetService.createAsset(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'createAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all assets owned by the authenticated user.
 * Enables prosumers to manage their asset portfolio and monitor listings.
 * 
 * @route GET /assets/owner
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} List of assets owned by the user
 */
const getOwnerAsset = async (req, res) => {
  try {
    const response = await assetService.getOwnerAsset(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOwnerAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all assets registered in the platform.
 * Public endpoint for browsing complete asset catalog.
 * 
 * @route GET /assets
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of platform assets
 */
const getAllAsset = async (req, res) => {
  try {
    const response = await assetService.getAllAsset(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getAllAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves detailed information for a specific asset.
 * Returns complete asset data including images and specifications.
 * 
 * @route GET /assets/:id
 * @param {Request} req - Express request with asset ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed asset information
 */
const getOneAsset = async (req, res) => {
  try {
    const response = await assetService.getOneAsset(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', {
      from: 'getOneAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates an existing asset.
 * Only asset owner or admin can modify. Handles image updates automatically.
 * 
 * @route PUT /assets/:id
 * @param {Request} req - Express request with asset ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Success message or error if unauthorized
 */
const putAsset = async (req, res) => {
  try {
    const response = await assetService.putAsset(req.body, req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'putAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Permanently removes an asset and its images.
 * Only asset owner or admin can delete. Cascade deletes image files from storage.
 * 
 * @route DELETE /assets/:id
 * @param {Request} req - Express request with asset ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Success message or error if unauthorized
 */
const deleteAsset = async (req, res) => {
  try {
    const response = await assetService.deleteAsset(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', {
      from: 'deleteAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Attaches or replaces images for an asset.
 * Accepts Base64-encoded images, converts to PNG, and stores in public directory.
 * Only asset owner can update images.
 * 
 * @route POST /assets/images
 * @param {Request} req - Express request with assetId and images[] in body
 * @param {Response} res - Express response object
 * @returns {Object} Public URLs of saved images
 */
const postImagesAsset = async (req, res) => {
  try {
    const response = await assetService.postImagesAsset(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'postImagesAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes all images associated with an asset.
 * Physically deletes image directory from disk storage.
 * Only asset owner or admin can delete images.
 * 
 * @route DELETE /assets/:id/images
 * @param {Request} req - Express request with asset ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Success message or error if unauthorized
 */
const deleteImagesAsset = async (req, res) => {
  try {
    const response = await assetService.deleteImages(req.params.id, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', {
      from: 'deleteImagesAsset',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  getAllAssetMapped,
  getAllAsset,
  getOneAsset,
  getOwnerAsset,
  createAsset,
  putAsset,
  deleteAsset,
  postImagesAsset,
  deleteImagesAsset
};
