const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Creates a new asset document and assigns the next incremental asset ID.
 * @param {Object} body - Asset payload to insert.
 * @returns {Promise<Object>} Inserted asset document.
 */
const newAsset = async (body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');
    const counterCollection = _database.collection('Counters');

    // Atomic increment
    const counter = await counterCollection.findOneAndUpdate(
      { _id: 'assetId' },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    updateData.warn('before inserting data', {
      from: 'newAsset',
      data: body
    });

    const assetToInsert = {
      ...body,
      id: counter.seq,
      remainingQuantity: body.totalQuantity,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    const result = await _collection.insertOne(assetToInsert);

    if (!result.acknowledged) {
      throw new InsertDBError("Asset not created in local DB");
    }

    updateData.info('success creating an asset in Resilink DB', {
      from: 'newAsset',
      assetId: counter.seq
    });

    return assetToInsert;

  } catch (e) {
    if (e.code === 11000) {
      // Final safety check for unique index collisions.
      throw new InsertDBError("Duplicate asset id detected");
    }

    if (e instanceof InsertDBError) {
      updateData.error('error creating an asset in Resilink DB', {
        from: 'newAsset',
        error: e.message
      });
    } else {
      connectDB.error('error connecting to DB', {
        from: 'newAsset',
        error: e
      });
    }

    throw e;
  }
};

/**
 * Retrieves all assets from the database.
 * @returns {Promise<Array>} List of assets.
 */
const getAllAsset = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const result = await _collection.find({}).toArray();

    if (result == null) {
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
 * Retrieves one asset by its numeric ID.
 * @param {string} assetId - Asset identifier.
 * @returns {Promise<Object>} Asset document.
 */
const getOneAsset = async (assetId) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('Asset');
    
        const numericAssetId = parseInt(assetId);
        const valueAsset = await _collection.findOne({ id: numericAssetId});

        if (valueAsset == null || valueAsset.length === 0) {
          throw new getDBError("no asset with this id was found")
        } 
        getDataLogger.info('succes retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
        return valueAsset;

    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getOneAssetType',  error: e});
      }
      throw(e);
    }
};

/**
 * Deletes one asset by its numeric ID.
 * @param {string} assetId - Asset identifier.
 * @returns {Promise<void>} Resolves when the deletion completes.
 */
const deleteAssetById = async (assetId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

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
 * Updates one asset by its numeric ID.
 * @param {string} assetId - Asset identifier.
 * @param {Object} asset - Fields to update.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const updateAssetById = async (assetId, asset) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.updateOne(
      { id: numericAssetId },
      { $set: asset }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${assetId} successfully updated`, { from: 'updateAssetById' });
      } else {
        updateData.info(`Document with ID ${assetId} found but value unchanged`, { from: 'updateAssetById' });
      }
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

/**
 * Updates the image list of one asset by its numeric ID.
 * @param {string} assetId - Asset identifier.
 * @param {Array|string} img - New image payload.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const updateAssetImagesById = async (assetId, img) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.updateOne(
      { id: numericAssetId },
      { $set: { images: img} }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${assetId} successfully updated`, { from: 'updateAssetImagesById' });
      } else {
        updateData.info(`Document with ID ${assetId} found but value unchanged`, { from: 'updateAssetImagesById' });
      }
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${assetId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating asset in Resilink DB', { from: 'updateAssetImagesById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateAssetImagesById', error: e });
    }
    throw e;
  }
};

/**
 * Atomically increments (or decrements) the remainingQuantity of an asset.
 * Uses MongoDB $inc to avoid race conditions on concurrent offer operations.
 * 
 * @param {string|number} assetId - Asset identifier.
 * @param {number} delta - Amount to add (positive) or subtract (negative).
 * @returns {Promise<Object>} Updated asset document (after the increment).
 */
const incrementAssetRemainingQuantity = async (assetId, delta) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.findOneAndUpdate(
      { id: numericAssetId },
      { $inc: { remainingQuantity: delta } },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new UpdateDBError(`Asset ${assetId} not found for quantity update`);
    }

    updateData.info(`Asset ${assetId} remainingQuantity adjusted by ${delta}`, {
      from: 'incrementAssetRemainingQuantity',
      newRemainingQuantity: result.remainingQuantity
    });

    return result;

  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error adjusting asset remainingQuantity', {
        from: 'incrementAssetRemainingQuantity',
        error: e.message
      });
    } else {
      connectDB.error('error connecting to DB', {
        from: 'incrementAssetRemainingQuantity',
        error: e
      });
    }
    throw e;
  }
};

module.exports = {
  newAsset,
  getAllAsset,
  getOneAsset,
  deleteAssetById,
  updateAssetById,
  updateAssetImagesById,
  incrementAssetRemainingQuantity
};
