require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataLogger = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataLogger = winston.loggers.get('DeleteDataODEPLogger');

const RatingService = require("../services/RatingService.js");

/**
 * HTTP POST - Creates or updates application evaluation rating.
 * Users provide feedback on RESILINK platform satisfaction.
 * One rating per user.
 * 
 * @route POST /ratings
 * @param {Request} req - Express request with rating data (value) in body
 * @param {Response} res - Express response object
 * @returns {Object} Created or updated rating record
 */
const createRating = async (req, res) => {
  try {
    const response = await RatingService.createRating(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error creating rating', { from: 'createRating', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates existing application evaluation rating.
 * Users modify their platform satisfaction rating.
 * Only user owner or admin can update their rating.
 * 
 * @route PUT /ratings/:userId
 * @param {Request} req - Express request with user ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated rating or error if unauthorized
 */
const updateRating = async (req, res) => {
  try {
    const response = await RatingService.putRating(req.params.userId, req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataLogger.error('Error updating rating', { from: 'updateRating', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all application evaluation ratings.
 * Returns complete list of user satisfaction ratings.
 * Used for analytics and platform quality assessment.
 * 
 * @route GET /ratings
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} List of all platform ratings (one per user)
 */
const getAllRating = async (req, res) => {
  try {
    const response = await RatingService.getAllRating(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving ratings', { from: 'getAllRating', error: error.message });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves application rating for specific user.
 * Returns the single rating record for a user.
 * Used to display user's current platform evaluation.
 * 
 * @route GET /ratings/user/:userId
 * @param {Request} req - Express request with user ID in params
 * @param {Response} res - Express response object
 * @returns {Object} User's rating or 404 if not found
 */
const getRatingFromUserId = async (req, res) => {
  try {
    const response = await RatingService.getIdRating(req.params.userId, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving rating by user ID', {
      from: 'getRatingFromUserId',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Calculates average application evaluation rating.
 * Computes overall RESILINK platform satisfaction score.
 * Each user contributes one rating to prevent manipulation.
 * 
 * @route GET /ratings/average
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Average rating value and total count
 */
const getAverageRating = async (req, res) => {
  try {
    const response = await RatingService.getAverageRating(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving average rating', {
      from: 'getAverageRating',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes application evaluation rating.
 * Users retract their platform satisfaction rating.
 * Only user owner or admin can delete their rating.
 * 
 * @route DELETE /ratings/:userId
 * @param {Request} req - Express request with user ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteRating = async (req, res) => {
  try {
    const response = await RatingService.deleteRating(req.params.userId, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataLogger.error('Error deleting rating', {
      from: 'deleteRating',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createRating,
  getAllRating,
  getAverageRating,
  getRatingFromUserId,
  updateRating,
  deleteRating
};
