/*
*  This file is part of the RESILINK back-end server developed by the PRIMA RESILINK (2022-2026) project. 
* RESILINK (2022-2026) is a project funded by the PRIMA Programme supported by the European Union. The project web site is https://resilink.eu/"
*  
*
*  Copyright (C) 2026 Axel Cazaux, University of Pau, UPPA
*
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with the program.  If not, see <http://www.gnu.org/licenses/>.
*
******************************************************************************/

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataLogger = winston.loggers.get('UpdateDataResilinkLogger');
const deleteDataLogger = winston.loggers.get('DeleteDataResilinkLogger');

const RecommendationStatsService = require("../services/RecommendationStatsService.js");

/**
 * HTTP POST - Creates a new recommendation statistics profile for a user.
 * Initializes tracking for user interaction patterns with asset types.
 * Powers personalized offer recommendations based on browsing history.
 * 
 * @route POST /recommendationstats
 * @param {Request} req - Express request with user identifier and initial stats in body
 * @param {Response} res - Express response object
 * @returns {Object} Created recommendation stats profile
 */
const createRecommendationStats = async (req, res) => {
  try {
    const response = await RecommendationStatsService.createRecommendationStats(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error creating recommendation stats', {
      from: 'createRecommendationStats',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all recommendation statistics profiles.
 * Admin users analyze user behavior patterns and recommendation effectiveness.
 * 
 * @route GET /recommendationstats
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of all recommendation stats profiles
 */
const getAllRecommendationStats = async (req, res) => {
  try {
    const response = await RecommendationStatsService.getAllRecommendationStats(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving recommendation stats', {
      from: 'getAllRecommendationStats',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves recommendation statistics for a specific user.
 * Returns asset type interaction counts used to calculate personalized offers.
 * Frontend uses this for "Based on your interests" features.
 * 
 * @route GET /recommendationstats/:name
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} User's interaction statistics by asset type
 */
const getRecommendationStatsByName = async (req, res) => {
  try {
    const response = await RecommendationStatsService.getRecommendationStatsByName(
      req.params.name,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving recommendation stats by name', {
      from: 'getRecommendationStatsByName',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates recommendation statistics for a user.
 * Recalculates weights or resets interaction history.
 * Admin or system operations adjust recommendation profiles.
 * 
 * @route PUT /recommendationstats/:name
 * @param {Request} req - Express request with username in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated recommendation stats profile
 */
const updateRecommendationStats = async (req, res) => {
  try {
    const response = await RecommendationStatsService.updateRecommendationStats(
      req.params.name,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataLogger.error('Error updating recommendation stats', {
      from: 'updateRecommendationStats',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes recommendation statistics for a user.
 * Deletes tracking data when user leaves platform or resets preferences.
 * 
 * @route DELETE /recommendationstats/:name
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation
 */
const deleteRecommendationStats = async (req, res) => {
  try {
    const response = await RecommendationStatsService.deleteRecommendationStats(
      req.params.name,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataLogger.error('Error deleting recommendation stats', {
      from: 'deleteRecommendationStats',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Increments interaction count for a specific asset type.
 * Tracks user clicks, views, or bookmarks on asset categories.
 * Continuous learning adjusts recommendation weights over time.
 * 
 * @route POST /recommendationstats/:name/increment/:assetType
 * @param {Request} req - Express request with username and asset type in params
 * @param {Response} res - Express response object
 * @returns {Object} Updated count for the specified asset type
 */
const incrementAssetTypeCount = async (req, res) => {
  try {
    const response = await RecommendationStatsService.incrementAssetTypeCount(
      req.params.name,
      req.params.assetType,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataLogger.error('Error incrementing asset type count', {
      from: 'incrementAssetTypeCount',
      error: error.message
    });
    res.status(500).send({ message: error.message });
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
