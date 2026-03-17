require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

/**
 * Creates a regulator entity in ODEP.
 * Regulators are governance actors who oversee energy transactions and enforce compliance.
 * This operation is forwarded to ODEP for institutional record-keeping.
 * 
 * @param {string} url - ODEP regulator endpoint URL
 * @param {Object} body - Regulator details (name, jurisdiction, authority level, etc.)
 * @param {Object} user - Authenticated user creating the regulator
 * @returns {Promise<Array>} - [createdRegulator, statusCode] tuple
 */
const createRegulator = async (url, body, user) => {
  try {
    updateDataODEP.warn(
      'Payload sent to ODEP',
      { from: 'createRegulator', dataToSend: body, username: user?.username }
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: user.token
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.status === 401) {
      updateDataODEP.error('Unauthorized', {
        from: 'createRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      updateDataODEP.error('Error creating regulator', {
        from: 'createRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else {
      updateDataODEP.info('Regulator successfully created', {
        from: 'createRegulator',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('Unhandled error', {
      from: 'createRegulator',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Retrieves all regulators registered in ODEP.
 * Used for administrative monitoring and compliance tracking.
 * 
 * @param {string} url - ODEP regulators endpoint URL
 * @param {Object} user - Authenticated user requesting regulator list
 * @returns {Promise<Array>} - [regulators[], statusCode] tuple
 */
const getAllRegulator = async (url, user) => {
  try {
    const response = await fetch(`${url}all`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: user.token
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      getDataLogger.error('Unauthorized', {
        from: 'getAllRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      getDataLogger.error('Error retrieving regulators', {
        from: 'getAllRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else {
      getDataLogger.info('Successfully retrieved regulators', {
        from: 'getAllRegulator',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error', {
      from: 'getAllRegulator',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific regulator.
 * Includes jurisdiction, authority scope, and contact information.
 * 
 * @param {string} url - ODEP regulators endpoint URL
 * @param {string} id - Unique regulator identifier
 * @param {Object} user - Authenticated user requesting regulator details
 * @returns {Promise<Array>} - [regulator, statusCode] tuple
 */
const getOneRegulator = async (url, id, user) => {
  try {
    const response = await fetch(`${url}${id}/`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: user.token
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      getDataLogger.error('Unauthorized', {
        from: 'getOneRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      getDataLogger.error('Error retrieving regulator', {
        from: 'getOneRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else {
      getDataLogger.info('Successfully retrieved regulator', {
        from: 'getOneRegulator',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error', {
      from: 'getOneRegulator',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Updates regulator information via PATCH operation.
 * Allows partial updates to regulator fields (jurisdiction, authority, etc.).
 * 
 * @param {string} url - ODEP regulators endpoint URL
 * @param {Object} body - Partial update payload
 * @param {string} id - Regulator identifier to update
 * @param {Object} user - Authenticated user performing the update
 * @returns {Promise<Array>} - [updatedRegulator, statusCode] tuple
 */
const patchOneRegulator = async (url, body, id, user) => {
  try {
    patchDataODEP.warn(
      'Patch payload sent to ODEP',
      { from: 'patchOneRegulator', dataToSend: body, id, username: user?.username }
    );

    const response = await fetch(`${url}${id}/`, {
      method: 'PATCH',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: user.token
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.status === 401) {
      patchDataODEP.error('Unauthorized', {
        from: 'patchOneRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      patchDataODEP.error('Error patching regulator', {
        from: 'patchOneRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else {
      patchDataODEP.info('Regulator successfully patched', {
        from: 'patchOneRegulator',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    patchDataODEP.error('Unhandled error', {
      from: 'patchOneRegulator',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Permanently removes a regulator from ODEP.
 * WARNING: May affect compliance tracking and transaction oversight.
 * 
 * @param {string} url - ODEP regulators endpoint URL
 * @param {string} id - Regulator identifier to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [deleteResult, statusCode] tuple
 */
const deleteRegulator = async (url, id, user) => {
  try {
    deleteDataODEP.warn(
      'Regulator id sent to ODEP for deletion',
      { from: 'deleteRegulator', id, username: user?.username }
    );

    const response = await fetch(`${url}${id}/`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: user.token
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      deleteDataODEP.error('Unauthorized', {
        from: 'deleteRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      deleteDataODEP.error('Error deleting regulator', {
        from: 'deleteRegulator',
        dataReceived: data,
        username: user?.username
      });
    } else {
      deleteDataODEP.info('Regulator successfully deleted', {
        from: 'deleteRegulator',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    deleteDataODEP.error('Unhandled error', {
      from: 'deleteRegulator',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

module.exports = {
  createRegulator,
  getAllRegulator,
  getOneRegulator,
  patchOneRegulator,
  deleteRegulator
};
