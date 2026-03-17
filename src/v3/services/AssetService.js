require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');
const fs = require('fs');
const path = require('path');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require('./Utils.js');
const AssetDB = require('../database/AssetDB.js');
const OfferDB = require('../database/OfferDB.js');
const UserDB = require('../database/UserDB.js');

const pathODEPAsset = config.PATH_ODEP_ASSET;
const tokenRequired = config.TOKEN_REQUIRED;

/**
 * Retrieves all assets owned by the authenticated user.
 * Essential for prosumers to manage their asset portfolio and associated offers on the platform.
 * 
 * @param {Object} user - Authenticated user object containing username
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with user's owned assets
 */
const getOwnerAsset = async (user) => {
  try {
    const data = await AssetDB.getAllAsset();
    const assets = data.filter(asset => asset.owner === user.username);

    getDataLogger.info('success retrieving owner assets', {
      from: 'getOwnerAsset',
      username: user.username
    });

    return [assets, 200];
  } catch (e) {
    getDataLogger.error('error retrieving owner assets', {
      from: 'getOwnerAsset',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Retrieves all assets registered in the RESILINK platform.
 * Used for admin dashboards and global asset browsing functionality.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [assets[], statusCode] tuple with all platform assets
 */
const getAllAsset = async (user) => {
  try {
    const data = await AssetDB.getAllAsset();

    getDataLogger.info('success retrieving all assets', {
      from: 'getAllAsset',
      username: user?.username ?? 'anonymous'
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('error retrieving all assets', {
      from: 'getAllAsset',
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves all assets in a key-value map format optimized for RESILINK operations.
 * Map structure (id -> asset) enables efficient lookup during offer processing and matching.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [assetMap{}, statusCode] where keys are asset IDs
 */
const getAllAssetResilink = async (user) => {
  try {
    const data = await AssetDB.getAllAsset();
    const assetMap = {};

    for (const asset of data) {
      assetMap[asset.id] = asset;
    }

    getDataLogger.info('success retrieving asset map', {
      from: 'getAllAssetResilink',
      username: user?.username ?? 'anonymous'
    });

    return [assetMap, 200];
  } catch (e) {
    getDataLogger.error('error retrieving asset map', {
      from: 'getAllAssetResilink',
      error: e.message,
      username: user?.username ?? 'anonymous'
    });
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific asset.
 * Used for asset detail pages and offer creation workflows.
 * 
 * @param {string} id - Unique asset identifier
 * @param {Object} user - User object
 * @returns {Promise<Array>} - [asset, statusCode] tuple
 */
const getOneAsset = async (id, user) => {
  try {
    const data = await AssetDB.getOneAsset(id);

    getDataLogger.info('success retrieving asset', {
      from: 'getOneAsset',
      assetId: id
    });

    return [data, 200];
  } catch (e) {
    getDataLogger.error('error retrieving asset', {
      from: 'getOneAsset',
      assetId: id,
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Creates a new asset in the RESILINK platform.
 * Assets represent physical or digital goods that prosumers can offer for sale or rent.
 * Automatically processes and stores up to 2 Base64-encoded images.
 * 
 * @param {Object} body - Asset creation payload (name, description, assetType, images, etc.)
 * @param {Object} user - Authenticated user who will own the asset
 * @returns {Promise<Array>} - [createdAsset, statusCode] tuple
 */
const createAsset = async (body, user) => {
  try {
    if (body.images?.length > 2) {
      return [{ message: 'images contains more than 2 elements' }, 400];
    }

    if (body.images && !Utils.areAllBase64(body.images)) {
      return [{ message: 'images list does not contain only base64 strings' }, 400];
    }

    body.totalQuantity ??= 1;
    body.owner = user.username;

    const asset = await AssetDB.newAsset(body);

    const img = await saveImagesAsset({
      assetId: asset.id.toString(),
      images: body.images || []
    });

    await AssetDB.updateAssetImagesById(asset.id, img[0].images);
    asset.images = img[0].images;

    updateDataODEP.info('success creating asset', {
      from: 'createAsset',
      username: user.username
    });

    return [asset, 200];
  } catch (e) {
    updateDataODEP.error('error creating asset', {
      from: 'createAsset',
      error: e.message
    });
    throw e;
  }
};

/**
 * Updates an existing asset in the RESILINK platform.
 * Only the asset owner or admin can perform updates.
 * Automatically handles image updates and re-processing if provided.
 * 
 * @param {Object} body - Updated asset fields (partial or complete)
 * @param {string} id - Asset identifier to update
 * @param {Object} user - Authenticated user requesting the update
 * @returns {Promise<Array>} - [updateMessage, statusCode] tuple
 */
const putAsset = async (body, id, user) => {
  try {
    const asset = await AssetDB.getOneAsset(id);

    if (user.username !== 'admin' && asset.owner !== user.username) {
      return [{ message: 'not the owner or administrator' }, 403];
    }

    // ---- Validate totalQuantity change ----
    if (body.totalQuantity !== undefined && body.totalQuantity !== asset.totalQuantity) {
      const newTotal = body.totalQuantity;
      const allocated = (asset.totalQuantity ?? 0) - (asset.remainingQuantity ?? 0);

      if (newTotal < allocated) {
        updateDataODEP.error('new totalQuantity is less than already allocated quantity', {
          from: 'putAsset',
          newTotal,
          allocated,
          assetId: id,
          username: user.username
        });
        return [
          {
            message: `new totalQuantity (${newTotal}) cannot be less than quantity already allocated to offers (${allocated})`,
            allocatedQuantity: allocated
          },
          400
        ];
      }

      // Adjust remainingQuantity to reflect the new total
      const delta = newTotal - (asset.totalQuantity ?? 0);
      body.remainingQuantity = (asset.remainingQuantity ?? 0) + delta;
    }

    if (body.images) {
      const img = await saveImagesAsset({ assetId: id.toString(), images: body.images });
      body.images = img[0].images;
    }

    body.owner = user.username;
    await AssetDB.updateAssetById(id, body);

    updateDataODEP.info('success updating asset', {
      from: 'putAsset',
      assetId: id,
      username: user.username
    });

    return [{ message: `${id} asset correctly updated` }, 200];
  } catch (e) {
    updateDataODEP.error('error updating asset', {
      from: 'putAsset',
      error: e.message
    });
    throw e;
  }
};

/**
 * Permanently deletes an asset and its associated images from the platform.
 * Only the asset owner or admin can perform deletion.
 * Cascade deletion removes all associated image files from disk storage.
 * 
 * @param {string} id - Asset identifier to delete
 * @param {Object} user - Authenticated user requesting deletion
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteAsset = async (id, user) => {
  try {
    const asset = await AssetDB.getOneAsset(id);

    if (user.username !== 'admin' && asset.owner !== user.username) {
      return [{ message: 'not the owner or administrator' }, 403];
    }

    // ---- Check for active offers referencing this asset ----
    const linkedOffers = await OfferDB.getOffersByAssetId(id);
    if (linkedOffers.length > 0) {
      const offerIds = linkedOffers.map(o => o.id);
      deleteDataResilink.error('cannot delete asset with active offers', {
        from: 'deleteAsset',
        assetId: id,
        linkedOfferIds: offerIds,
        username: user.username
      });
      return [
        {
          message: `cannot delete asset ${id}: ${linkedOffers.length} active offer(s) still reference it`,
          linkedOfferIds: offerIds
        },
        409
      ];
    }

    await AssetDB.deleteAssetById(id);
    await deleteImagesAsset(id, true);

    deleteDataResilink.info('success deleting asset', {
      from: 'deleteAsset',
      assetId: id,
      username: user.username
    });

    return [{ message: `${id} asset correctly removed` }, 200];
  } catch (e) {
    deleteDataResilink.error('error deleting asset', {
      from: 'deleteAsset',
      error: e.message
    });
    throw e;
  }
};

/**
 * Attaches or replaces images for an existing asset.
 * Only the asset owner can update images. Validates all images are Base64 encoded.
 * Previous images are automatically replaced to maintain consistency.
 * 
 * @param {Object} body - Payload containing assetId and images[] array
 * @param {Object} user - Authenticated user (must be asset owner)
 * @returns {Promise<Array>} - [imageData, statusCode] with URLs to saved images
 */
const postImagesAsset = async (body, user) => {
  try {
    const asset = await AssetDB.getOneAsset(body.assetId);

    if (asset.owner !== user.username) {
      return [{ message: 'the user is not the owner of the asset' }, 403];
    }

    if (!Array.isArray(body.images) || !Utils.areAllBase64(body.images)) {
      return [{ message: 'invalid images payload' }, 400];
    }

    const imgData = await saveImagesAsset(body);

    updateDataODEP.info('success posting images', {
      from: 'postImagesAsset',
      assetId: body.assetId,
      username: user.username
    });

    return imgData;
  } catch (e) {
    updateDataODEP.error('error posting images', {
      from: 'postImagesAsset',
      error: e.message
    });
    throw e;
  }
};

/**
 * Deletes all image files associated with an asset at the business logic level.
 * Only the asset owner or admin can delete images.
 * Physically removes image files from disk storage.
 * 
 * @param {string} assetId - Asset identifier
 * @param {Object} user - Authenticated user requesting deletion
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteImages = async (assetId, user) => {
  try {
    const asset = await AssetDB.getOneAsset(assetId);

    if (asset.owner !== user.username && user.username !== 'admin') {
      return [{ message: 'not the owner or administrator' }, 403];
    }

    const data = await deleteImagesAsset(assetId, true);

    updateDataODEP.info('success deleting images', {
      from: 'deleteImages',
      assetId,
      username: user.username
    });

    return data;
  } catch (e) {
    updateDataODEP.error('error deleting images', {
      from: 'deleteImages',
      error: e.message
    });
    throw e;
  }
};

/**
 * Converts Base64-encoded images to PNG files and saves them to disk.
 * Creates asset-specific directory structure under public/images/{assetId}/.
 * Replaces existing images to ensure consistency (no orphaned files).
 * Returns publicly accessible URLs for frontend consumption.
 * 
 * @param {Object} body - Object containing assetId and images[] array (Base64 strings)
 * @returns {Promise<Array>} - [result{assetId, images[]}, statusCode] with public image URLs
 */
const saveImagesAsset = async (body) => {
  const baseDir = 'public/images';
  const assetDir = path.join(baseDir, body.assetId);

  fs.mkdirSync(assetDir, { recursive: true });
  fs.readdirSync(assetDir).forEach(file =>
    fs.unlinkSync(path.join(assetDir, file))
  );

  const images = [];

  body.images.forEach((img, index) => {
    const fileName = `image${index + 1}.png`;
    const filePath = path.join(assetDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(img, 'base64'));
    images.push(`${config.SWAGGER_URL}/${filePath}`);
  });

  return [{ assetId: body.assetId, images }, 200];
};

/**
 * Physically removes the entire image directory for a specified asset.
 * Supports deletion from both production and backup storage locations.
 * 
 * @param {string} assetId - Asset identifier
 * @param {boolean} fromBackUpServer - True to delete from backup folder, false for production
 * @returns {Promise<Array>} - [deleteMessage, statusCode] tuple
 */
const deleteImagesAsset = async (assetId, fromBackUpServer) => {
  const baseDir = fromBackUpServer ? 'public/imagesBackUp' : 'public/images';
  const assetDir = path.join(baseDir, assetId);

  if (!fs.existsSync(assetDir)) {
    return [{ message: `images for asset ${assetId} do not exist` }, 404];
  }

  fs.rmSync(assetDir, { recursive: true, force: true });
  return [{ message: `images for asset ${assetId} deleted` }, 200];
};

module.exports = {
  getAllAssetResilink,
  getAllAsset,
  getOneAsset,
  getOwnerAsset,
  createAsset,
  putAsset,
  deleteAsset,
  postImagesAsset,
  deleteImages,
  saveImagesAsset,
  deleteImagesAsset
};
