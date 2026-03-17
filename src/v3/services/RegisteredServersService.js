require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

const RegisteredServersDB = require("../database/RegisteredServersDB.js");
const config = require('../config.js');

/**
 * Registers a new RESILINK server in the local database.
 * Local registration maintains a directory of known servers for federation.
 * Use for servers this instance directly manages or monitors.
 * 
 * @param {Object} body - Server registration data (serverName, url, description, etc.)
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [successMessage, statusCode] tuple
 */
const createRegisteredServer = async (body, user) => {
  try {
    await RegisteredServersDB.newRegisteredServer(body);

    getDataLogger.info(
      'RegisteredServer successfully created',
      { from: 'createRegisteredServer', username: user?.username }
    );

    return [{ message: `RegisteredServer created: ${body.serverName}` }, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while creating RegisteredServer',
      { from: 'createRegisteredServer', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Registers this server in the global RESILINK central directory.
 * Enables discovery by other RESILINK instances for federated marketplace.
 * Requires valid RESILINK network key for authentication.
 * 
 * @param {Object} body - This server's registration data (serverName, url, capabilities)
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [successMessage, statusCode] or error if registration fails
 */
const createGlobalRegisteredServer = async (body, user) => {
  try {
    const response = await fetch(
      config.CENTRAL_SERVER_URL + 'v3/registeredservers',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'X-Resilink-Network-Key': config.RESILINK_NETWORK_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const dataFinal = await response.json();

    if (!response.ok) {
      getDataLogger.error(
        'Error adding this server to the global server',
        { from: 'createGlobalRegisteredServer', data: dataFinal, username: user?.username }
      );
      return [dataFinal, response.status];
    }

    getDataLogger.info(
      'Successfully adding this server to the global server',
      { from: 'createGlobalRegisteredServer', username: user?.username }
    );

    return [{ message: `RegisteredServer created: ${body.serverName}` }, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while creating RegisteredServer',
      { from: 'createRegisteredServer', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Retrieves all servers registered in the local database.
 * Returns the directory of known RESILINK servers managed by this instance.
 * 
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [registeredServers[], statusCode] with complete list
 */
const getAllRegisteredServers = async (user) => {
  try {
    const dataFinal = await RegisteredServersDB.getAllRegisteredServers();

    getDataLogger.info(
      'Successfully retrieved all RegisteredServers',
      { from: 'getAllRegisteredServers', username: user?.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving RegisteredServers',
      { from: 'getAllRegisteredServers', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Retrieves all RESILINK servers from the global central directory.
 * Discovers available servers across the RESILINK federation network.
 * Users can browse and add servers to their favorites from this list.
 * 
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [globalServers[], statusCode] from central registry
 */
const getAllGlobalRegisteredServers = async (user) => {
  try {
    const response = await fetch(
      config.CENTRAL_SERVER_URL + 'v3/registeredServers',
      {
        method: 'GET',
        headers: {
          accept: 'application/json'        
        }
      }
    );

    const dataFinal = await response.json();

    if (!response.ok) {
      getDataLogger.error(
        'Error retrieving global RegisteredServers',
        { from: 'getAllGlobalRegisteredServers', data: dataFinal, username: user?.username }
      );
      return [dataFinal, response.status];
    }

    getDataLogger.info(
      'Successfully retrieved global RegisteredServers',
      { from: 'getAllGlobalRegisteredServers', username: user?.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving global RegisteredServers',
      { from: 'getAllGlobalRegisteredServers', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific registered server.
 * Returns server metadata including URL, capabilities, and status.
 * 
 * @param {string} serverName - Server identifier/name to retrieve
 * @param {Object} user - Authenticated user
 * @returns {Promise<Array>} - [serverDetails, statusCode] tuple
 */
const getRegisteredServerByName = async (serverName, user) => {
  try {
    const dataFinal = await RegisteredServersDB.getRegisteredServer(serverName);

    getDataLogger.info(
      `Successfully retrieved RegisteredServer ${serverName}`,
      { from: 'getRegisteredServerByName', username: user?.username }
    );

    return [dataFinal, 200];
  } catch (e) {
    getDataLogger.error(
      'Error while retrieving RegisteredServer',
      { from: 'getRegisteredServerByName', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Updates information for a registered server.
 * Only administrators can modify server registry entries.
 * 
 * @param {string} serverName - Server identifier to update
 * @param {Object} body - Updated server information
 * @param {Object} user - Authenticated user (must be admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 401 if not admin
 */
const updateRegisteredServer = async (serverName, body, user) => {
  try {
    if (user.username !== 'admin') {
      updateData.error(
        'Unauthorized: only admin can update a registered server',
        { from: 'updateRegisteredServer', username: user?.username }
      );
      return [{ message: 'Only admin can update a registered server' }, 401];
    }

    await RegisteredServersDB.updateRegisteredServer(serverName, body);

    updateData.info(
      `RegisteredServer ${serverName} successfully updated`,
      { from: 'updateRegisteredServer', username: user?.username }
    );

    return [{ message: 'Update successful' }, 200];
  } catch (e) {
    updateData.error(
      'Error while updating RegisteredServer',
      { from: 'updateRegisteredServer', error: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Removes a server from the local registry.
 * Only administrators can delete server entries.
 * Does not affect the actual server, only removes it from this instance's directory.
 * 
 * @param {string} serverName - Server identifier to remove
 * @param {Object} user - Authenticated user (must be admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 401 if not admin
 */
const deleteRegisteredServer = async (serverName, user) => {
  try {
    if (user.username !== 'admin') {
      deleteData.error(
        'Unauthorized: only admin can delete a registered server',
        { from: 'deleteRegisteredServer', username: user?.username }
      );
      return [{ message: 'Only admin can delete a registered server' }, 401];
    }

    await RegisteredServersDB.deleteRegisteredServer(serverName);

    deleteData.info(
      `RegisteredServer ${serverName} successfully deleted`,
      { from: 'deleteRegisteredServer', username: user?.username }
    );

    return [{ message: 'Delete successful' }, 200];
  } catch (e) {
    deleteData.error(
      'Error while deleting RegisteredServer',
      { from: 'deleteRegisteredServer', error: e.message, username: user?.username }
    );
    throw e;
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
