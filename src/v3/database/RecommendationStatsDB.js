const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const connectToDatabase = require('./ConnectDB.js');
require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates a new RecommendationStats document.
 * @param {Object} body - Recommendation stats payload.
 * @returns {Promise<Object>} MongoDB insert result.
 */
const newRecommendationStats = async (body) => {
  const db = await connectToDatabase.connectToDatabase();
  const collection = db.collection('RecommendationStats');

  const name = body.name;

  try {
    body.lastUpdated = new Date().toISOString();
    body.createdAt = new Date().toISOString();

    const result = await collection.insertOne(body);

    if (!result.acknowledged) {
      throw new InsertDBError(`RecommendationStats with name ${name} could not be created`);
    }

    updateData.info('Successfully created RecommendationStats', {
      from: 'newRecommendationStats',
      name
    });

    return result;

  } catch (e) {
    // Duplicate key error thrown by MongoDB when name already exists.
    if (e.code === 11000) {
      throw new InsertDBError(`RecommendationStats with name ${name} already exists`);
    }

    if (e instanceof InsertDBError) {
      updateData.error('Error inserting RecommendationStats', {
        from: 'newRecommendationStats',
        data: body,
        error: e.message
      });
    } else {
      connectDB.error('Error connecting to DB', {
        from: 'newRecommendationStats',
        data: body,
        error: e.message
      });
    }

    throw e;
  }
};

/**
 * Retrieves one RecommendationStats document by name.
 * @param {string} name - Username key.
 * @returns {Promise<Object>} Recommendation stats document.
 */
const getRecommendationStats = async (name) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    const doc = await _collection.findOne({ name });

    if (!doc) {
      throw new getDBError(`RecommendationStats for ${name} not found`);
    }

    getDataLogger.info('Successfully retrieved RecommendationStats', { from: 'getRecommendationStats', data: { name } });
    return doc;

  } catch (e) {
    if (e instanceof getDBError) {
      e.message = "User " + name + " statistics not found";
      getDataLogger.error('Error retrieving RecommendationStats', { from: 'getRecommendationStats', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'getRecommendationStats', error: e.message });
    }
    throw e;
  }
};

/**
 * Retrieves all RecommendationStats documents.
 * @returns {Promise<Array>} List of recommendation stats documents.
 */
const getAllRecommendationStats = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    const allDocs = await _collection.find({}).toArray();

    getDataLogger.info('Successfully retrieved all RecommendationStats', { from: 'getAllRecommendationStats' });
    return allDocs;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('Error retrieving all RecommendationStats', { from: 'getAllRecommendationStats', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'getAllRecommendationStats', error: e.message });
    }
    throw e;
  }
};

/**
 * Updates one RecommendationStats document by name.
 * @param {string} name - Username key.
 * @param {Object} updateFields - Fields to update.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateRecommendationStats = async (name, updateFields) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    updateData.warn('Before updating RecommendationStats', { from: 'updateRecommendationStats', data: { name, updateFields } });

    const result = await _collection.updateOne(
      { name },
      { $set: { ...updateFields, lastUpdated: new Date().toISOString() } }
    );

    if (result.modifiedCount === 1) {
      updateData.info('Successfully updated RecommendationStats', { from: 'updateRecommendationStats', data: { name } });
    } else {
      throw new UpdateDBError(`No document updated for name: ${name}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('Error updating RecommendationStats', { from: 'updateRecommendationStats', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'updateRecommendationStats', error: e.message });
    }
    throw e;
  }
};

/**
 * Deletes one RecommendationStats document by name.
 * @param {string} name - Username key.
 * @returns {Promise<void>} Resolves when deletion completes.
 */
const deleteRecommendationStats = async (name) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    const result = await _collection.deleteOne({ name });

    if (result.deletedCount === 1) {
      deleteData.info('Successfully deleted RecommendationStats', { from: 'deleteRecommendationStats', data: { name } });
    } else {
      throw new DeleteDBError(`No RecommendationStats deleted for name: ${name}`);
    }

  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('Error deleting RecommendationStats', { from: 'deleteRecommendationStats', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'deleteRecommendationStats', error: e.message });
    }
    throw e;
  }
};

/**
 * Increments one asset type counter for a user recommendation profile.
 * @param {string} name - Username key.
 * @param {string} assetType - Asset type key.
 * @returns {Promise<void>} Resolves when increment completes.
 */
const incrementAssetTypeCount = async (name, assetType) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    const doc = await _collection.findOne({ name });

    if (!doc) {
      throw new getDBError(`RecommendationStats for ${name} not found`);
    }

    updateData.warn('Before incrementing assetType', { from: 'incrementAssetTypeCount', data: { name, assetType } });

    const result = await _collection.updateOne(
      { name: name },
      {
        $inc: { [`assetType.${assetType}`]: 1 },
        $set: { lastUpdated: new Date().toISOString() }
      },
    );

    if (result.modifiedCount === 1 || result.upsertedCount === 1) {
      updateData.info('Successfully incremented assetType count', { from: 'incrementAssetTypeCount', data: { name, assetType } });
    } else {
      throw new UpdateDBError(`Failed to increment assetType count for ${assetType}`);
    }

  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('Error incrementing assetType count', { from: 'incrementAssetTypeCount', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'incrementAssetTypeCount', error: e.message });
    }
    throw e;
  }
};

/**
 * Increments total offers and one asset type counter for a user.
 * @param {string} name - Username key.
 * @param {string} assetType - Asset type key.
 * @returns {Promise<void>} Resolves when increment completes.
 */
const incrementTotalOfferAndAssetTypeCount = async (name, assetType) => {
  try {

    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('RecommendationStats');

    const doc = await _collection.findOne({ name: name });

    if (!doc) {
      throw new getDBError(`RecommendationStats for ${name} not found`);
    }

    const result = await _collection.updateOne(
      { name: name },
      {
        $inc: { [`assetType.${assetType}`]: 1, totalOffersCreated: 1 },
        $set: { lastUpdated: new Date().toISOString() }
      },
    );

    if (result.modifiedCount === 1 || result.upsertedCount === 1) {
      updateData.info('Successfully incremented assetType count', { from: 'incrementAssetTypeCount', data: { name, assetType } });
    } else {
      throw new UpdateDBError(`Failed to increment assetType count for ${assetType}`);
    }

  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('Error incrementing assetType count', { from: 'incrementAssetTypeCount', error: e.message });
    } else {
      connectDB.error('Error connecting to DB', { from: 'incrementAssetTypeCount', error: e.message });
    }
    throw e;
  }
};

/**
 * Retrieves one RecommendationStats document by name.
 * @param {string} name - Username key.
 * @returns {Promise<Object|null>} Recommendation stats document or null.
 */
const getRecommendationStatsByName = async (name) => {
  const db = await connectToDatabase.connectToDatabase();
  return await db.collection("RecommendationStats").findOne({ name });
};

/**
 * Retrieves the latest global recommendation statistics document.
 * @returns {Promise<Object|null>} Latest global recommendation stats document or null.
 */
const getLatestGlobalRecommendationStats = async () => {
  const db = await connectToDatabase.connectToDatabase();
  return await db
    .collection("GlobalRecommendationStats")
    .find({})
    .sort({ lastUpdated: -1, _id: -1 })
    .limit(1)
    .next();
};

  /**
   * Initializes a new asset type key across user and global recommendation documents.
   * @param {string} assetTypeName - Asset type key to initialize.
   * @returns {Promise<void>} Resolves when synchronization completes.
   */
const initializeAssetTypeForAllRecommendationStats = async (assetTypeName) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const recommendationStatsCollection = _database.collection('RecommendationStats');
    const globalRecommendationStatsCollection = _database.collection('GlobalRecommendationStats');

    const now = new Date().toISOString();
    const assetTypeField = `assetType.${assetTypeName}`;

    await recommendationStatsCollection.updateMany(
      { [assetTypeField]: { $exists: false } },
      { $set: { [assetTypeField]: 0, lastUpdated: now } }
    );

    await globalRecommendationStatsCollection.updateMany(
      { [assetTypeField]: { $exists: false } },
      {
        $set: {
          [assetTypeField]: 0,
          lastUpdated: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    updateData.info('Successfully initialized assetType in recommendation stats', {
      from: 'initializeAssetTypeForAllRecommendationStats',
      assetTypeName
    });
  } catch (e) {
    connectDB.error('Error initializing assetType in recommendation stats', {
      from: 'initializeAssetTypeForAllRecommendationStats',
      assetTypeName,
      error: e.message
    });
    throw e;
  }
};

/**
 * Removes an asset type key from user and global recommendation documents.
 * @param {string} assetTypeName - Asset type key to remove.
 * @returns {Promise<void>} Resolves when synchronization completes.
 */
const removeAssetTypeFromAllRecommendationStats = async (assetTypeName) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const recommendationStatsCollection = _database.collection('RecommendationStats');
    const globalRecommendationStatsCollection = _database.collection('GlobalRecommendationStats');

    const now = new Date().toISOString();
    const assetTypeField = `assetType.${assetTypeName}`;

    await recommendationStatsCollection.updateMany(
      { [assetTypeField]: { $exists: true } },
      {
        $unset: { [assetTypeField]: '' },
        $set: { lastUpdated: now }
      }
    );

    await globalRecommendationStatsCollection.updateMany(
      { [assetTypeField]: { $exists: true } },
      {
        $unset: { [assetTypeField]: '' },
        $set: { lastUpdated: now }
      }
    );

    updateData.info('Successfully removed assetType from recommendation stats', {
      from: 'removeAssetTypeFromAllRecommendationStats',
      assetTypeName
    });
  } catch (e) {
    connectDB.error('Error removing assetType from recommendation stats', {
      from: 'removeAssetTypeFromAllRecommendationStats',
      assetTypeName,
      error: e.message
    });
    throw e;
  }
};

module.exports = {
  newRecommendationStats,
  getRecommendationStats,
  getAllRecommendationStats,
  updateRecommendationStats,
  deleteRecommendationStats,
  incrementAssetTypeCount,
  incrementTotalOfferAndAssetTypeCount,
  getRecommendationStatsByName,
  getLatestGlobalRecommendationStats,
  initializeAssetTypeForAllRecommendationStats,
  removeAssetTypeFromAllRecommendationStats
};
