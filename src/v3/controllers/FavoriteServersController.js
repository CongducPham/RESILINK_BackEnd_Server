require('../loggers.js');
const winston = require('winston');

const errorLogger = winston.loggers.get("ErrorLogger");
const FavoriteServersService = require("../services/FavoriteServersService.js");

/**
 * HTTP POST - Creates a new favorite servers list for a user.
 * Users can curate external RESILINK servers to aggregate offers from.
 * Enables cross-server marketplace federation for expanded trading opportunities.
 * 
 * @route POST /favoriteservers
 * @param {Request} req - Express request with username and server list in body
 * @param {Response} res - Express response object
 * @returns {Object} Created favorite servers configuration
 */
const createFavoriteServers = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.createFavoriteServers(req.body, req.user);
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error creating FavoriteServers", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP GET - Retrieves favorite servers configuration for a specific user.
 * Returns list of external servers the user wants to query for offers.
 * Used by aggregation engine to fetch federated marketplace data.
 * 
 * @route GET /favoriteservers/:username
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} User's favorite servers list and configuration
 */
const getFavoriteServers = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.getFavoriteServers(req.params.username, req.user);
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error retrieving FavoriteServers", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP GET - Retrieves all favorite server configurations from main server.
 * For monitoring external servers.
 * 
 * @route GET /favoriteservers
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Complete list of all users' favorite server configurations
 */
const getAllFavoriteServers = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.getAllFavoriteServers(req.user);
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error retrieving all FavoriteServers", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP PUT - Updates entire favorite servers list for a user.
 * Replaces existing configuration with new server list.
 * Users reconfigure which external servers to include in offer searches.
 * 
 * @route PUT /favoriteservers/:username
 * @param {Request} req - Express request with username in params and new server list in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated favorite servers configuration
 */
const updateFavoriteServers = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.updateFavoriteServers(
        req.params.username,
        req.body,
        req.user
      );
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error updating FavoriteServers", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP POST - Adds a single server to user's favorites list.
 * Incremental addition without replacing existing favorites.
 * Users discover and bookmark new RESILINK servers.
 * 
 * @route POST /favoriteservers/:username/add/:serverName
 * @param {Request} req - Express request with username and serverName in params
 * @param {Response} res - Express response object
 * @returns {Object} Updated favorites list with newly added server
 */
const addFavoriteServer = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.addFavoriteServer(
        req.params.username,
        req.params.serverName,
        req.user
      );
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error adding favorite server", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP DELETE - Removes a specific server from user's favorites list.
 * Users stop aggregating offers from an external server.
 * Maintains other favorites while removing one server.
 * 
 * @route DELETE /favoriteservers/:username/remove/:serverName
 * @param {Request} req - Express request with username and serverName in params
 * @param {Response} res - Express response object
 * @returns {Object} Updated favorites list without the removed server
 */
const removeFavoriteServer = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.removeFavoriteServer(
        req.params.username,
        req.params.serverName,
        req.user
      );
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error removing favorite server", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

/**
 * HTTP DELETE - Completely removes a user's favorite servers configuration.
 * User stops all external server federation and relies only on local offers.
 * Clears entire favorites list for the specified user.
 * 
 * @route DELETE /favoriteservers/:username
 * @param {Request} req - Express request with username in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation message
 */
const deleteFavoriteServers = async (req, res) => {
  try {
    const response =
      await FavoriteServersService.deleteFavoriteServers(
        req.params.username,
        req.user
      );
    return res.status(response[1]).json(response[0]);
  } catch (e) {
    errorLogger.error("Error deleting FavoriteServers", {
      from: "FavoriteServersController",
      error: e.message,
      username: req.user?.username
    });
    return res.status(500).json({ message: e.message });
  }
};

module.exports = {
  createFavoriteServers,
  getFavoriteServers,
  getAllFavoriteServers,
  updateFavoriteServers,
  addFavoriteServer,
  removeFavoriteServer,
  deleteFavoriteServers
};
