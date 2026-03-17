const connectToDatabase = require('./ConnectDB');
const winston = require('winston');

const initLogger = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Initializes required MongoDB indexes for core RESILINK collections.
 */

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
