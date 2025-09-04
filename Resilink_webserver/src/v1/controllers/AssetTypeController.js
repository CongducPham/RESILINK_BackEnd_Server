require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const assettypeService = require("../services/AssetTypeService.js");
const _pathassetTypesODEP = config.PATH_ODEP_ASSETTYPE; 

const createAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.createAssetTypes(_pathassetTypesODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Error accessing ODEP', { from: 'createAssetTypes', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const getAllAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypes(_pathassetTypesODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getAllAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const getAllAssetTypesDev = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypesDev(_pathassetTypesODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getAllAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const getOneAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.getOneAssetTypes(_pathassetTypesODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Error accessing ODEP', { from: 'getOneAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const putAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.putAssetTypes(_pathassetTypesODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Error accessing ODEP', { from: 'putAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const deleteAssetTypes = async (req, res) => { 
  try {
      const response = await assettypeService.deleteAssetTypes(_pathassetTypesODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Error accessing ODEP', { from: 'deleteAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

const getAllAssetTypesResilink = async (req, res) => { 
  try {
      const response = await assettypeService.getAllAssetTypesResilink(req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      deleteDataODEP.error('Error accessing ODEP', { from: 'deleteAssetTypes', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
};

module.exports = {
    createAssetTypes,
    getAllAssetTypes,
    getAllAssetTypesDev,
    getOneAssetTypes,
    putAssetTypes,
    deleteAssetTypes,
    getAllAssetTypesResilink
}