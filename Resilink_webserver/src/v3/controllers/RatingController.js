require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataLogger = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataLogger = winston.loggers.get('DeleteDataODEPLogger');

const RatingService = require("../services/RatingService.js");

/**
 * Creates a new rating for a user in the RESILINK database.
 * Express handler delegating to RatingService.createRating.
 *
 * @param {Object} req - Express request object (body: rating payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created rating or a 500 error
 */
const createRating = async (req, res) => { 
  try {
    const response = await RatingService.createRating(req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'createRating', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Updates the rating of a user by their user ID in the RESILINK database.
 * Express handler delegating to RatingService.putRating.
 *
 * @param {Object} req - Express request object (params.userId: user ID, body: updated rating payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the updated rating or a 500 error
 */
const updateRating = async (req, res) => { 
  try {
    const response = await RatingService.putRating(req.params.userId, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataLogger.error('Error accessing Resilink server', { from: 'updateRating', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves all ratings from the RESILINK database.
 * Express handler delegating to RatingService.getAllRating.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the full rating list or a 500 error
 */
const getAllRating = async (req, res) => { 
  try {
    const response = await RatingService.getAllRating(req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getAllRating', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Retrieves the rating for a specific user by their user ID.
 * Express handler delegating to RatingService.getIdRating.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the user's rating or a 500 error
 */
const getRatingFromUserId = async (req, res) => { 
    try {
      const response = await RatingService.getIdRating(req.params.userId, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing Resilink server', { from: 'getRatingFromUserId', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({error: error});
    }
};

/**
 * Retrieves the average rating across all users in the RESILINK database.
 * Express handler delegating to RatingService.getAverageRating.
 *
 * @param {Object} req - Express request object (Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the average rating value or a 500 error
 */
const getAverageRating = async (req, res) => { 
  try {
    const response = await RatingService.getAverageRating(req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getAverageRating', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Deletes the rating of a user by their user ID from the RESILINK database.
 * Express handler delegating to RatingService.deleteRating.
 *
 * @param {Object} req - Express request object (params.userId: user ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteRating = async (req, res) => { 
  try {
    const response = await RatingService.deleteRating(req.params.userId, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataLogger.error('Error accessing Resilink server', { from: 'deleteRating', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
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