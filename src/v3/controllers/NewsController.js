require('../loggers.js');
const winston = require('winston');
const getDataLogger = winston.loggers.get('GetDataLogger');

const NewsService = require("../services/NewsService.js");

/**
 * HTTP POST - Creates a new news article for the RESILINK platform.
 * Admin users publish platform announcements news.
 * Visible to all users in specified countries or globally.
 * 
 * @route POST /news
 * @param {Request} req - Express request with news content in body and authenticated user
 * @param {Response} res - Express response object
 * @returns {Object} Created news article with generated ID and metadata
 */
const createNews = async (req, res) => {
  try {
    const response = await NewsService.createNews(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'createNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
  }
};

/**
 * HTTP POST - Creates a personal news article for a specific user.
 * Users create a link to a news/website to track/access them from an application.
 * Visible only to users who follow or are connected to the author.
 * 
 * @route POST /news/personal/:id
 * @param {Request} req - Express request with owner ID in params, news content in body
 * @param {Response} res - Express response object
 * @returns {Object} Created personal news article
 */
const createPersonnalNews = async (req, res) => {
  try {
    const response = await NewsService.createPersonnalNews(
      req.params.id,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'createPersonnalNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
  }
};

/**
 * HTTP PUT - Updates an existing news article.
 * Only article author or admin can modify. Edits content, title, or visibility.
 * Preserves creation date but updates modification timestamp.
 * 
 * @route PUT /news/:id
 * @param {Request} req - Express request with news ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated news article or error if unauthorized
 */
const updateNews = async (req, res) => {
  try {
    const response = await NewsService.updateNews(
      req.params.id,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'updateNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all news articles.
 * Frontend displays news feed based on user's location or global view.
 * 
 * @route GET /news?country=FR
 * @param {Request} req - Express request with optional country query parameter
 * @param {Response} res - Express response object
 * @returns {Array} List of news articles matching filters
 */
const getAllNews = async (req, res) => {
  try {
    const response = await NewsService.getAllNews(
      req.query.country,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'getAllNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
  }
};

/**
 * HTTP GET - Retrieves news articles specific to a country.
 * Users see localized news.
 * 
 * @route GET /news/country?country=FR
 * @param {Request} req - Express request with country query parameter
 * @param {Response} res - Express response object
 * @returns {Array} News articles targeted to the specified country
 */
const getNewsfromCountry = async (req, res) => {
  try {
    const response = await NewsService.getNewsfromCountry(
      req.query.country,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'getNewsfromCountry',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
  }
};

/**
 * HTTP GET - Retrieves multiple news articles by their IDs.
 * Frontend fetches specific articles for detailed view or bookmarks.
 * Efficient batch retrieval for user's saved or selected news.
 * 
 * @route GET /news/batch?ids=1,2,3
 * @param {Request} req - Express request with comma-separated IDs in query
 * @param {Response} res - Express response object
 * @returns {Array} News articles matching the provided IDs
 */
const getNewsfromIdList = async (req, res) => {
  try {
    const response = await NewsService.getNewsfromIdList(
      req.query.ids,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'getNewsfromIdList',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
  }
};

/**
 * HTTP GET - Retrieves all news articles bookmarked by a specific user.
 * Users view their favorites news.
 * 
 * @route GET /news/owner/:id
 * @param {Request} req - Express request with owner ID in params
 * @param {Response} res - Express response object
 * @returns {Array} All news articles authored by the specified user
 */
const getNewsfromOwner = async (req, res) => {
  try {
    const response = await NewsService.getNewsfromOwner(
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'getNewsfromOwner',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves country news excluding articles bookmarked from a specific user.
 * Users discover news from other community members, hiding their own favorites bookmarks.
 * 
 * @route GET /news/country/filtered?owner=userId&country=FR
 * @param {Request} req - Express request with owner and country in query params
 * @param {Response} res - Express response object
 * @returns {Array} Country news excluding the specified user's articles
 */
const getNewsfromCountryWithoutUserNews = async (req, res) => {
  try {
    const response = await NewsService.getNewsfromCountryWithoutUserNews(
      req.query.owner,
      req.query.country,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'getNewsfromCountryWithoutUserNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Permanently removes a news article.
 * Only article author or admin can delete. Removes content from all feeds.
 * 
 * @route DELETE /news/:id
 * @param {Request} req - Express request with news ID in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteNews = async (req, res) => {
  try {
    const response = await NewsService.deleteNews(
      req.params.id,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink server', {
      from: 'deleteNews',
      data: error.message,
      username: req.user?.username
    });
    res.status(500).send({ error: error.message });
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
