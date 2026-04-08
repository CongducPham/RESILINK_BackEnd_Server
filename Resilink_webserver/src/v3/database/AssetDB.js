const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Creates an asset entry in the RESILINK local database with its images and unit.
 *
 * @param {string|number} assetId - The ODEP asset ID
 * @param {Array<string>} imgBase64 - List of base64-encoded images
 * @param {string} owner - Owner identifier of the asset
 * @param {string} unit - Measurement unit of the asset (optional)
 * @returns {Promise<void>} - Resolves when the asset is created
 */
const newAsset = async (assetId, imgBase64, owner, unit) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');
    updateData.warn('before inserting data', { from: 'newAsset', data: {assetId, imgBase64, owner}});

    const numericAssetId = parseInt(assetId);

    // Insert an asset with its imgpath. Can be empty if default image from mobile app selected
    const asset = await _collection.insertOne({
      id: numericAssetId,
      owner: owner, 
      images: [...imgBase64],
      unit: unit ?? ""
    });

    if (!asset) {
      throw new InsertDBError("asset not created in local DB");
    }  

    updateData.info('success creating an asset in Resilink DB', { from: 'newAsset' });
  } catch (e) {
    if (e instanceof InsertDBError) {
      updateData.error('error creating an asset in Resilink DB', { from: 'newAsset' });
    } else {
      connectDB.error('error connecting to DB', { from: 'newAsset', error: e });
    }
    throw e;
  }
};

/**
 * Enriches an ODEP asset object with RESILINK data (images and unit) by asset ID.
 * Mutates the asset object in place by adding the images and unit fields.
 *
 * @param {Object} asset - ODEP asset object containing an id field
 * @returns {Promise<void>} - Resolves when the asset is enriched
 */
const getAndCompleteOneAssetByAsset = async (asset) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');
    const numericAssetId = parseInt(asset["id"]);

    const result = await _collection.findOne({ id: numericAssetId });

    if (!result) {
      throw new getDBError("asset didn't find in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving an asset in Resilink DB', { from: 'getAndCompleteOneAssetByAsset' });
    }

    asset["images"] = result["images"];
    asset["unit"] = result["unit"];
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving an asset in Resilink DB', { from: 'getAndCompleteOneAssetByAsset' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAndCompleteOneAssetByAsset', error: e });
    }
    throw e;
  }
};

/**
 * Retrieves the base64 images of an asset by its ID from the RESILINK database.
 *
 * @param {string|number} id - The ODEP asset ID
 * @returns {Promise<Array<string>>} - Array of base64-encoded images
 */
const getOneAssetImageById = async (id) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');
    const numericAssetId = parseInt(id);

    const result = await _collection.findOne({ id: numericAssetId });

    if (!result) {
      throw new getDBError("asset didn't find in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving an asset in Resilink DB', { from: 'getOneAssetImageById' });
    }

    return result["images"];
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving an asset in Resilink DB', { from: 'getOneAssetImageById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getOneAssetImageById', error: e });
    }
    throw e;
  }
};

/**
 * Retrieves all asset entries from the RESILINK local database.
 *
 * @returns {Promise<Array<Object>>} - Array of all asset documents
 */
const getAllAsset = async () => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');

    const result = await _collection.find({}).toArray();

    if (!result || result.length === 0) {
      throw new getDBError("assets didn't find in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving all assets in Resilink DB', { from: 'getAllAsset' });
    }

    return result;
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving all assets in Resilink DB', { from: 'getAllAsset' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllAsset', error: e });
    }
    throw e;
  }
};

/**
 * Enriches a list of ODEP asset objects with RESILINK images and unit data.
 * Mutates each asset object in place.
 *
 * @param {Array<Object>} ListAsset - List of ODEP asset objects containing id fields
 * @returns {Promise<Array<Object>>} - The same list with images and unit fields added
 */
const getAndCompleteAssetByAssets = async (ListAsset) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');

    for (const asset of ListAsset) {
      const numericAssetId = parseInt(asset.id);
      const result = await _collection.findOne({ id: numericAssetId });
      if (result != null) {
        asset['images'] = result.images != null ? result.images : [];
        asset['unit'] = result['unit'];
      }
    }

    if (!ListAsset) {
      throw new getDBError("assets didn't find / in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving/processing all assets in Resilink DB', { from: 'getAndCompleteAssetWithImgByAssets' });
    }

    return ListAsset;
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving/processing all assets in Resilink DB', { from: 'getAndCompleteAssetWithImgByAssets' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAndCompleteAssetWithImgByAssets', error: e });
    }
    throw e;
  }
};

/**
 * Deletes an asset entry by its ID from the RESILINK local database.
 *
 * @param {string|number} assetId - The ODEP asset ID to delete
 * @returns {Promise<void>} - Resolves when the asset is deleted
 */
const deleteAssetById = async (assetId) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');

    const numericAssetId = parseInt(assetId);
    const result = await _collection.deleteOne({ id: numericAssetId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${assetId} successfully deleted`, { from: 'deleteAssetById' });
    } else {
      deleteData.error('error deleting asset in Resilink DB', { from: 'deleteAssetById' });
      throw new DeleteDBError('error deleting asset in Resilink DB');
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting asset in Resilink DB', { from: 'deleteAssetById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteAssetById', error: e });
    }
    throw e;
  }
};

/**
 * Updates the images and unit of an asset by its ID in the RESILINK local database.
 *
 * @param {string|number} assetId - The ODEP asset ID to update
 * @param {Array<string>} assetImg - Updated list of base64-encoded images
 * @param {Object} asset - ODEP asset object to mutate with updated images
 * @param {string} unit - Updated measurement unit
 * @returns {Promise<void>} - Resolves when the asset is updated
 */
const updateAssetById = async (assetId, assetImg, asset, unit) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.updateOne(
      { id: numericAssetId },
      { $set: { images: assetImg, unit: unit} }
    );

    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${assetId} successfully updated`, { from: 'updateAssetById' });
      } else {
        updateData.info(`Document with ID ${assetId} found but value unchanged`, { from: 'updateAssetById' });
      }
      asset.images = result.images;
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${assetId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating asset in Resilink DB', { from: 'updateAssetById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateAssetById', error: e });
    }
    throw e;
  }
};

module.exports = {
  newAsset,
  getAndCompleteOneAssetByAsset,
  getOneAssetImageById,
  getAllAsset,
  getAndCompleteAssetByAssets,
  deleteAssetById,
  updateAssetById
};
