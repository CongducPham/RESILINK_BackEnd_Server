require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const ContractService = require("../services/ContractService.js");

const _pathContractODEP = config.PATH_ODEP_CONTRACT;

const createContract = async (req, res) => {
    try {
      const response = await ContractService.createContract(_pathContractODEP, req.body, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      updateDataODEP.error('Catched error', { from: 'createContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const getAllContract = async (req, res) => {
    try {
      const response = await ContractService.getAllContract(_pathContractODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const getOwnerContractOngoing = async (req, res) => {
  try {
    const response = await ContractService.getOwnerContractOngoing(_pathContractODEP, req.header('Authorization') ?? "");
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOwnerContractOngoing', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message});
  }
};

const getOneContract = async (req, res) => {
    try {
      const response = await ContractService.getOneContract(_pathContractODEP, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getOneContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const getContractFromOwner = async (req, res) => {
    try {
      const response = await ContractService.getContractFromOwner(_pathContractODEP, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getContractFromOwner', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const patchMeasurableByTimeContract = async (req, res) => {
    try {
      const response = await ContractService.patchMeasurableByTimeContract(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchMeasurableByTimeContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const patchMeasurableByQuantityContract = async (req, res) => {
    try {
      const response = await ContractService.patchMeasurableByQuantityContract(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchMeasurableByQuantityContract', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

const patchContractCancel = async (req, res) => {
    try {
      const response = await ContractService.patchContractCancel(_pathContractODEP, req.body, req.params.id, req.header('Authorization') ?? "");
      res.status(response[1]).send(response[0]);
    } catch (error) {
      patchDataODEP.error('Catched error', { from: 'patchContractCancel', data: error.message, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message});
    }
}

module.exports = {
    createContract,
    getOneContract,
    getAllContract,
    getOwnerContractOngoing,
    getContractFromOwner,
    patchMeasurableByTimeContract,
    patchMeasurableByQuantityContract,
    patchContractCancel,
}