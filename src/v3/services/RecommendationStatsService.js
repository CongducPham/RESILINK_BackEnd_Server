require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

const RecommendationStatsDB = require("../database/RecommendationStatsDB.js");

/**
 * Creates new recommendation statistics for a user.
 * Tracks user interaction patterns with different asset types for personalized offer ranking.
 * Essential for the platform's recommendation engine and AI-driven matching.
 * 
 * @param {Object} body - Stats initialization data (name/userId, assetType counters)
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const createRecommendationStats = async (body, user) => {
  try {
    await RecommendationStatsDB.newRecommendationStats(body);

    getDataLogger.info(
      'RecommendationStats successfully created',
      { from: 'createRecommendationStats', username: user?.username }
    );

    return [{ message: `RecommendationStats created for ${body.name}` }, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while creating RecommendationStats',
      { from: 'createRecommendationStats', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Retrieves all recommendation statistics records in the platform.
 * Used for analytics and monitoring recommendation system performance.
 * 
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [allStats[], statusCode] with complete statistics list
 */
const getAllRecommendationStats = async (user) => {
  try {
    const dataFinal = await RecommendationStatsDB.getAllRecommendationStats();

    getDataLogger.info(
      'Successfully retrieved all RecommendationStats',
      { from: 'getAllRecommendationStats', username: user?.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving all RecommendationStats',
      { from: 'getAllRecommendationStats', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Retrieves recommendation statistics for a specific user.
 * Returns user's interaction history with asset types (view counts, click patterns).
 * Powers personalized offer weighting and content suggestions.
 * 
 * @param {string} name - Username whose statistics to retrieve
 * @param {Object} user - Authenticated user requesting data
 * @returns {Promise<Array>} - [userStats, statusCode] tuple
 */
const getRecommendationStatsByName = async (name, user) => {
  try {
    const dataFinal = await RecommendationStatsDB.getRecommendationStats(name);

    getDataLogger.info(
      `Successfully retrieved RecommendationStats for ${name}`,
      { from: 'getRecommendationStatsByName', username: user?.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving RecommendationStats by name',
      { from: 'getRecommendationStatsByName', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Updates recommendation statistics for a user.
 * Only the stats owner or admin can perform updates.
 * Allows manual adjustment of recommendation weights.
 * 
 * @param {string} name - Username whose statistics to update
 * @param {Object} body - Updated statistics data
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const updateRecommendationStats = async (name, body, user) => {
  try {
    if (user.username !== 'admin' && user.username !== name) {
      updateData.error(
        'Unauthorized: not admin or owner',
        { from: 'updateRecommendationStats', username: user?.username }
      );
      return [{ message: 'Not admin or owner of recommendation stats' }, 403];
    }

    await RecommendationStatsDB.updateRecommendationStats(name, body);

    updateData.info(
      `RecommendationStats successfully updated for ${name}`,
      { from: 'updateRecommendationStats', username: user?.username }
    );

    return [{ message: 'Update successful' }, 200];
  } catch (e) {
    updateData.error(
      'Error while updating RecommendationStats',
      { from: 'updateRecommendationStats', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Permanently deletes recommendation statistics for a user.
 * Only the stats owner or admin can delete.
 * WARNING: Deletion resets personalization and user returns to default recommendations.
 * 
 * @param {string} name - Username whose statistics to delete
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteRecommendationStats = async (name, user) => {
  try {
    if (user.username !== 'admin' && user.username !== name) {
      deleteData.error(
        'Unauthorized: not admin or owner',
        { from: 'deleteRecommendationStats', username: user?.username }
      );
      return [{ message: 'Not admin or owner of recommendation stats' }, 403];
    }

    await RecommendationStatsDB.deleteRecommendationStats(name);

    deleteData.info(
      `RecommendationStats successfully deleted for ${name}`,
      { from: 'deleteRecommendationStats', username: user?.username }
    );

    return [{ message: 'Delete successful' }, 200];
  } catch (e) {
    deleteData.error(
      'Error while deleting RecommendationStats',
      { from: 'deleteRecommendationStats', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Increments the interaction count for a specific asset type in user's statistics.
 * Called automatically when users view/interact with offers of a particular type.
 * Gradually builds user preference profile for improved recommendations.
 * Only the stats owner or admin can increment counters.
 * 
 * @param {string} name - Username whose statistics to update
 * @param {string} assetType - Asset type name to increment counter for
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const incrementAssetTypeCount = async (name, assetType, user) => {
  try {
    if (user.username !== 'admin' && user.username !== name) {
      updateData.error(
        'Unauthorized: not admin or owner',
        { from: 'incrementAssetTypeCount', username: user?.username }
      );
      return [{ message: 'Not admin or owner of recommendation stats' }, 403];
    }

    await RecommendationStatsDB.incrementAssetTypeCount(name, assetType);

    updateData.info(
      `AssetType ${assetType} incremented for ${name}`,
      { from: 'incrementAssetTypeCount', username: user?.username }
    );

    return [{ message: `AssetType ${assetType} incremented successfully` }, 200];
  } catch (e) {
    updateData.error(
      'Error while incrementing AssetType count',
      { from: 'incrementAssetTypeCount', error: e.message, username: user?.username }
    );
    throw e;
  }
};

module.exports = {
  createRecommendationStats,
  getAllRecommendationStats,
  getRecommendationStatsByName,
  updateRecommendationStats,
  deleteRecommendationStats,
  incrementAssetTypeCount
};
