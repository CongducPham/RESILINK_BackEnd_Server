require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataODEP = winston.loggers.get('DeleteDataODEPLogger');

/**
 * Creates a new request in ODEP.
 * Requests represent prosumers' needs for specific resources or services.
 * Complements the offer system by enabling demand-side marketplace participation.
 * 
 * @param {string} url - ODEP requests endpoint URL
 * @param {Object} body - Request details (requester, asset type, quantity, terms)
 * @param {Object} user - Authenticated user creating the request
 * @returns {Promise<Array>} - [createdRequest, statusCode] tuple
 */
const createRequest = async (url, body, user) => {
  try {
    updateDataODEP.warn('Payload sent to ODEP', {
      from: 'createRequest',
      dataToSend: body,
      username: user?.username
    });

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
        from: 'createRequest',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      updateDataODEP.error('Error creating request', {
        from: 'createRequest',
        dataReceived: data,
        username: user?.username
      });
    } else {
      updateDataODEP.info('Request successfully created', {
        from: 'createRequest',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('Unhandled error', {
      from: 'createRequest',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific request.
 * Includes request status, terms, and matching offers if available.
 * 
 * @param {string} url - ODEP requests endpoint URL
 * @param {string} id - Unique request identifier
 * @param {Object} user - Authenticated user requesting details
 * @returns {Promise<Array>} - [request, statusCode] tuple
 */
const getOneRequest = async (url, id, user) => {
  try {
    const response = await fetch(`${url}${id}`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: user.token
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      getDataLogger.error('Unauthorized', {
        from: 'getOneRequest',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      getDataLogger.error('Error retrieving request', {
        from: 'getOneRequest',
        dataReceived: data,
        username: user?.username
      });
    } else {
      getDataLogger.info('Request successfully retrieved', {
        from: 'getOneRequest',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error', {
      from: 'getOneRequest',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Retrieves all requests registered in ODEP.
 * Used for marketplace matching algorithms and administrative monitoring.
 * 
 * @param {string} url - ODEP requests endpoint URL
 * @param {Object} user - Authenticated user requesting list
 * @returns {Promise<Array>} - [requests[], statusCode] tuple
 */
const getAllRequest = async (url, user) => {
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
        from: 'getAllRequest',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      getDataLogger.error('Error retrieving requests', {
        from: 'getAllRequest',
        dataReceived: data,
        username: user?.username
      });
    } else {
      getDataLogger.info('Requests successfully retrieved', {
        from: 'getAllRequest',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error', {
      from: 'getAllRequest',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Updates an existing request in ODEP.
 * Allows modification of request terms, quantity, or validity period.
 * 
 * @param {string} url - ODEP requests endpoint URL
 * @param {Object} body - Updated request fields
 * @param {string} id - Request identifier to update
 * @param {Object} user - Authenticated user performing the update
 * @returns {Promise<Array>} - [updatedRequest, statusCode] tuple
 */
const putRequest = async (url, body, id, user) => {
  try {
    updateDataODEP.warn('Payload sent to ODEP', {
      from: 'putRequest',
      dataToSend: body,
      username: user?.username
    });

    const response = await fetch(`${url}${id}`, {
      method: 'PUT',
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
        from: 'putRequest',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      updateDataODEP.error('Error updating request', {
        from: 'putRequest',
        dataReceived: data,
        username: user?.username
      });
    } else {
      updateDataODEP.info('Request successfully updated', {
        from: 'putRequest',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('Unhandled error', {
      from: 'putRequest',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Permanently deletes a request from ODEP.
 * Typically used when request is fulfilled or no longer needed.
 * 
 * @param {string} url - ODEP requests endpoint URL
 * @param {string} id - Request identifier to delete
 * @param {Object} user - Authenticated user performing deletion
 * @returns {Promise<Array>} - [deleteResult, statusCode] tuple
 */
const deleteRequest = async (url, id, user) => {
  try {
    deleteDataODEP.warn('Request id sent to ODEP for deletion', {
      from: 'deleteRequest',
      id,
      username: user?.username
    });

    const response = await fetch(`${url}${id}`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        Authorization: user.token
      }
    });

    const data = await response.json();

    if (response.status === 401) {
      deleteDataODEP.error('Unauthorized', {
        from: 'deleteRequest',
        dataReceived: data,
        username: user?.username
      });
    } else if (!response.ok) {
      deleteDataODEP.error('Error deleting request', {
        from: 'deleteRequest',
        dataReceived: data,
        username: user?.username
      });
    } else {
      deleteDataODEP.info('Request successfully deleted', {
        from: 'deleteRequest',
        username: user?.username
      });
    }

    return [data, response.status];
  } catch (e) {
    deleteDataODEP.error('Unhandled error', {
      from: 'deleteRequest',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

module.exports = {
  createRequest,
  getOneRequest,
  getAllRequest,
  putRequest,
  deleteRequest
};
