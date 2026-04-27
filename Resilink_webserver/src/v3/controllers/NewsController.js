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
*****************************************************************************/

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');

const NewsService = require("../services/NewsService.js");

/**
 * Creates a new news entry in the RESILINK database.
 * Express handler delegating to NewsService.createNews.
 *
 * @param {Object} req - Express request object (body: news payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created news or a 500 error
 */
const createNews = async (req, res) => { 
  try {
    const response = await NewsService.createNews(req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'createNews', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Creates a personal news entry linked to a specific prosumer in the RESILINK database.
 * Express handler delegating to NewsService.createPersonnalNews.
 *
 * @param {Object} req - Express request object (params.id: prosumer ID, body: news payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the created personal news or a 500 error
 */
const createPersonnalNews = async (req, res) => { 
  try {
    const response = await NewsService.createPersonnalNews(req.params.id, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'createPersonnalNews', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Updates an existing news entry by its ID in the RESILINK database.
 * Express handler delegating to NewsService.updateNews.
 *
 * @param {Object} req - Express request object (params.id: news ID, body: update payload, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the update result or a 500 error
 */
const updateNews = async (req, res) => { 
  try {
    const response = await NewsService.updateNews(req.params.id, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'updateNews', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves all news entries, optionally filtered by country query parameter.
 * Express handler delegating to NewsService.getAllNews.
 *
 * @param {Object} req - Express request object (query.country: optional country filter, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the news list or a 500 error
 */
const getAllNews = async (req, res) => { 
  try {
    const response = await NewsService.getAllNews(req.query.country, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getAllNews', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Retrieves all news entries filtered by country from the RESILINK database.
 * Express handler delegating to NewsService.getNewsfromCountry.
 *
 * @param {Object} req - Express request object (query.country: target country, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the country-filtered news list or a 500 error
 */
const getNewsfromCountry = async (req, res) => { 
    try {
      const response = await NewsService.getNewsfromCountry(req.query.country, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing Resilink server', { from: 'getNewsfromCountry', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({error: error});
    }
};

/**
 * Retrieves news entries matching a list of IDs from the RESILINK database.
 * Express handler delegating to NewsService.getNewsfromIdList.
 *
 * @param {Object} req - Express request object (query.ids: comma-separated news IDs, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the matched news list or a 500 error
 */
const getNewsfromIdList = async (req, res) => { 
  try {
    const response = await NewsService.getNewsfromIdList(req.query.ids, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getNewsfromIdList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

/**
 * Retrieves all news entries created by a specific prosumer owner.
 * Express handler delegating to NewsService.getNewsfromOwner.
 *
 * @param {Object} req - Express request object (params.id: owner prosumer ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the owner's news list or a 500 error
 */
const getNewsfromOwner = async (req, res) => { 
  try {
    const response = await NewsService.getNewsfromOwner(req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getNewsfromIdList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Retrieves country news excluding news already bookmarked by a specific user.
 * Express handler delegating to NewsService.getNewsfromCountryWithoutUserNews.
 *
 * @param {Object} req - Express request object (query.owner: prosumer username, query.country: target country, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the filtered news list or a 500 error
 */
const getNewsfromCountryWithoutUserNews = async (req, res) => { 
  try {
    const response = await NewsService.getNewsfromCountryWithoutUserNews(req.query.owner, req.query.country, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'getNewsfromIdList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

/**
 * Deletes a news entry by its ID from the RESILINK database.
 * Express handler delegating to NewsService.deleteNews.
 *
 * @param {Object} req - Express request object (params.id: news ID, Authorization header required)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} - Responds with the deletion result or a 500 error
 */
const deleteNews = async (req, res) => { 
  try {
    const response = await NewsService.deleteNews(req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', { from: 'deleteNews', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({error: error});
  }
};

module.exports = {
    createNews,
    createPersonnalNews,
    updateNews,
    getAllNews,
    getNewsfromCountry,
    getNewsfromIdList,
    getNewsfromOwner,
    getNewsfromCountryWithoutUserNews,
    deleteNews
};