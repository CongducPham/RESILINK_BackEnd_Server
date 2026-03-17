require("../loggers.js");
const winston = require("winston");

const getDataLogger = winston.loggers.get("GetDataLogger");
const updateDataODEP = winston.loggers.get("UpdateDataODEPLogger");
const deleteDataODEP = winston.loggers.get("DeleteDataODEPLogger");

const assettypeService = require("../services/AssetTypeService.js");

/**
 * HTTP POST - Creates a new asset type category in the RESILINK platform.
 * Admin users define new categories (e.g., Solar Panels, Batteries, Vehicles)
 * to classify marketplace assets for better filtering and recommendations.
 * 
 * @route POST /assettypes
 * @param {Request} req - Express request with asset type data in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created asset type with generated ID
 */
const createAssetTypes = async (req, res) => {
  try {
    const response =
      await assettypeService.createAssetTypes(req.body, req.user);

    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Error accessing ODEP", {
      from: "createAssetTypes",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all asset type categories as an array.
 * Used by frontend for dropdown menus, filters, and category browsing.
 * Returns complete list of available asset classifications.
 * 
 * @route GET /assettypes
 * @param {Request} req - Express request with optional authentication
 * @param {Response} res - Express response object
 * @returns {Array} List of all asset type categories
 */
const getAllAssetTypes = async (req, res) => {
  try {
    const response =
      await assettypeService.getAllAssetTypes(req.user);

    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Error accessing ODEP", {
      from: "getAllAssetTypes",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves details for a specific asset type.
 * Returns complete information about a category including name, description,
 * and associated metadata for frontend display.
 * 
 * @route GET /assettypes/:id
 * @param {Request} req - Express request with asset type ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed asset type information
 */
const getOneAssetTypes = async (req, res) => {
  try {
    const response =
      await assettypeService.getOneAssetTypes(
        req.params.id,
        req.user
      );

    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Error accessing ODEP", {
      from: "getOneAssetTypes",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates an existing asset type category.
 * Admin-only operation to modify category details, fix naming issues,
 * or add descriptions. Affects all assets under this category.
 * 
 * @route PUT /assettypes/:id
 * @param {Request} req - Express request with type ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Success message or error if unauthorized
 */
const putAssetTypes = async (req, res) => {
  try {
    const response =
      await assettypeService.putAssetTypes(
        req.body,
        req.params.id,
        req.user
      );

    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error("Error accessing ODEP", {
      from: "putAssetTypes",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes an asset type category from the platform.
 * Admin-only operation. Prevents deletion if assets are still using this type.
 * Maintains referential integrity with asset collections.
 * 
 * @route DELETE /assettypes/:id
 * @param {Request} req - Express request with asset type ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Success message or error if in use or unauthorized
 */
const deleteAssetTypes = async (req, res) => {
  try {
    const response =
      await assettypeService.deleteAssetTypes(
        req.params.id,
        req.user
      );

    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error("Error accessing ODEP", {
      from: "deleteAssetTypes",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all asset types in key-value map format.
 * Optimized for RESILINK operations requiring fast ID-based lookups.
 * Used by recommendation engine and offer filtering algorithms.
 * 
 * @route GET /assettypes/mapped
 * @param {Request} req - Express request with optional authentication
 * @param {Response} res - Express response object
 * @returns {Object} Map of asset types {typeId: typeData}
 */
const getAllAssetTypesResilink = async (req, res) => {
  try {
    const response =
      await assettypeService.getAllAssetTypesResilink(req.user);

    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error("Error accessing ODEP", {
      from: "getAllAssetTypesResilink",
      error: error.message,
      username: req.user?.username ?? "no user context"
    });

    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createAssetTypes,
  getAllAssetTypes,
  getOneAssetTypes,
  putAssetTypes,
  deleteAssetTypes,
  getAllAssetTypesResilink
};
