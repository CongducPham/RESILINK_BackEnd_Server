require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

const FavoriteServersDB = require("../database/FavoriteServersDB.js");

/**
 * Creates a favorite server list for a user in the RESILINK network.
 * Users can bookmark external RESILINK servers to aggregate offers from multiple sources.
 * Only admins or the list owner can create their favorite server configuration.
 * 
 * @param {Object} body - Favorite servers configuration (id, serverNames[])
 * @param {Object} user - Authenticated user creating the list
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const createFavoriteServers = async (body, user) => {
    try {
        const username = user.username;

        if (username !== "admin" && username !== body.id) {
            updateData.error("not admin or owner of favorite server list", { from: 'createFavoriteServers', username });
            return [{ message: "not admin or owner of favorite server list" }, 403];
        }

        await FavoriteServersDB.createFavoriteServers(body);

        getDataLogger.info("success creating FavoriteServers", {
            from: 'createFavoriteServers',
            username
        });

        return [{ message: `FavoriteServers created for ${body.username}` }, 200];
    } catch (e) {
        getDataLogger.error("error creating FavoriteServers", {
            from: 'createFavoriteServers',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Retrieves all favorite server lists configured in the platform.
 * Used for administrative oversight of cross-server federation preferences.
 * 
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [favoriteServerLists[], statusCode] tuple
 */
const getAllFavoriteServers = async (user) => {
    try {
        const username = user.username;
        const data = await FavoriteServersDB.getAllFavoriteServers();

        getDataLogger.info("success retrieving all FavoriteServers", {
            from: 'getAllFavoriteServers',
            username
        });

        return [data, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all FavoriteServers", {
            from: 'getAllFavoriteServers',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Retrieves the favorite server list for a specific user.
 * Contains URLs of trusted RESILINK servers for aggregated offer browsing.
 * 
 * @param {string} name - Username whose favorite servers to retrieve
 * @param {Object} user - Authenticated user making the request
 * @returns {Promise<Array>} - [favoriteServers{servers[]}, statusCode] tuple
 */
const getFavoriteServers = async (name, user) => {
    try {
        const username = user.username;
        const data = await FavoriteServersDB.getFavoriteServers(name);

        getDataLogger.info("success retrieving FavoriteServers for " + name, {
            from: 'getFavoriteServers',
            username
        });

        return [data, 200];
    } catch (e) {
        getDataLogger.error("error retrieving FavoriteServers", {
            from: 'getFavoriteServers',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Replaces the entire favorite server list for a user.
 * Only admins or the list owner can update their configuration.
 * This is a full replacement operation, not incremental.
 * 
 * @param {string} name - Username whose list to update
 * @param {Object} body - New complete server list configuration
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const updateFavoriteServers = async (name, body, user) => {
    try {
        const username = user.username;

        if (username !== "admin" && username !== name) {
            updateData.error("not admin or owner of favorite server list", {
                from: 'updateFavoriteServers',
                username
            });
            return [{ message: "not admin or owner of favorite server list" }, 403];
        }

        await FavoriteServersDB.updateFavoriteServers(name, body);

        updateData.info(`success updating FavoriteServers for ${name}`, {
            from: 'updateFavoriteServers',
            username
        });

        return [{ message: "update successful" }, 200];

    } catch (e) {
        updateData.error("error updating FavoriteServers", {
            from: 'updateFavoriteServers',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Adds a single server to a user's favorite list.
 * Incremental operation that appends without replacing existing favorites.
 * Only admins or the list owner can add servers.
 * 
 * @param {string} name - Username whose list to modify
 * @param {string} serverName - Server URL or identifier to add
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const addFavoriteServer = async (name, serverName, user) => {
    try {
        const username = user.username;

        if (username !== "admin" && username !== name) {
            updateData.error("not admin or owner of favorite server list", { from: 'addFavoriteServer', username });
            return [{ message: "not admin or owner of favorite server list" }, 403];
        }

        await FavoriteServersDB.addFavoriteServer(name, serverName);

        updateData.info(`success adding server ${serverName} for ${name}`, {
            from: 'addFavoriteServer',
            username
        });

        return [{ message: `Server ${serverName} added successfully` }, 200];

    } catch (e) {
        updateData.error("error adding server to FavoriteServers", {
            from: 'addFavoriteServer',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Removes a specific server from a user's favorite list.
 * Only admins or the list owner can remove servers.
 * 
 * @param {string} name - Username whose list to modify
 * @param {string} serverName - Server URL or identifier to remove
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const removeFavoriteServer = async (name, serverName, user) => {
    try {
        const username = user.username;

        if (username !== "admin" && username !== name) {
            deleteData.error("not admin or owner of favorite server list", { from: 'removeFavoriteServer', username });
            return [{ message: "not admin or owner of favorite server list" }, 403];
        }

        await FavoriteServersDB.removeFavoriteServer(name, serverName);

        deleteData.info(`success removing server ${serverName} for ${name}`, {
            from: 'removeFavoriteServer',
            username
        });

        return [{ message: `Server ${serverName} removed successfully` }, 200];

    } catch (e) {
        deleteData.error("error removing server from FavoriteServers", {
            from: 'removeFavoriteServer',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

/**
 * Permanently deletes the entire favorite server list for a user.
 * Only admins or the list owner can delete their configuration.
 * 
 * @param {string} name - Username whose favorite list to delete
 * @param {Object} user - Authenticated user (must be admin or owner)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteFavoriteServers = async (name, user) => {
    try {
        const username = user.username;

        if (username !== "admin" && username !== name) {
            deleteData.error("not admin or owner of favorite server list", {
                from: 'deleteFavoriteServers',
                username
            });
            return [{ message: "not admin or owner of favorite server list" }, 403];
        }

        await FavoriteServersDB.deleteFavoriteServers(name);

        deleteData.info("success deleting FavoriteServers for " + name, {
            from: 'deleteFavoriteServers',
            username
        });

        return [{ message: "delete successful" }, 200];
    } catch (e) {
        deleteData.error("error deleting FavoriteServers", {
            from: 'deleteFavoriteServers',
            error: e.message,
            username: user.username
        });
        throw e;
    }
};

module.exports = {
    createFavoriteServers,
    getAllFavoriteServers,
    getFavoriteServers,
    updateFavoriteServers,
    addFavoriteServer,
    removeFavoriteServer,
    deleteFavoriteServers
};