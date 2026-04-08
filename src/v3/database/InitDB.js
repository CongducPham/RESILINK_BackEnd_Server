const connectToDatabase = require('./ConnectDB');
const winston = require('winston');

const initLogger = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Removes duplicate documents from a collection, keeping the first occurrence for each unique field value.
 * @param {Object} collection - MongoDB collection.
 * @param {string} field - Field name to deduplicate on.
 */
const deduplicateCollection = async (collection, field) => {
  const pipeline = [
    { $group: { _id: `$${field}`, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ];
  const duplicates = await collection.aggregate(pipeline).toArray();
  for (const doc of duplicates) {
    const [, ...toDelete] = doc.ids;
    await collection.deleteMany({ _id: { $in: toDelete } });
    initLogger.warn(`Removed ${toDelete.length} duplicate(s) in ${collection.collectionName} for ${field}=${doc._id}`);
  }
};

/**
 * Ensures all required unique indexes exist across application collections.
 * @returns {Promise<void>} Resolves when index initialization completes.
 */
const initDB = async () => {
  try {    
    const db = await connectToDatabase.connectToDatabase();
    const collectionRegisteredServer = db.collection('RegisteredServers');
    const collectionOffer = db.collection('Offer');
    const collectionAsset = db.collection('Asset');
    const collectionAssetType = db.collection('AssetType');
    const collectionFavoriteServers= db.collection('FavoriteServers');
    const collectionRating= db.collection('Rating');
    const collectionRecommendationStats= db.collection('RecommendationStats');
    const collectionProsumer= db.collection('prosumer');
    const collectionUser= db.collection('user');

    // Deduplicate before creating unique indexes to handle pre-existing duplicate data
    await deduplicateCollection(collectionRegisteredServer, 'serverName');
    await deduplicateCollection(collectionRegisteredServer, 'serverUrl');
    await deduplicateCollection(collectionOffer, 'id');
    await deduplicateCollection(collectionAsset, 'id');
    await deduplicateCollection(collectionAssetType, 'name');
    await deduplicateCollection(collectionFavoriteServers, 'id');
    await deduplicateCollection(collectionRating, 'userId');
    await deduplicateCollection(collectionRecommendationStats, 'name');
    await deduplicateCollection(collectionProsumer, 'id');
    await deduplicateCollection(collectionUser, 'userName');
    await deduplicateCollection(collectionUser, 'email');

    await collectionRegisteredServer.createIndex(
      { serverName: 1 },
      { unique: true }
    );

    await collectionRegisteredServer.createIndex(
      { serverUrl: 1 },
      { unique: true }
    );

    await collectionOffer.createIndex( 
      { id: 1 },
      { unique: true }
    );

    await collectionAsset.createIndex(
      { id: 1 },
      { unique: true }
    );

    await collectionAssetType.createIndex(
      { name: 1 },
      { unique: true }
    );

    await collectionFavoriteServers.createIndex(
      { id: 1 },
      { unique: true }
    );

    await collectionRating.createIndex(
      { userId: 1 },
      { unique: true }
    );

    await collectionRecommendationStats.createIndex(
      { name: 1 },
      { unique: true }
    );

    await collectionProsumer.createIndex(
      { id: 1 },
      { unique: true }
    );

    await collectionUser.createIndex(
      { userName: 1 },
      { unique: true }
    );

    await collectionUser.createIndex(
      { email: 1 },
      { unique: true }
    );

    initLogger.info('RegisteredServers indexes ensured', {
      from: 'initDB',
      indexes: ['serverName(unique)', 'serverUrl(unique)', 'offerId(==id)(unique)']
    });

  } catch (e) {
    initLogger.error('Failed to initialize database indexes', {
      from: 'initDB',
      error: e.message
    });
    throw e;
  }
};

module.exports = { initDB };
