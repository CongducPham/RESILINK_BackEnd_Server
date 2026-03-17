require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const NewsDB = require("../database/NewsDB.js");
const ProsumerDB = require("../database/ProsummerDB.js");

/**
 * Creates a news item in the RESILINK platform.
 * News items inform users about energy policies, market updates, and platform announcements.
 * Can be country-specific or global, with optional institutional attribution.
 * 
 * @param {Object} body - News data (url, country, institute, img, platform, public)
 * @param {Object} user - Authenticated user creating the news
 * @returns {Promise<Array>} - [createdNews, statusCode] tuple
 */
const createNews = async (body, user) => {
    try {
        const username = user.username;
        const dataFinal = await NewsDB.createNews(body['url'] ?? "", body['country'], body['institute'] ?? "", body['img'] ?? "", body['platform'] ?? "");
        
        getDataLogger.info("success creating a news", {from: 'createNews', username});
        return [dataFinal, 200];
    } catch (e) {
        getDataLogger.error("error creating a news", {from: 'createNews', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Creates a personal news item and automatically bookmarks it for the user.
 * Personal news can be private or public, enabling users to curate custom content feeds.
 * Automatically adds the created news ID to the user's prosumer bookmarked list.
 * 
 * @param {string} username - Username of the prosumer creating the news
 * @param {Object} body - News data with required 'public' field ('true'/'false' string)
 * @param {Object} user - Authenticated user (must match username)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403/404 if invalid
 */
const createPersonnalNews = async (username, body, user) => {
    try {
        
        if (user.username !== username) {
            getDataLogger.error("not owner of the news", {from: 'createPersonnalNews', username: user.username});
            return [{message: "not owner of the news"}, 403];
        }
        
        if (body["public"] !== "true" && body["public"] !== "false") {
            updateDataODEP.error("the \"public\" key does not have the value \"true\" or \"false\".", {from: 'createPersonnalNews', userName: user.username});
            return [{message: "the \"public\" key does not have the value \"true\" or \"false\"."}, 404];
        } 
        
        const dataFinal = await NewsDB.createNews(body['url'] ?? "", body['country'] ?? "", body['institute'] ?? "", body['img'] ?? "", body['platform'] ?? "", body['public'] ?? "true");
        await ProsumerDB.addbookmarked(username, dataFinal["_id"]);
        
        getDataLogger.info("News created and successfully added to user's favorites.", {from: 'createPersonnalNews', userName: username});
        return [{message: "News created and successfully added to user's favorites."}, 200];
    } catch (e) {
        getDataLogger.error("error creating a news", {from: 'createPersonnalNews', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Updates an existing news item.
 * Requires complete payload with all 5 fields: url, img, country, institute, platform.
 * 
 * @param {string|number} id - News item identifier
 * @param {Object} body - Complete updated news data (all 5 fields required)
 * @param {Object} user - Authenticated user performing the update
 * @returns {Promise<Array>} - [successMessage, statusCode] or 404 if invalid body
 */
const updateNews = async (id, body, user) => {
    try {
        const username = user.username;
        
        if (Object.keys(body).length !== 5 && (body['url'] === null || body['img'] === null || body['country'] === null || body['institute'] === null || body['platform'] === null)) {
            return [{message: "body is not conform"}, 404]
        }
        
        await NewsDB.updateNews(id, body);
        
        updateDataODEP.info("success updating a news", {from: 'updateNews', username});
        return [{'message': 'successfull in updating the news ' + id}, 200];
    } catch (e) {
        updateDataODEP.error("error updating a news", {from: 'updateNews', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Permanently deletes a news item from the platform.
 * Note: Does not automatically remove from users' bookmarked lists.
 * 
 * @param {string|number} newsId - News item identifier to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [deletionResult, statusCode] tuple
 */
const deleteNews = async (newsId, user) => {
    try {
        const username = user.username;
        const dataFinal = await NewsDB.deleteNewsById(newsId);
        
        deleteDataODEP.info("success deleting a news", {from: 'deleteNews', username});
        return [dataFinal, 200];
    } catch (e) {
        deleteDataODEP.error("error deleting a news", {from: 'deleteNews', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Retrieves all news items, optionally filtered by country.
 * Used for global news feeds and country-specific information streams.
 * 
 * @param {string} Country - Optional country filter (returns all if not specified)
 * @param {Object} user - Authenticated user requesting news
 * @returns {Promise<Array>} - [{NewsList: []}, statusCode] tuple
 */
const getAllNews = async (Country, user) => {
    try {
        const username = user.username;
        const dataFinal = await NewsDB.getAllNews(Country);
        
        getDataLogger.info("success retrieving all news from a country", {from: 'getAllNews', username});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from a country", {from: 'getAllNews', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Retrieves news items from a specific country.
 * Enables localized news feeds for region-specific energy market information.
 * 
 * @param {string} Country - Country code or name to filter by
 * @param {Object} user - Authenticated user requesting news
 * @returns {Promise<Array>} - [{NewsList: []}, statusCode] tuple
 */
const getNewsfromCountry = async (Country, user) => {
    try {
        const username = user.username;
        const dataFinal = await NewsDB.getNewsfromCountry(Country);
        
        getDataLogger.info("success retrieving all news from a country", {from: 'getNewsfromCountry', username});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from a country", {from: 'getNewsfromCountry', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Retrieves multiple news items by their IDs.
 * Used to fetch bookmarked news for user's personalized feed.
 * 
 * @param {Array<string|number>} ids - Array of news item identifiers
 * @param {Object} user - Authenticated user requesting news
 * @returns {Promise<Array>} - [{NewsList: []}, statusCode] tuple
 */
const getNewsfromIdList = async (ids, user) => {
    try {
        const username = user.username;
        const dataFinal = await NewsDB.getNewsfromIdList(ids);
        
        getDataLogger.info("success retrieving all news from id list", {from: 'getNewsfromIdList', username});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from id list", {from: 'getNewsfromIdList', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Retrieves all news items bookmarked by a specific user.
 * Returns the user's personalized news feed based on their saved preferences.
 * Returns empty array if user has no bookmarked news.
 * 
 * @param {string} owner - Username whose bookmarked news to retrieve
 * @param {Object} user - Authenticated user making the request
 * @returns {Promise<Array>} - [{NewsList: []}, statusCode] tuple
 */
const getNewsfromOwner = async (owner, user) => {
    try {
        const username = user.username;
        const prosumer = await ProsumerDB.getOneProsummerWithUsername(owner);
        
        if (prosumer.bookMarked.length === 0) {
            return [{NewsList: []}, 200];
        }
        
        const dataFinal = await NewsDB.getNewsfromIdList(prosumer.bookMarked);
        
        getDataLogger.info("success retrieving all news from an owner", {from: 'getNewsfromOwner', username});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from an owner", {from: 'getNewsfromOwner', dataReceiver: e, username: user.username});
        throw e;
    }
};

/**
 * Retrieves country-specific news excluding items already bookmarked by the user.
 * Enables discovery of new country-relevant content without duplicating saved items.
 * Used for "Explore More" or "Discover" features in news feeds.
 * 
 * @param {string} owner - Username to exclude bookmarked news from
 * @param {string} country - Country code or name to filter by
 * @param {Object} user - Authenticated user making the request
 * @returns {Promise<Array>} - [{NewsList: []}, statusCode] with filtered results
 */
const getNewsfromCountryWithoutUserNews = async (owner, country, user) => {
    try {
        const username = user.username;
        const prosumer = await ProsumerDB.getOneProsummerWithUsername(owner);
        
        var dataFinal;
        if (prosumer.bookMarked.length === 0) {
            dataFinal = await NewsDB.getNewsfromCountry(country);
        } else {
            dataFinal = await NewsDB.getNewsfromCountryWithoutUserNews(country, prosumer.bookMarked);
        }
        
        getDataLogger.info("success retrieving all news from country without user news", {from: 'getNewsfromCountryWithoutUserNews', username});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from country without user news", {from: 'getNewsfromCountryWithoutUserNews', dataReceiver: e, username: user.username});
        throw e;
    }
}

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