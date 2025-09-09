require('../loggers.js');
const config = require('../config.js');
const winston = require('winston');
const userService = require("../services/UserService.js");

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');

const pathUserODEP = config.PATH_ODEP_USER + 'users/';

const getTokenUser = async (req, res) => {
    try {
      const response = await userService.functionGetTokenUser(req.body);
      res.status(response[1]).send(response[0]);
    } catch (error) {
      getDataLogger.error('Catched error', { from: 'getTokenUser', data: error, bodySent: req.body});
      res.status(500).send({message: error.message})
    }
};

const createUser = async (req, res) => {
  try {
    const response = await userService.createUser(req.body, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'createUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const deleteUser = async (req, res) => {
  try {
    const response = await userService.deleteUser(req.params.userId, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'deleteUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getUserById = async (req, res) => {
  try {
    const response = await userService.getUserById(req.params.userId, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'getUserById', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getAllUser = async (req, res) => {
  try {
    const response = await userService.getAllUser(req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'getAllUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getUserByEmail = async (req, res) => {
  try {
    const response = await userService.getUserByEmail(req.params.userEmail, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'getUserByEmail', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const getUserByUsername = async (req, res) => {
  try {
    const response = await userService.getUserByUsername(req.params.userName, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'getUserByUsername', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

const updateUser = async (req, res) => {
  try {
    const response = await userService.updateUser(req.params.userId, req.body, req.header('Authorization'));
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataODEP.error('Catched error', { from: 'updateUser', data: error, tokenUsed: req.header('Authorization') != null ? req.header('Authorization') : "token not found"});
    res.status(500).send({message: error.message})
  }
}

  module.exports = {
    getTokenUser,
    createUser,
    deleteUser,
    getUserById,
    getAllUser,
    getUserByEmail,
    getUserByUsername,
    updateUser,
};
  