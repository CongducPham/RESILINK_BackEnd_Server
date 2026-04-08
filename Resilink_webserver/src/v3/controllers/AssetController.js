require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const assetService = require("../services/AssetService.js");
const _pathAssetODEP = config.PATH_ODEP_ASSET; 

/**
 * Retrieves all assets enriched with RESILINK-specific data (images, units).
 * Express handler delegating to assetService.getAllAssetResilink.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the mapped asset list or a 500 error
 */
const getAllAssetMapped = async (req, res) => { 
  try {
    const response = await assetService.getAllAssetResilink(req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllAssetMapped', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Creates a new asset in ODEP.
 * Express handler delegating to assetService.createAsset.
 *
 * @param {Object} req - Express request object (body: asset payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created asset or a 500 error
 */
const createAsset = async (req, res) => { 
  try {
      const response = await assetService.createAsset(_pathAssetODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Creates a new asset in ODEP and stores the associated RESILINK custom fields.
 * Express handler delegating to assetService.createAssetCustom.
 *
 * @param {Object} req - Express request object (body: asset payload with custom fields, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created asset or a 500 error
 */
const createAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.createAssetCustom(_pathAssetODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createAssetCustom', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all assets owned by the authenticated user from ODEP.
 * Express handler delegating to assetService.getOwnerAsset.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the owner's asset list or a 500 error
 */
const getOwnerAsset = async (req, res) => { 
  try {
      const response = await assetService.getOwnerAsset(_pathAssetODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOwnerAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all assets owned by the authenticated user, enriched with RESILINK custom data.
 * Express handler delegating to assetService.getOwnerAssetCustom.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched owner asset list or a 500 error
 */
const getOwnerAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.getOwnerAssetCustom(_pathAssetODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOwnerAssetCustom', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all assets from ODEP.
 * Express handler delegating to assetService.getAllAsset.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the full asset list or a 500 error
 */
const getAllAsset = async (req, res) => { 
  try {
      const response = await assetService.getAllAsset(_pathAssetODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : 'token not found'});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves all assets from ODEP enriched with RESILINK custom data.
 * Express handler delegating to assetService.getAllAssetCustom.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched asset list or a 500 error
 */
const getAllAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.getAllAssetCustom(_pathAssetODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllAssetCustom', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : 'token not found'});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves a single asset by its ID from ODEP.
 * Express handler delegating to assetService.getOneAsset.
 *
 * @param {Object} req - Express request object (params.id: asset ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the asset data or a 500 error
 */
const getOneAsset = async (req, res) => { 
  try {
      const response = await assetService.getOneAsset(_pathAssetODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves a single asset by its ID from ODEP, enriched with RESILINK custom data.
 * Express handler delegating to assetService.getOneAssetCustom.
 *
 * @param {Object} req - Express request object (params.id: asset ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the enriched asset data or a 500 error
 */
const getOneAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.getOneAssetCustom(_pathAssetODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Retrieves the images of an asset by its ID from the RESILINK local database.
 * Express handler delegating to assetService.getOneAssetImg.
 *
 * @param {Object} req - Express request object (params.id: asset ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the asset images or a 500 error
 */
const getOneAssetIdimage = async (req, res) => { 
  try {
      const response = await assetService.getOneAssetImg(req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneAssetIdimage', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});    
    }
};

/**
 * Updates an asset by its ID in ODEP.
 * Express handler delegating to assetService.putAsset.
 *
 * @param {Object} req - Express request object (params.id: asset ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated asset or a 500 error
 */
const putAsset = async (req, res) => { 
  try {
      const response = await assetService.putAsset(_pathAssetODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'putAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Updates an asset in ODEP and its RESILINK custom data by ID.
 * Express handler delegating to assetService.putAssetCustom.
 *
 * @param {Object} req - Express request object (params.id: asset ID, body: update payload with custom fields, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated asset or a 500 error
 */
const putAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.putAssetCustom(_pathAssetODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'putAssetCustom', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Deletes an asset by its ID from ODEP.
 * Express handler delegating to assetService.deleteAsset.
 *
 * @param {Object} req - Express request object (params.id: asset ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteAsset = async (req, res) => { 
  try {
      const response = await assetService.deleteAsset(_pathAssetODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Catched error', { from: 'deleteAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Deletes an asset from ODEP and its associated RESILINK local data by ID.
 * Express handler delegating to assetService.deleteAssetCustom.
 *
 * @param {Object} req - Express request object (params.id: asset ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteAssetCustom = async (req, res) => { 
  try {
      const response = await assetService.deleteAssetCustom(_pathAssetODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Catched error', { from: 'deleteAssetCustom', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Partially updates an asset by its ID in ODEP.
 * Express handler delegating to assetService.patchAsset.
 *
 * @param {Object} req - Express request object (params.id: asset ID, body: partial update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the patched asset or a 500 error
 */
const patchAsset = async (req, res) => { 
  try {
      const response = await assetService.patchAsset(_pathAssetODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'putAsset', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

/**
 * Uploads and stores images for an asset in the RESILINK local database.
 * Express handler delegating to assetService.postImagesAsset.
 *
 * @param {Object} req - Express request object (body: asset images payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the upload result or a 500 error
 */
const postImagesAsset = async (req, res) => {
  try {
    const response = await assetService.postImagesAsset(req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'postImg', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

module.exports = {
  getAllAssetMapped,
  createAsset,
  createAssetCustom,
  getAllAsset,
  getAllAssetCustom,
  getOneAsset,
  getOneAssetCustom,
  getOneAssetIdimage,
  getOwnerAsset,
  getOwnerAssetCustom,
  putAsset,
  putAssetCustom,
  deleteAsset,
  deleteAssetCustom,
  patchAsset,
  postImagesAsset
}