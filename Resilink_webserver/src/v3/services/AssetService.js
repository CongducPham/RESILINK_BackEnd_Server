require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');
const fs = require('fs');
const path = require('path');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const Utils = require("./Utils.js");
const AssetDB = require("../database/AssetDB.js");

const pathODEPAsset = config.PATH_ODEP_ASSET;

/**
 * Retrieves all assets owned by the authenticated user from ODEP.
 * Essential for prosumers to manage their asset portfolio on the platform.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with user's owned assets
 */
const getOwnerAsset = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "owner", 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOwnerAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving assets owner', { from: 'getOwnerAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving assets owner & image for each assets', { from: 'getOwnerAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token" });
  }
  return [data, response.status];
};

/**
 * Retrieves all assets owned by the authenticated user from both ODEP and RESILINK.
 * Enriches ODEP asset data with RESILINK-specific metadata (images, unit, etc.).
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with enriched owned assets
 */
const getOwnerAssetCustom = async (url, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + "owner", 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOwnerAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving assets owner', { from: 'getOwnerAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  };
  const dataFinal = await AssetDB.getAndCompleteAssetByAssets(data);
  getDataLogger.info('success retrieving assets owner & image for each assets', { from: 'getOwnerAssetCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token" });
  return [dataFinal, response.status];
};
 
/**
 * Retrieves all assets registered in ODEP.
 * Used for admin dashboards and global asset browsing functionality.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with all ODEP assets
 */
const getAllAsset = async (url, token) => {
  const response = await Utils.fetchJSONData(
    'GET',
    url + "all", 
    headers = {'accept': 'application/json',
    'Authorization': token}
  )
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all assets', { from: 'getAllAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving all assets', { from: 'getAllAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token" });
  };
  return [data, response.status];
};

/**
 * Retrieves all assets from both ODEP and RESILINK with enriched metadata.
 * Combines ODEP asset data with RESILINK-specific information (images, unit).
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with fully enriched assets
 */
const getAllAssetCustom = async (url, token) => {
  const response = await Utils.fetchJSONData(
    'GET',
    url + "all", 
    headers = {'accept': 'application/json',
    'Authorization': token}
  )
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getAllAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving all assets', { from: 'getAllAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  };
  const dataFinal = await AssetDB.getAndCompleteAssetByAssets(data);
  getDataLogger.info('success retrieving all assets & image for each assets', { from: 'getAllAssetCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token" });
  return [dataFinal, response.status];
};

/**
 * Retrieves all assets from ODEP and RESILINK in a key-value map format.
 * Same as getAllAssetCustom but returns a map (id -> asset) for efficient lookup during offer processing.
 * No URL parameter since this function is called internally by other service files.
 *
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [assetMap{}, statusCode] where keys are asset IDs
 */
const getAllAssetResilink = async (token) => {
    const allAsset = await Utils.fetchJSONData(
        'GET',
        pathODEPAsset + "all", 
        headers = {'accept': 'application/json',
        'Authorization': token});
    var assetMapResilink = {};
    const data = await Utils.streamToJSON(allAsset.body);
    if (allAsset.status == 401) {
      getDataLogger.error('error: Unauthorize', { from: 'getAllAssetResilink', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [data, allAsset.status];
    } else if(allAsset.status != 200) {
      getDataLogger.error('error retrieving all assets', { from: 'getAllAssetResilink', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [data, allAsset.status];
    } 
    const dataFinal = await AssetDB.getAndCompleteAssetByAssets(data);
    for (const key in dataFinal) {
        if (dataFinal.hasOwnProperty(key)) {
          const element = dataFinal[key];
          assetMapResilink[element['id']] = element;
        }
    }
    getDataLogger.info('success retrieving all assets', { from: 'getAllAssetResilink', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [assetMapResilink, allAsset.status];
};

/**
 * Retrieves detailed information for a specific asset from ODEP.
 * Used for asset detail pages and offer creation workflows.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} id - Unique asset identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [asset, statusCode] tuple
 */
const getOneAsset = async (url, id, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving one asset', { from: 'getOneAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    getDataLogger.info('success retrieving one asset', { from: 'getOneAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

/**
 * Retrieves a specific asset from ODEP and completes it with RESILINK metadata.
 * Used when the full enriched asset data (images, unit) is needed for display.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} id - Unique asset identifier
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [enrichedAsset, statusCode] tuple
 */
const getOneAssetCustom = async (url, id, token) => {
  const response = await Utils.fetchJSONData(
      'GET',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'getOneAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    getDataLogger.error('error retrieving one asset', { from: 'getOneAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  };
  await AssetDB.getAndCompleteOneAssetByAsset(data);
  getDataLogger.info('success retrieving one asset', { from: 'getOneAssetCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  return [data, response.status];
};

/**
 * Retrieves the stored image data for a specific asset from RESILINK database.
 * Used to serve asset images to the frontend without relying on ODEP.
 *
 * @param {string} assetId - Unique asset identifier
 * @param {string} token - Bearer JWT authorization token (required, validates access)
 * @returns {Promise<Array>} - [{img: data}, statusCode] tuple with Base64 image data
 */
const getOneAssetImg = async (assetId, token) => {
  try {
    if (token == null ) {
      getDataLogger.error('error: Unauthorize', { from: 'getOneAssetImg', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{message: 'Token is not given'}, 401];
    } else {
      const data = await AssetDB.getOneAssetImageById(assetId);
      getDataLogger.info('success retrieving one image from an asset', { from: 'getOneAssetImg', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{img: data}, 200];
    }
  } catch(e) {
    getDataLogger.error('error retrieving one image from an asset', { from: 'getOneAssetImg', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    throw(e);
  }
};

/**
 * Creates a new asset in ODEP.
 * Assets represent physical or digital goods that prosumers can offer for sale or rent.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {Object} body - Asset creation payload (name, description, assetType, etc.)
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdAsset, statusCode] tuple
 */
const createAsset = async (url, body, token) => {
  updateDataODEP.warn('data to send to ODEP', { from: 'createAsset', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
    'POST',
    url, 
    headers = {'accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': token},
    body
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'createAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    updateDataODEP.error('error creating one asset', { from: 'createAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success creating one asset', { from: 'createAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  };
  return [data, response.status];
};

/**
 * Creates a new asset in both ODEP and RESILINK.
 * Validates image count and Base64 encoding, then stores the asset and saves images to disk.
 * Automatically registers image URLs and unit metadata in the RESILINK database.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {Object} body - Asset creation payload including images[] (Base64) and unit fields
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [createdAsset, statusCode] tuple
 */
const createAssetCustom = async (url, body, token) => {

  const username = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));

  if (body['images'].length > 2) {
    updateDataODEP.error('error creating one asset, contains more than 2 images', {from: 'createAssetCustom', dataReceived: data, username: username ?? "no user associated with the token"});
    return [{message: "images contains more than 2 elements"}, (500)];
  } else if (!Utils.areAllBase64(body['images'])) {
    updateDataODEP.error('error creating one asset, images list do not contains only base64 string', {from: 'createAssetCustom', dataReceived: data, username: username ?? "no user associated with the token"});
    return [{message: "images list do not contains only base64 string"}, (500)];
  }

  const imgBase64 = body['images'];
  const unit = body['unit'];
  delete body['images'];
  delete body['unit'];

  updateDataODEP.warn('data to send to ODEP', { from: 'createAssetCustom', dataToSend: body, username: username ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
    'POST',
    url,
    headers = {'accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': token},
    body
  );

  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', {from: 'createAssetCustom', dataReceived: data, username: username ?? "no user associated with the token"});
  } else if (response.status != 200) {
    updateDataODEP.error('error creating one asset', {from: 'createAssetCustom', dataReceived: data, username: username ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success creating one asset', {from: 'createAssetCustom', username: username ?? "no user associated with the token"});

    //Register images in server
    const img = await postImages({'assetId': data['assetId'].toString(), 'images': imgBase64}, token);

    //Register link to images in mongoDB
    await AssetDB.newAsset(data['assetId'], img[0]['images'], username, unit);
  };
  return [data, response.status];
};

/**
 * Updates an existing asset by its ID in ODEP.
 * Used when only ODEP data needs to be updated without touching RESILINK metadata.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {Object} body - Updated asset fields (partial or complete)
 * @param {string} id - Asset identifier to update
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updateResponse, statusCode] tuple
 */
const putAsset = async (url, body, id, token) => {
  updateDataODEP.warn('data to send to ODEP', { from: 'putAsset', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'PUT',
      url + id, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'putAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    updateDataODEP.error('error updating one asset', { from: 'putAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success updating one asset', { from: 'putAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

/**
 * Updates an existing asset by its ID in both ODEP and RESILINK.
 * Handles image replacement and unit metadata update in the RESILINK database.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {Object} body - Updated asset fields including images[] (Base64) and unit
 * @param {string} id - Asset identifier to update
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [updateResponse, statusCode] tuple
 */
const putAssetCustom = async (url, body, id, token) => {
  const imgBase64 = body['images'];
  const unit = body['unit'];
  delete body['images'];
  delete body['unit'];
  
  updateDataODEP.warn('data to send to ODEP', { from: 'putAssetCustom', dataToSend: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  const response = await Utils.fetchJSONData(
      'PUT',
      url + id, 
      headers = {'accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': token},
      body
  );

  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'putAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    updateDataODEP.error('error updating one asset', { from: 'putAssetCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    updateDataODEP.info('success updating one asset', { from: 'putAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});

    //Register images in server
    const img = await postImages({'assetId': id.toString(), 'images': imgBase64}, token);
    await AssetDB.updateAssetById(id, img[0]['images'], data, unit);
  }
  return [data, response.status];
};

/**
 * Permanently deletes an asset by its ID from ODEP only.
 * Use deleteAssetCustom to also remove the asset from RESILINK and its associated images.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} id - Asset identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteResponse, statusCode] tuple
 */
const deleteAsset = async (url, id, token) => {
  try {
    const response = await Utils.fetchJSONData(
      'DELETE',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'deleteAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    deleteDataODEP.error('error deleting one asset', { from: 'deleteAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    deleteDataODEP.info('success deleting one asset', { from: 'deleteAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
  } catch (e) {
    throw(e)
  }
};

/**
 * Permanently deletes an asset by its ID from both ODEP and RESILINK.
 * Cascade deletion removes all associated image files from disk storage.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {string} id - Asset identifier to delete
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [deleteResponse, statusCode] tuple
 */
const deleteAssetCustom = async (url, id, token) => {
  try {
    const response = await Utils.fetchJSONData(
      'DELETE',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
  );
  const data = await Utils.streamToJSON(response.body)
  if (response.status == 401) {
    getDataLogger.error('error: Unauthorize', { from: 'deleteAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else if(response.status != 200) {
    deleteDataODEP.error('error deleting one asset', { from: 'deleteAssetCustom', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    deleteDataODEP.info('success deleting one asset', { from: 'deleteAssetCustom', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    await AssetDB.deleteAssetById(id);
    await deleteImages(id, token);
  }
  return [data, response.status];
  } catch (e) {
    throw(e)
  }

};

/**
 * Applies a partial update (PATCH) to an asset in ODEP.
 * Typically used to update specific fields such as regulatedId without replacing the full asset.
 *
 * @param {string} url - Base ODEP API URL for asset endpoints
 * @param {Object} body - Partial update payload
 * @param {string} id - Asset identifier to patch
 * @param {string} token - Bearer JWT authorization token
 * @returns {Promise<Array>} - [patchResponse, statusCode] tuple
 */
const patchAsset = async (url, body, id, token) => {
  const response = await Utils.fetchJSONData(
      'PATCH',
      url + id, 
      headers = {'accept': 'application/json',
      'Authorization': token},
      body
  );
  const data = await Utils.streamToJSON(response.body);
  if (response.status == 401) {
    patchDataODEP.error('error: Unauthorize', { from: 'patchAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [data, response.status];
  } else if(response.status != 200) {
    patchDataODEP.error('error patching one asset', { from: 'patchAsset', dataReceived: data, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  } else {
    patchDataODEP.info('success patching one asset', { from: 'patchAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
  }
  return [data, response.status];
};

/**
 * Attaches or replaces images for an existing asset.
 * Validates ownership against ODEP, checks Base64 encoding, then saves images to disk.
 *
 * @param {Object} body - Payload containing assetId and images[] array (Base64 strings)
 * @param {string} token - Bearer JWT authorization token (used for ownership validation)
 * @returns {Promise<Array>} - [imageData, statusCode] with URLs to saved images
 */
const postImagesAsset = async (body, token) => {

  const asset = await getOneAsset(pathODEPAsset, body['assetId'], token);
  if (asset[1] == 401) {
    updateDataODEP.error('error: Unauthorize', { from: 'postImgAsset', dataReceived: newsAsset[0], username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [asset[0], asset[1]];
  } else if(asset[1] != 200) {
    updateDataODEP.error('error updating one asset', { from: 'postImgAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [asset[0], asset[1]];
  } else if (body['owner'] != asset[0]['owner']) {
    updateDataODEP.error('the user is not the owner of the asset', { from: 'postImgAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [{'message': 'the user is not the owner of the asset'}, asset[1]];
  }
  // Check body.images: it must exist and be a list (array)
  if (!body.images || !Array.isArray(body.images)) {
    updateDataODEP.error('error posting one asset', { from: 'postImgAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [{ 'message': 'images must be a list' }, 500];
  } else if (!Utils.areAllBase64(body['images'])) {
    updateDataODEP.error('error posting one asset, images list do not contains only base64 string', {from: 'postImgAsset', dataReceived: body, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [{message: "images list do not contains only base64 string"}, (500)];
  }

  const imgData = await postImages({'assetId': body['assetId'], 'images': body['images']}, token);
  if(imgData[1] != 200) {
    updateDataODEP.error('error posting images', { from: 'postImgAsset', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [imgData[0], imgData[1]];
  }
  return [imgData[0], imgData[1]];
};

/**
 * Converts Base64-encoded images to PNG files and saves them to disk.
 * Creates asset-specific directory structure under Resilink_webserver/public/images/{assetId}/.
 * Replaces existing images to ensure consistency (no orphaned files).
 * Returns publicly accessible URLs for frontend consumption.
 *
 * @param {Object} body - Object containing assetId and images[] array (Base64 strings)
 * @param {string} token - Bearer JWT authorization token (used for logging)
 * @returns {Promise<Array>} - [{assetId, images[]}, statusCode] with public image URLs
 */
const postImages = async (body, token) => {
  const baseDir = 'Resilink_webserver/public/images';
  const assetDir = path.join(baseDir, body.assetId);
  const savedImages = [];

  try {

    if (fs.existsSync(assetDir)) {
      fs.readdirSync(assetDir).forEach(file => {
        const filePath = path.join(assetDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    } else {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    for (let i = 0; i < body.images.length; i++) {
      const base64Image = body.images[i];
      const fileName = `image${i + 1}.png`;
      const filePath = path.join(assetDir, fileName);
      const imageBuffer = Buffer.from(base64Image, 'base64');

      fs.writeFileSync(filePath, imageBuffer);
      savedImages.push(config.SWAGGER_URL + '/' + filePath);
    }

    updateDataODEP.info('success posting images of asset', {from: 'postImages', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});

    return [{ assetId: body.assetId, images: savedImages }, 200];
  } catch (err) {
    updateDataODEP.error('error posting images of asset', {
      from: 'postImages',
      username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token",
    });
    throw err
  }
};

/**
 * Physically removes the entire image directory for a specified asset.
 * Called during asset deletion or when the owner explicitly removes all asset images.
 *
 * @param {string} assetId - Asset identifier whose images should be deleted
 * @param {string} token - Bearer JWT authorization token (used for logging)
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteImages = async (assetId, token) => {
  const baseDir = 'Resilink_webserver/public/images';
  const assetDir = path.join(baseDir, assetId);

  try {
    if (fs.existsSync(assetDir)) {
      fs.rmSync(assetDir, { recursive: true, force: true });
      updateDataODEP.info('success deleting images of asset', {from: 'deleteImages', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{ message: `Images associated with assetId ${assetId} have been deleted.` }, 200];
    } else {
      updateDataODEP.error('images directory does not exist', {from: 'deleteImages', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
      return [{ message: `The images for assetId ${assetId} do not exist.` }, 404];
    }
  } catch (err) {
    updateDataODEP.error('error deleting images of asset', {from: 'deleteImages', username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
    return [{ message: `Error deleting images for assetId ${assetId}.`, error: err.message }, 500];
  }
};

module.exports = {
    getAllAssetResilink,
    getAllAsset,
    getAllAssetCustom,
    getOneAssetImg,
    getOneAsset,
    getOneAssetCustom,
    getOwnerAsset,
    getOwnerAssetCustom,
    createAsset,
    createAssetCustom,
    putAsset,
    putAssetCustom,
    patchAsset,
    deleteAsset,
    deleteAssetCustom,
    postImagesAsset
}