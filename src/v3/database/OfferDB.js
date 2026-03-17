const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');


/**
 * Creates a new offer with incremental ID and default computed fields.
 * @param {Object} body - Offer payload.
 * @returns {Promise<Object>} MongoDB insert result.
 */
const newOffer = async (body) => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const offerCollection = db.collection('Offer');
    const counterCollection = db.collection('Counters');

    // Atomic increment.
    const counter = await counterCollection.findOneAndUpdate(
      { _id: 'offerId' },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        returnDocument: 'after'
      }
    );

    body.id = counter.seq;
    body.remainingQuantity = body.offeredQuantity;
    body.publicationDate = new Date().toISOString();
    body.country = body.country ?? '';
    body.acceptSharing = body.acceptSharing ?? true;

    const result = await offerCollection.insertOne(body);

    if (!result.acknowledged) {
      throw new InsertDBError('Offer not created');
    }

    updateData.info('Offer successfully created', {
      from: 'newOffer',
      offerId: body.id
    });

    return result;

  } catch (e) {
    updateData.error('Error creating offer', {
      from: 'newOffer',
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves all offers.
 * @returns {Promise<Array>} List of offers.
 */
const getAllOffers = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const result = await _collection.find({}).toArray();

    if (result == null) {
      throw new getDBError("Offers not found in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving all offers in Resilink DB', { from: 'getAllOffers' });
    }

    return result;
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving all offers in Resilink DB', { from: 'getAllOffers' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllOffers', error: e });
    }
    throw e;
  }
};

/**
 * Retrieves one offer by numeric ID.
 * @param {string} offerId - Offer identifier.
 * @returns {Promise<Object>} Offer document.
 */
const getOneOffer = async (offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);
    const valueOffer = await _collection.findOne({ id: numericOfferId });

    if (valueOffer == null) {
      throw new getDBError("No offer with this ID was found");
    } 
    getDataLogger.info('success retrieving one offer in Resilink DB', { from: 'getOneOffer' });
    return valueOffer;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving one offer in Resilink DB', { from: 'getOneOffer' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getOneOffer', error: e });
    }
    throw e;
  }
};

/**
 * Retrieves multiple offers by their IDs in a single bulk query.
 * Missing IDs are silently skipped (no error thrown).
 * 
 * @param {Array<string|number>} offerIds - List of offer identifiers
 * @returns {Promise<Array<Object>>} Array of found offer documents
 */
const getOffersByIds = async (offerIds) => {
  try {
    if (!offerIds || offerIds.length === 0) return [];

    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericIds = offerIds.map(id => parseInt(id));
    const results = await _collection.find({ id: { $in: numericIds } }).toArray();

    getDataLogger.info(`retrieved ${results.length}/${offerIds.length} offers by IDs`, { from: 'getOffersByIds' });
    return results;

  } catch (e) {
    connectDB.error('error connecting to DB', { from: 'getOffersByIds', error: e });
    throw e;
  }
};

/**
 * Deletes one offer by numeric ID.
 * @param {string} offerId - Offer identifier.
 * @returns {Promise<void>} Resolves when deletion completes.
 */
const deleteOfferById = async (offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);
    const result = await _collection.deleteOne({ id: numericOfferId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${offerId} successfully deleted`, { from: 'deleteOfferById' });
    } else {
      deleteData.error('error deleting offer in Resilink DB', { from: 'deleteOfferById' });
      throw new DeleteDBError('Error deleting offer in Resilink DB');
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting offer in Resilink DB', { from: 'deleteOfferById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteOfferById', error: e });
    }
    throw e;
  }
};

/**
 * Updates one offer by numeric ID.
 * @param {string} offerId - Offer identifier.
 * @param {Object} offer - Fields to update.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateOfferById = async (offerId, offer) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);

    const result = await _collection.updateOne(
      { id: numericOfferId },
      { $set: offer }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${offerId} successfully updated`, { from: 'updateOfferById' });
      } else {
        updateData.info(`Document with ID ${offerId} found but value unchanged`, { from: 'updateOfferById' });
      }
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${offerId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating offer in Resilink DB', { from: 'updateOfferById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateOfferById', error: e });
    }
    throw e;
  }
};

/**
 * Retrieves a paginated weighted offer list using multi-factor composite scoring.
 * 
 * Scoring formula: compositeScore = typeWeight * 0.50 + recencyScore * 0.30 + randomFactor * 0.20
 * - typeWeight:    Normalized user preference for this asset type (0.0 – 1.0)
 * - recencyScore:  Linear decay from 1.0 (today) to 0.0 (30+ days old)
 * - randomFactor:  Random value for diversity and discovery
 * 
 * @param {Object} weights - Normalized map of asset type to weight (0.0 – 1.0).
 * @param {Array} blockedIds - Offer IDs to exclude.
 * @param {number} offerNbr - Number of offers to return.
 * @param {string|number} iteration - Page iteration index (0-indexed).
 * @param {string} username - Current user's username (excluded from results).
 * @returns {Promise<Array>} Scored and sorted offer result set.
 */
const getWeightedOffersFromDB = async (weights, blockedIds, offerNbr, iteration, username, userActivity = null) => {
  const _database = await connectToDatabase.connectToDatabase();
  const _collection = _database.collection('Offer');

  const numericBlockedIds = blockedIds.map(id => parseInt(id));
  const limit = parseInt(offerNbr);
  const skip = parseInt(iteration) * limit;

  // ---- Dynamic scoring constants ----
  // When the user has a valid activityDomain we add a 15% activity factor
  // and redistribute: type 40%, activity 15%, recency 25%, random 20%.
  // Otherwise: type 50%, recency 30%, random 20%.
  const activityActive = userActivity !== null;

  const WEIGHT_TYPE_FACTOR     = activityActive ? 0.40 : 0.50;
  const WEIGHT_ACTIVITY_FACTOR = activityActive ? 0.15 : 0.00;
  const WEIGHT_RECENCY_FACTOR  = activityActive ? 0.25 : 0.30;
  const WEIGHT_RANDOM_FACTOR   = 0.20; // always 20% — diversity / discovery

  const RECENCY_WINDOW_MS     = 1000 * 60 * 60 * 24 * 30; // 30 days
  const MIN_DISCOVERY_WEIGHT  = 0.05; // minimum weight for unknown asset types

  // Base match: exclude blocked offers and user's own offers.
  const baseMatch = {
    id: { $nin: numericBlockedIds },
    ...(username ? { offerer: { $ne: username } } : {})
  };

  // Transform weights into [{ assetType, weight }, ...].
  const weightEntries = Object.entries(weights).map(([type, w]) => ({
    assetType: type,
    weight: w
  }));

  const totalWeight = weightEntries.reduce((a, b) => a + b.weight, 0);

  // Common pipeline stages for joining and filtering.
  const commonStages = [
    // 0) Base filter.
    { $match: baseMatch },

    // 1) Join Offer -> Asset.
    {
      $lookup: {
        from: "Asset",
        localField: "assetId",
        foreignField: "id",
        as: "assetData"
      }
    },
    { $unwind: "$assetData" },

    // 2) Join Asset -> AssetType.
    {
      $lookup: {
        from: "AssetType",
        localField: "assetData.assetType",
        foreignField: "name",
        as: "assetTypeData"
      }
    },
    { $unwind: "$assetTypeData" },

    // 3) Filter expired offers.
    {
      $addFields: {
        validityAsDate: { $toDate: "$validityLimit" }
      }
    },
    { $match: { validityAsDate: { $gt: new Date() } } },

    // 4) Filter out-of-stock for measurableByQuantity assets.
    {
      $addFields: {
        isValidQuantity: {
          $or: [
            { $ne: ["$assetTypeData.nature", "measurableByQuantity"] },
            { $gt: ["$remainingQuantity", 0] }
          ]
        }
      }
    },
    { $match: { isValidQuantity: true } },
  ];

  // 4.5) Join Offer -> Prosumer to get the offerer's profession/domain.
  //      Only when the requesting user has a valid activity profile.
  if (activityActive) {
    commonStages.push(
      {
        $lookup: {
          from: "prosumer",
          localField: "offerer",
          foreignField: "id",
          as: "offererProfile"
        }
      },
      {
        $unwind: {
          path: "$offererProfile",
          preserveNullAndEmptyArrays: true
        }
      }
    );
  }

  // ---- Final projection (shared between fallback and weighted paths) ----
  const finalProjection = {
    $project: {
      _id: 1,
      id: 1,
      offerer: 1,
      assetId: 1,
      transactionType: 1,
      offeredQuantity: 1,
      remainingQuantity: 1,
      beginTimeSlot: 1,
      endTimeSlot: 1,
      validityLimit: 1,
      publicationDate: 1,
      price: 1,
      deposit: 1,
      paymentMethod: 1,
      paymentFrequency: 1,
      cancellationFee: 1,
      rentInformation: 1,
      country: 1,
      acceptSharing: 1,
    }
  };

  // ---- Activity score computation (MongoDB $cond expression) ----
  // Compares the offerer's profession/domain with the requesting user's.
  // Hierarchy for the offerer side:
  //   1. offerer has a specificActivity (not empty, not "Other")
  //      → compare specificActivity: exact match with user = 1.0
  //      → else compare activityDomain: same domain = 0.6, different = 0.0
  //   2. offerer has no specificActivity but has activityDomain (not empty, not "Other")
  //      → compare activityDomain with user: match = 0.6, different = 0.0
  //   3. offerer has neither → 0.0
  const buildActivityScoreExpr = () => {
    if (!activityActive) return null;

    const userDomain     = userActivity.activityDomain;
    const userProfession = userActivity.specificActivity; // "" if not meaningful

    // Helper: offerer fields with null safety.
    const offDomain     = { $ifNull: ["$offererProfile.activityDomain", ""] };
    const offProfession = { $ifNull: ["$offererProfile.specificActivity", ""] };

    // Does the offerer have a meaningful specificActivity?
    const offererHasProfession = {
      $and: [
        { $ne: [offProfession, ""] },
        { $ne: [offProfession, "Other"] }
      ]
    };

    // Does the offerer have a meaningful activityDomain?
    const offererHasDomain = {
      $and: [
        { $ne: [offDomain, ""] },
        { $ne: [offDomain, "Other"] }
      ]
    };

    // Profession-level comparison (best granularity).
    // Used only when BOTH offerer and user have a meaningful profession.
    const professionMatch = (userProfession !== "")
      ? { $and: [offererHasProfession, { $eq: [offProfession, userProfession] }] }
      : { $literal: false };

    // Domain-level comparison (broader fallback).
    const domainMatch = { $eq: [offDomain, userDomain] };

    return {
      $cond: {
        // Case 1: both sides have a valid profession and they match → 1.0
        if: professionMatch,
        then: 1.0,
        else: {
          $cond: {
            // Case 2: offerer has a valid domain and it matches the user's domain → 0.6
            if: { $and: [offererHasDomain, domainMatch] },
            then: 0.6,
            // Case 3: no match at any level → 0.0
            else: 0.0
          }
        }
      }
    };
  };

  // ---- Fallback when no assetType weights are available ----
  if (totalWeight === 0) {
    if (activityActive) {
      // No type weights but user has activity → rank by activity + recency + random.
      return await _collection
        .aggregate([
          ...commonStages,
          { $addFields: { activityScore: buildActivityScoreExpr() } },
          {
            $addFields: {
              recencyScore: {
                $max: [0, { $subtract: [1, { $divide: [{ $subtract: [new Date(), { $toDate: "$publicationDate" }] }, RECENCY_WINDOW_MS] }] }]
              },
              randomFactor: { $rand: {} }
            }
          },
          {
            $addFields: {
              compositeScore: {
                $add: [
                  { $multiply: ["$activityScore", 0.40] },
                  { $multiply: ["$recencyScore", 0.40] },
                  { $multiply: ["$randomFactor", 0.20] }
                ]
              }
            }
          },
          { $sort: { compositeScore: -1 } },
          { $skip: skip },
          { $limit: limit },
          finalProjection
        ])
        .toArray();
    }

    // Pure random fallback (no weights, no activity info).
    return await _collection
      .aggregate([
        ...commonStages,
        { $sample: { size: limit } },
        finalProjection
      ])
      .toArray();
  }

  // ---- Weighted pipeline with composite scoring ----
  const pipeline = [
    ...commonStages,

    // 5) Calculate type-preference weight.
    {
      $addFields: {
        typeWeight: {
          $let: {
            vars: {
              match: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: weightEntries,
                      as: "w",
                      cond: { $eq: ["$assetData.assetType", "$$w.assetType"] }
                    }
                  },
                  0
                ]
              }
            },
            in: { $ifNull: ["$$match.weight", MIN_DISCOVERY_WEIGHT] }
          }
        }
      }
    },

    // 6) Calculate recency score + random factor.
    {
      $addFields: {
        recencyScore: {
          $max: [
            0,
            {
              $subtract: [
                1,
                {
                  $divide: [
                    { $subtract: [new Date(), { $toDate: "$publicationDate" }] },
                    RECENCY_WINDOW_MS
                  ]
                }
              ]
            }
          ]
        },
        randomFactor: { $rand: {} }
      }
    },
  ];

  // 6.5) Activity / profession score (only when user has a valid profile).
  if (activityActive) {
    pipeline.push({ $addFields: { activityScore: buildActivityScoreExpr() } });
  }

  // 7) Composite score.
  const compositeFields = [
    { $multiply: ["$typeWeight", WEIGHT_TYPE_FACTOR] },
    { $multiply: ["$recencyScore", WEIGHT_RECENCY_FACTOR] },
    { $multiply: ["$randomFactor", WEIGHT_RANDOM_FACTOR] }
  ];
  if (activityActive) {
    compositeFields.push({ $multiply: ["$activityScore", WEIGHT_ACTIVITY_FACTOR] });
  }

  pipeline.push(
    {
      $addFields: {
        compositeScore: { $add: compositeFields }
      }
    },

    // 8) Sort by composite score descending.
    { $sort: { compositeScore: -1 } },

    // 9) Pagination.
    { $skip: skip },
    { $limit: limit },

    // 10) Final projection.
    finalProjection
  );

  return await _collection.aggregate(pipeline).toArray();
};

/**
 * Retrieves all offers linked to a specific asset.
 * Used for quantity validation when updating or deleting assets.
 * 
 * @param {string|number} assetId - Asset identifier
 * @returns {Promise<Array<Object>>} Array of offer documents for this asset
 */
const getOffersByAssetId = async (assetId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericAssetId = parseInt(assetId);
    const results = await _collection.find({ assetId: numericAssetId }).toArray();

    getDataLogger.info(`retrieved ${results.length} offers for asset ${assetId}`, {
      from: 'getOffersByAssetId'
    });

    return results;

  } catch (e) {
    connectDB.error('error connecting to DB', { from: 'getOffersByAssetId', error: e });
    throw e;
  }
};

module.exports = {
  newOffer,
  getAllOffers,
  getOneOffer,
  getOffersByIds,
  getOffersByAssetId,
  deleteOfferById,
  updateOfferById,
  getWeightedOffersFromDB
};
