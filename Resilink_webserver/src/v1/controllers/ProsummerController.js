require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const prosummerService = require("../services/ProsummerService.js");
const pathUserODEP = config.PATH_ODEP_USER + 'users/';
const _pathProsumerODEP = config.PATH_ODEP_PROSUMER;

const createProsumer = async (req, res) => { 
  try {
    const response = await prosummerService.createProsummer(_pathProsumerODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const getAllProsummer = async (req, res) => { 
  try {
    const response = await prosummerService.getAllProsummer(_pathProsumerODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const createProsumerCustom = async (req, res) => {
  try {
    const response = await prosummerService.createProsumerCustom(_pathProsumerODEP, pathUserODEP, req.body, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createProsumerCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
}
  
const getAllProsummerCustom = async (req, res) => { 
  try {
    const response = await prosummerService.getAllProsummerCustom(_pathProsumerODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllProsummerCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};
  
const getOneProsumer = async (req, res) => {
  try {
    const response = await prosummerService.getOneProsummer(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOneProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const getOneProsummerCustom = async (req, res) => {
  try {
    const response = await prosummerService.getOneProsummerCustom(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOneProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};
  
const deleteOneProsummer = async (req, res) => {
  try {
    const response = await prosummerService.deleteOneProsummer(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOneProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const putUserProsumerPersonnalData = async (req, res) => {
  try {
    const response = await prosummerService.updateUserProsumerCustom(pathUserODEP ,req.body, req.params.prosumerId, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'putUserProsumerPersonnalData', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const patchBalanceProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBalanceProsummer(_pathProsumerODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBalanceProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const patchActivityDomainProsummer = async (req, res) => {
  try {
    const response = await prosummerService.patchActivityDomainProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBalanceProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const patchSharingProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchSharingProsummer(_pathProsumerODEP, req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchSharingProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const patchBookmarkProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchBookmarkProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBookmarkProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const deleteIdBookmarkedList = async (req, res) => { 
  try {
    const response = await prosummerService.deleteIdBookmarkedList(req.query.owner, req.query.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink Database', { from: 'deleteIdBookmarkedList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const patchBlockedOfferProsumer = async (req, res) => {
  try {
    const response = await prosummerService.patchAddblockedOffersProsummer(req.body, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    patchDataODEP.error('Catched error', { from: 'patchBlockedOfferProsumer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const deleteIdBlockedOfferList = async (req, res) => { 
  try {
    const response = await prosummerService.deleteIdBlockedOffersList(req.query.owner, req.query.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error accessing Resilink Database', { from: 'deleteIdBlockedOfferList', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const deleteProsumerODEPRESILINK = async (req, res) => {
  try {
    const response = await prosummerService.deleteProsumerODEPRESILINK(_pathProsumerODEP, req.params.id, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOneProsummer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

module.exports = {
    getAllProsummer,
    getOneProsumer,
    getOneProsummerCustom,
    createProsumer,
    deleteOneProsummer,
    putUserProsumerPersonnalData,
    patchBalanceProsumer,
    patchSharingProsumer,
    patchActivityDomainProsummer,
    createProsumerCustom,
    getAllProsummerCustom,
    patchBookmarkProsumer,
    deleteIdBookmarkedList,
    patchBlockedOfferProsumer,
    deleteIdBlockedOfferList,
    deleteProsumerODEPRESILINK
};
  