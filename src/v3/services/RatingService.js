require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const RatingDB = require("../database/RatingDB.js");

/**
 * Creates a new rating entry for a user in the platform.
 * Ratings enable trust-building through user feedback on transaction quality and reliability.
 * Used to build reputation scores for prosumers in the RESILINK marketplace.
 * 
 * @param {Object} body - Rating data (userId, rating value)
 * @param {Object} user - Authenticated user submitting the rating
 * @returns {Promise<Array>} - [createdRating, statusCode] tuple
 */
const createRating = async (body, user) => {
  try {
    const dataFinal = await RatingDB.createNewRating(
      body.userId,
      body.rating
    );

    getDataLogger.info(
      `Rating successfully created for user ${body.userId}`,
      { from: 'createRating', username: user.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while creating rating',
      { from: 'createRating', error: e.message, username: user.username }
    );
    throw e;
  }
};

/**
 * Retrieves all user ratings in the platform.
 * Used for analytics, moderation, and reputation system management.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [ratings[], statusCode] with complete rating list
 */
const getAllRating = async (user) => {
  const username = user?.username ?? 'anonymous';

  try {
    const dataFinal = await RatingDB.getAllRating();

    getDataLogger.info(
      'Successfully retrieved all ratings',
      { from: 'getAllRating', username: username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving all ratings',
      { from: 'getAllRating', error: e.message, username: username }
    );
    throw e;
  }
};

/**
 * Retrieves rating information for a specific user.
 * Displays user's reputation score on their profile and in offer listings.
 * 
 * @param {string} userId - User identifier whose rating to retrieve
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [userRating, statusCode] tuple
 */
const getIdRating = async (userId, user) => {
  const username = user?.username ?? 'anonymous';

  try {
    const dataFinal = await RatingDB.getRatingByUserId(userId );

    getDataLogger.info(
      'Successfully retrieved rating for user',
      { from: 'getIdRating', targetUserId: userId, username: username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving rating by user ID',
      { from: 'getIdRating', error: e.message, username: username}
    );
    throw e;
  }
};

/**
 * Calculates the average rating across all users in the platform.
 * Used for platform-wide quality metrics and benchmarking.
 * Excludes non-numeric ratings from calculation.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [{averageRating}, statusCode] with computed average
 */
const getAverageRating = async (user) => {
  const username = user?.username ?? 'anonymous';

  try {
    const data = await RatingDB.getAllRating();

    let totalRating = 0;
    let count = 0;

    for (const item of data) {
      if (typeof item.rating === 'number') {
        totalRating += item.rating;
        count++;
      }
    }

    const averageRating = count > 0 ? totalRating / count : 0;

    getDataLogger.info(
      'Successfully retrieved average rating',
      { from: 'getAverageRating', username: username }
    );

    return [{ averageRating }, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving average rating',
      { from: 'getAverageRating', error: e.message, username: username }
    );
    throw e;
  }
};

/**
 * Updates an existing user rating.
 * Only the rating owner or admin can modify ratings to prevent manipulation.
 * 
 * @param {string} userId - User identifier whose rating to update
 * @param {Object} body - Updated rating data (rating value)
 * @param {Object} user - Authenticated user (must be owner or admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const putRating = async (userId, body, user) => {
  try {
    if (user.username !== 'admin' && user.username !== userId) {
      getDataLogger.error(
        'Unauthorized: not owner or admin',
        { from: 'putRating', username: user.username }
      );
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await RatingDB.updateRating(userId, body.rating);

    updateDataODEP.info(
      'Rating successfully updated',
      { from: 'putRating', targetUserId: userId, username: user.username }
    );

    return [{ message: 'Update successful' }, 200];
  } catch (e) {
    updateDataODEP.error(
      'Error while updating rating',
      { from: 'putRating', error: e.message, username: user.username }
    );
    throw e;
  }
};

/**
 * Permanently deletes a user's rating from the platform.
 * Only the rating owner or admin can delete ratings.
 * 
 * @param {string} userId - User identifier whose rating to delete
 * @param {Object} user - Authenticated user (must be owner or admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteRating = async (userId, user) => {
  try {
    if (user.username !== 'admin' && user.username !== userId) {
      getDataLogger.error(
        'Unauthorized: not owner or admin',
        { from: 'deleteRating', username: user.username }
      );
      return [{ message: 'Not owner or administrator' }, 403];
    }

    await RatingDB.deleteRatingByUserId(userId);

    deleteDataODEP.info(
      `Rating successfully deleted for user ${userId}`,
      { from: 'deleteRating', username: user.username }
    );

    return [{ message: 'Delete successful' }, 200];
  } catch (e) {
    deleteDataODEP.error(
      'Error while deleting rating',
      { from: 'deleteRating', error: e.message, username: user.username }
    );
    throw e;
  }
};

module.exports = {
  createRating,
  getIdRating,
  getAllRating,
  getAverageRating,
  putRating,
  deleteRating
};
