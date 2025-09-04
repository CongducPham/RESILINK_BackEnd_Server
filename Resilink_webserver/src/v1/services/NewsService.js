require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const NewsDB = require("../database/NewsDB.js");
const ProsumerDB = require("../database/ProsummerDB.js");
const Utils = require("./Utils.js");

//Create a news 
const createNews = async (body, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'createNews', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        }
        const dataFinal = await NewsDB.createNews(body['url'] ?? "", body['country'], body['institute'] ?? "", body['img'] ?? "", body['platform'] ?? "", body['public'] ?? "true");
        updateDataODEP.info("success creating a news", {from: 'createNews', username: tokenUsername});
        return [dataFinal, 200];
    } catch (e) {
        updateDataODEP.error("error creating a news", {from: 'createNews', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

const createPersonnalNews = async (username, body, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null && tokenUsername != username) {
            getDataLogger.error("token is not registered", {from: 'createPersonnalNews', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        } else if (body["public"] !== "true" && body["public"] !== "false") {
            updateDataODEP.error("the “public” key does not have the value “true” or “false”.", {from: 'createPersonnalNews', userName: tokenUsername});
            return [{message: "the “public” key does not have the value “true” or “false”."}, 404];
        } 
        const dataFinal = await NewsDB.createNews(body['url'] ?? "", body['country'] ?? "", body['institute'] ?? "", body['img'] ?? "", body['platform'] ?? "", body['public'] ?? "true");
        await ProsumerDB.addbookmarked(username, dataFinal["_id"]);
        updateDataODEP.info("News created and successfully added to user's favorites.", {from: 'createPersonnalNews', userName: tokenUsername});
        return [{message: "News created and successfully added to user's favorites."}, 200];
    } catch (e) {
        updateDataODEP.error("error creating a news", {from: 'createPersonnalNews', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Update a news 
const updateNews = async (id, body, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'updateNews', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        } else if (Object.keys(body).length !== 5 && (body['url'] === null || body['img'] === null || body['country'] === null || body['institute'] === null || body['platform'] === null)) {
            return [{message: "body is not conform"}, 404]
        };
        await NewsDB.updateNews(id, body);
        updateDataODEP.info("success updating a news", {from: 'updateNews', userName: tokenUsername});
        return [{'message': 'successfull in updating the news ' + id}, 200];
    } catch (e) {
        updateDataODEP.error("error updating a news", {from: 'updateNews', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Delete a news 
const deleteNews = async (newsId, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'deleteNews', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        }
        const dataFinal = await NewsDB.deleteNewsById(newsId);
        deleteDataODEP.info("success creating a news", {from: 'deleteNews', userName: tokenUsername});
        return [dataFinal, 200];
    } catch (e) {
        deleteDataODEP.error("error creating a news", {from: 'deleteNews', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Retrieves all news 
const getAllNews = async (Country, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'getAllNews', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        }
        const dataFinal = await NewsDB.getAllNews(Country);
        getDataLogger.info("success retrieving all news from a country", {from: 'getNewsfromCountry', userName: tokenUsername});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from a country", {from: 'getNewsfromCountry', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Retrieves all news by country 
const getNewsfromCountry = async (Country, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'getNewsfromCountry', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        }
        const dataFinal = await NewsDB.getNewsfromCountry(Country);
        getDataLogger.info("success retrieving all news from a country", {from: 'getNewsfromCountry', userName: tokenUsername});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from a country", {from: 'getNewsfromCountry', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Retrieves the news associated with the id list in parameter 
const getNewsfromIdList = async (ids, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'getNewsfromIdList', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        }
        const dataFinal = await NewsDB.getNewsfromIdList(ids);
        getDataLogger.info("success retrieving all news from a country", {from: 'getNewsfromIdList', userName: tokenUsername});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from a country", {from: 'getNewsfromIdList', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
};

//Retrieves all news in the book marked  list of a user
const getNewsfromOwner = async (owner, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'getNewsfromOwner', username: tokenUsername});
            return [{message: "token is not valid"}, 401];
        } else if (tokenUsername != owner) {
            getDataLogger.error("token is not associated with the owner", {from: 'getNewsfromOwner'});
            return [{message: "token is not associated with the owner"}, 401];
        }
        const prosumer = await ProsumerDB.getOneProsummerWithUsername(owner);
        if (prosumer.bookMarked.length === 0) {
            return [{NewsList: []}, 200];
        }
        const dataFinal = await NewsDB.getNewsfromIdList(prosumer.bookMarked);
        getDataLogger.info("success retrieving all news from an owner", {from: 'getNewsfromOwner', userName: tokenUsername});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from an owner", {from: 'getNewsfromOwner', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
        throw e;
    }
}; 

//Retrieves all news by country by excluding all news from a user's book marked list
const getNewsfromCountryWithoutUserNews = async (owner, country, token) => {
    try {
        const tokenUsername = Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, ''));
        if (tokenUsername == null) {
            getDataLogger.error("token is not registered", {from: 'getNewsfromCountryWithoutUserNews'});
            return [{message: "token is not valid"}, 401];
        }
        const prosumer = await ProsumerDB.getOneProsummerWithUsername(owner);
        var dataFinal;
        if (prosumer.bookMarked.length === 0) {
            dataFinal = await NewsDB.getNewsfromCountry(country);
        } else {
            dataFinal = await NewsDB.getNewsfromCountryWithoutUserNews(country, prosumer.bookMarked);
        }
        getDataLogger.info("success retrieving all news from an owner", {from: 'getNewsfromCountryWithoutUserNews', userName: tokenUsername});
        return [{NewsList: dataFinal}, 200];
    } catch (e) {
        getDataLogger.error("error retrieving all news from an owner", {from: 'getNewsfromCountryWithoutUserNews', dataReceiver: e, username: Utils.getUserIdFromToken(token.replace(/^Bearer\s+/i, '')) ?? "no user associated with the token"});
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