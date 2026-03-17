require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataResilinkLogger');

const Utils = require("./Utils.js");
const User = require("./UserService.js");
const AssetTypeDB = require("../database/AssetTypeDB.js");
const RecommendationStatsDB = require("../database/RecommendationStatsDB.js");
const UserDB = require("../database/UserDB.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * Retrieves all asset types in a key-value map format optimized for RESILINK operations.
 * Map structure (name -> assetType) enables efficient type lookups during asset creation and offer filtering.
 * Asset types categorize resources (e.g., energy, equipment, services) available on the platform.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [assetTypeMap{}, statusCode] where keys are type names
 */
const getAllAssetTypesResilink = async (user) => {
  const username = user?.username ?? "no token required";

  try {
    const data = await AssetTypeDB.getAllAssetType();

    const result = {};
    for (const element of data) {
      result[element.name] = element;
    }

    getDataLogger.info('success retrieving all assetTypes', {
      from: 'getAllAssetTypesResilink',
      username
    });

    return [result, 200];
  } catch (e) {
    getDataLogger.error('error retrieving all assetTypes', {
      from: 'getAllAssetTypesResilink',
      dataReceived: e.message,
      username
    });
    throw e;
  }
};

/**
 * Creates a new asset type in the RESILINK platform.
 * Asset types define resource categories with properties like measurability, unit of measurement,
 * and specific attributes (e.g., "Solar Panel" with specifications like "wattage").
 * Also synchronizes recommendation collections by initializing the new asset type key to `0`
 * for all existing user and global recommendation stats documents.
 * 
 * @param {Object} body - Asset type definition (name, nature, unit, etc.)
 * @param {Object} user - Authenticated user creating the type
 * @returns {Promise<Array>} - [createdAssetType, statusCode] tuple
 */
const createAssetTypes = async (body, user) => {
  try {

    await AssetTypeDB.newAssetType(body);
    await RecommendationStatsDB.initializeAssetTypeForAllRecommendationStats(body.name);

    updateDataODEP.info('success creating an assetType', {
      from: 'createAssetTypes',
      username: user.username
    });

    return [body, 200];
  } catch (e) {
    updateDataODEP.error('error creating assetType', {
      from: 'createAssetTypes',
      dataReceived: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Retrieves all asset types as a list.
 * Used for displaying available asset categories in dropdowns and filter interfaces.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [assetTypes[], statusCode] tuple with complete list
 */
const getAllAssetTypes = async (user) => {
  const username = user?.username ?? "no token required";

  try {
    const data = await AssetTypeDB.getAllAssetType();

    getDataLogger.info('success accessing all assetTypes', {
      from: 'getAllAssetTypes',
      username: username
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('error accessing assetTypes', {
      from: 'getAllAssetTypes',
      dataReceived: e.message,
      username: username
    });
    throw e;
  }
};
/**
 * Retrieves a specific asset type by its unique identifier.
 * Returns detailed information including nature, unit, and measurability properties.
 * 
 * @param {string} id - Asset type identifier
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [assetType, statusCode] or 404 if not found
 */
const getOneAssetTypes = async (id, user) => {
  const username = user?.username ?? "no token required";

  try {
    const data = await AssetTypeDB.getOneAssetType(id);

    if (data === "0") {
      return [{ message: "This assetType doesn't exist" }, 404];
    }

    return [data, 200];
  } catch (e) {
    getDataLogger.error('error retrieving assetType', {
      from: 'getOneAssetTypes',
      dataReceived: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Updates an existing asset type definition.
 * Only administrators can modify asset types to maintain platform-wide consistency.
 * Changes affect all assets and offers using this type.
 * 
 * @param {Object} body - Updated asset type fields
 * @param {string} id - Asset type identifier
 * @param {Object} user - Authenticated user (must be admin)
 * @returns {Promise<Array>} - [updateMessage, statusCode] or 403 if not admin
 */
const putAssetTypes = async (body, id, user) => {
  try {
    if (user.username !== 'admin') {
      return [{ message: "not administrator" }, 403];
    }

    await AssetTypeDB.updateAssetType(id, body);

    updateDataODEP.info('success updating assetType', {
      from: 'putAssetTypes',
      username: user.username
    });

    return [{ message: "successful update" }, 200];
  } catch (e) {
    updateDataODEP.error('error updating assetType', {
      from: 'putAssetTypes',
      dataReceived: e.message,
      username: user.username
    });
    throw e;
  }
};

/**
 * Permanently deletes an asset type from the platform.
 * Only administrators can delete asset types.
 * WARNING: Deletion may affect existing assets and offers referencing this type.
 * Also synchronizes recommendation collections by removing the deleted asset type key
 * from all user and global recommendation stats documents.
 * 
 * @param {string} id - Asset type identifier
 * @param {Object} user - Authenticated user (must be admin)
 * @returns {Promise<Array>} - [deleteMessage, statusCode] or 403 if not admin
 */
const deleteAssetTypes = async (id, user) => {
  try {
    if (user.username !== 'admin') {
      return [{ message: "not administrator" }, 403];
    }
    
    await AssetTypeDB.deleteAssetType(id);
    await RecommendationStatsDB.removeAssetTypeFromAllRecommendationStats(id);

    deleteDataResilink.info('success deleting assetType', {
      from: 'deleteAssetTypes',
      username: user.username
    });

    return [{ message: "assetType deleted" }, 200];
  } catch (e) {
    deleteDataResilink.error('error deleting assetType', {
      from: 'deleteAssetTypes',
      dataReceived: e.message,
      username: user.username
    });
    throw e;
  }
};


module.exports = {
    createAssetTypes,
    getAllAssetTypesResilink,
    getAllAssetTypes,
    getOneAssetTypes,
    putAssetTypes,
    deleteAssetTypes,
}