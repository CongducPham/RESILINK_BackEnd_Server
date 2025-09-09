require('../loggers.js');
const { getDBError} = require('../errors.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

const OfferService = require("../services/OfferService.js");
const _pathofferODEP = config.PATH_ODEP_OFFER; 

const getAllOfferResilinkCustom = async (req, res) => { 
    try {
      const response = await OfferService.getAllOfferForResilinkCustom(req.header('Authorization'));
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getAllOfferResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
      res.status(500).send({message: error.message})
    }
};

const getSuggestedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getSuggestedOfferForResilinkCustom(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getSuggestedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

const getLimitedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getLimitedOfferForResilinkCustom(req.query.offerNbr, req.query.iteration, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getLimitedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};
const getBlockedOfferForResilinkCustom = async (req, res) => { 
  try {
    const response = await OfferService.getBlockedOfferForResilinkCustom(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getBlockedOfferForResilinkCustom', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

const getOfferFiltered = async (req, res) => {
  try {
    const response = await OfferService.getAllOfferFilteredCustom(req.body, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOfferFiltered', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

const getOfferOwner = async (req, res) => {
  try {
    const response = await OfferService.getAllOfferOwnerCustom(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOfferOwner', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
};

const createOffer = async (req, res) => {
  try {
    const response = await OfferService.createOffer(req.body, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const createOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.createOfferAsset(req.body, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getAllOffer = async (req, res) => {
  try {
    const response = await OfferService.getAllOffer(req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getAllOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getOwnerOfferPurchase = async (req, res) => {
  try {
    const response = await OfferService.getOwnerOfferPurchase(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Catched error', { from: 'getOwnerOfferPurchase', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getOneOffer = async (req, res) => {
  try {
    const response = await OfferService.getOneOffer(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    if (error instanceof getDBError) {
      res.status(404).send({message: error.message})
    } else {
      res.status(500).send({message: error.message})
    }
  }
}

const putOffer = async (req, res) => {
  try {
    const response = await OfferService.putOffer(req.body, req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'putOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const deleteOffer = async (req, res) => {
  try {
    const response = await OfferService.deleteOffer(req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataODEP.error('Catched error', { from: 'deleteOffer', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const putOfferAsset = async (req, res) => {
  try {
    const response = await OfferService.putOfferAsset(req.body, req.params.id, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'putOfferAsset', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization').replace(/^Bearer\s+/i, '') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

module.exports = {
    getAllOfferResilinkCustom,
    getLimitedOfferForResilinkCustom,
    getSuggestedOfferForResilinkCustom,
    getBlockedOfferForResilinkCustom,
    getOfferFiltered,
    getOfferOwner,
    getOwnerOfferPurchase,
    createOfferAsset,
    createOffer,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}