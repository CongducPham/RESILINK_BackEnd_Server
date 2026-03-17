require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataLogger = winston.loggers.get('UpdateDataResilinkLogger');
const deleteDataLogger = winston.loggers.get('DeleteDataResilinkLogger');

const RegisteredServersService = require("../services/RegisteredServersService.js");

/**
 * HTTP POST - Registers a new RESILINK server instance in the local registry.
 * Admin users add newly deployed servers to enable federation.
 * Allows user-specific server discovery and federation preferences.
 * 
 * @route POST /registeredservers
 * @param {Request} req - Express request with server details (name, URL) in body
 * @param {Response} res - Express response object
 * @returns {Object} Created server registration with connection details
 */
const createRegisteredServer = async (req, res) => {
  try {
    const response = await RegisteredServersService.createRegisteredServer(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error creating registered server', {
      from: 'createRegisteredServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP POST - Registers a server in the global directory.
 * Platform-wide server registry visible to all users.
 * Enables automatic discovery of RESILINK ecosystem servers.
 * 
 * @route POST /registeredservers/global
 * @param {Request} req - Express request with server details in body
 * @param {Response} res - Express response object
 * @returns {Object} Created global server registration
 */
const createGlobalRegisteredServer = async (req, res) => {
  try {
    const response = await RegisteredServersService.createGlobalRegisteredServer(req.body, req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error creating registered server', {
      from: 'createRegisteredServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all locally registered RESILINK servers.
 * Returns server list configured for this instance.
 * Used by federation engine to query external marketplaces.
 * 
 * @route GET /registeredservers
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} List of locally registered servers with endpoints
 */
const getAllRegisteredServers = async (req, res) => {
  try {
    const response = await RegisteredServersService.getAllRegisteredServers(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving registered servers', {
      from: 'getAllRegisteredServers',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves all globally registered RESILINK servers.
 * Returns complete ecosystem directory available to all users.
 * Users browse and select servers to add to their favorites.
 * 
 * @route GET /registeredservers/global
 * @param {Request} req - Express request with authenticated user
 * @param {Response} res - Express response object
 * @returns {Array} Global directory of RESILINK servers
 */
const getAllGlobalRegisteredServers = async (req, res) => {
  try {
    const response = await RegisteredServersService.getAllGlobalRegisteredServers(req.user);
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving registered servers', {
      from: 'getAllRegisteredServers',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP GET - Retrieves details for a specific registered server.
 * Returns connection URL, status, and availability for federation.
 * Used to verify server health before querying for offers.
 * 
 * @route GET /registeredservers/:serverName
 * @param {Request} req - Express request with server name in params
 * @param {Response} res - Express response object
 * @returns {Object} Detailed server registration information
 */
const getRegisteredServerByName = async (req, res) => {
  try {
    const response = await RegisteredServersService.getRegisteredServerByName(
      req.params.serverName,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    getDataLogger.error('Error retrieving registered server by name', {
      from: 'getRegisteredServerByName',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP PUT - Updates an existing server registration.
 * Admin modifies server URL, status, or configuration parameters.
 * Used when servers migrate or update their endpoints.
 * 
 * @route PUT /registeredservers/:serverName
 * @param {Request} req - Express request with server name in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Object} Updated server registration or error if unauthorized
 */
const updateRegisteredServer = async (req, res) => {
  try {
    const response = await RegisteredServersService.updateRegisteredServer(
      req.params.serverName,
      req.body,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    updateDataLogger.error('Error updating registered server', {
      from: 'updateRegisteredServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

/**
 * HTTP DELETE - Removes a server from the registry.
 * Admin decommissions offline or deprecated servers.
 * Prevents federation attempts to unreachable endpoints.
 * 
 * @route DELETE /registeredservers/:serverName
 * @param {Request} req - Express request with server name in params
 * @param {Response} res - Express response object
 * @returns {Object} Deletion confirmation or error if unauthorized
 */
const deleteRegisteredServer = async (req, res) => {
  try {
    const response = await RegisteredServersService.deleteRegisteredServer(
      req.params.serverName,
      req.user
    );
    res.status(response[1]).send(response[0]);
  } catch (error) {
    deleteDataLogger.error('Error deleting registered server', {
      from: 'deleteRegisteredServer',
      error: error.message
    });
    res.status(500).send({ message: error.message });
  }
};

module.exports = {
  createRegisteredServer,
  createGlobalRegisteredServer,
  getAllRegisteredServers,
  getAllGlobalRegisteredServers,
  getRegisteredServerByName,
  updateRegisteredServer,
  deleteRegisteredServer
};
