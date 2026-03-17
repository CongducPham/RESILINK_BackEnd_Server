require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const patchDataODEP = winston.loggers.get('PatchDataODEPLogger');

const Utils = require("./Utils.js");
const Assets = require("./AssetService.js");
const AssetTypes = require("./AssetTypeService.js");

/**
 * Creates a new contract between prosumers in the RESILINK ecosystem.
 * Contracts formalize agreements for asset transactions (sale/purchase or rental).
 * This operation is forwarded to ODEP for blockchain/ledger persistence.
 * 
 * @param {string} url - ODEP contract endpoint URL
 * @param {Object} body - Contract details (parties, asset, terms, pricing)
 * @param {Object} user - Authenticated user creating the contract
 * @returns {Promise<Array>} - [createdContract, statusCode] tuple
 */
const createContract = async (url, body, user) => {
  const { token, username } = user;

  try {
    updateDataODEP.warn('Sending contract creation request to ODEP', {
      from: 'createContract',
      dataToSend: body,
      username
    });

    const response = await Utils.fetchJSONData(
      'POST',
      url,
      {
        accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: token
      },
      body
    );

    const data = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      updateDataODEP.error('Error while creating contract', {
        from: 'createContract',
        dataReceived: data,
        username
      });
    } else {
      updateDataODEP.info('Contract successfully created', {
        from: 'createContract',
        username
      });
    }

    return [data, response.status];
  } catch (e) {
    updateDataODEP.error('Unhandled error while creating contract', {
      from: 'createContract',
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Retrieves all contracts registered in ODEP.
 * Used for administrative monitoring and global contract analytics.
 * 
 * @param {string} url - ODEP contracts endpoint URL
 * @param {Object} user - Authenticated user requesting contracts
 * @returns {Promise<Array>} - [contracts[], statusCode] tuple
 */
const getAllContract = async (url, user) => {
  const { token, username } = user;

  try {
    const response = await Utils.fetchJSONData(
      'GET',
      `${url}all`,
      {
        accept: 'application/json',
        Authorization: token
      }
    );

    const data = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      getDataLogger.error('Error retrieving all contracts', {
        from: 'getAllContract',
        dataReceived: data,
        username
      });
    } else {
      getDataLogger.info('All contracts successfully retrieved', {
        from: 'getAllContract',
        username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error while retrieving all contracts', {
      from: 'getAllContract',
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific contract.
 * Includes contract state, parties, asset details, and transaction history.
 * 
 * @param {string} url - ODEP contracts endpoint URL
 * @param {string} id - Unique contract identifier
 * @param {Object} user - Authenticated user requesting contract details
 * @returns {Promise<Array>} - [contract, statusCode] tuple
 */
const getOneContract = async (url, id, user) => {
  const { token, username } = user;

  try {
    const response = await Utils.fetchJSONData(
      'GET',
      `${url}${id}`,
      {
        accept: 'application/json',
        Authorization: token
      }
    );

    const data = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      getDataLogger.error('Error retrieving contract', {
        from: 'getOneContract',
        contractId: id,
        dataReceived: data,
        username
      });
    } else {
      getDataLogger.info('Contract successfully retrieved', {
        from: 'getOneContract',
        contractId: id,
        username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error while retrieving contract', {
      from: 'getOneContract',
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Retrieves all contracts created by a specific prosumer.
 * Enables users to track their initiated transactions and manage active agreements.
 * 
 * @param {string} url - ODEP contracts endpoint URL
 * @param {string} id - Owner/creator user identifier
 * @param {Object} user - Authenticated user making the request
 * @returns {Promise<Array>} - [contracts[], statusCode] tuple
 */
const getContractFromOwner = async (url, id, user) => {
  const { token, username } = user;

  try {
    const response = await Utils.fetchJSONData(
      'GET',
      `${url}owner/${id}`,
      {
        accept: 'application/json',
        Authorization: token
      }
    );

    const data = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      getDataLogger.error('Error retrieving owner contracts', {
        from: 'getContractFromOwner',
        ownerId: id,
        dataReceived: data,
        username
      });
    } else {
      getDataLogger.info('Owner contracts successfully retrieved', {
        from: 'getContractFromOwner',
        ownerId: id,
        username
      });
    }

    return [data, response.status];
  } catch (e) {
    getDataLogger.error('Unhandled error while retrieving owner contracts', {
      from: 'getContractFromOwner',
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Retrieves active (ongoing) contracts for a specific owner.
 * Filters out completed, cancelled, or failed contracts to show only active transactions.
 * Enriches results with asset type nature information for frontend display.
 * 
 * @param {string} url - ODEP contracts endpoint URL
 * @param {string} id - Owner user identifier
 * @param {Object} user - Authenticated user making the request
 * @returns {Promise<Array>} - [ongoingContracts[], statusCode] with enriched asset data
 */
const getOwnerContractOngoing = async (url, id, user) => {
  const { token, username } = user;

  try {
    const response = await Utils.fetchJSONData(
      'GET',
      `${url}owner/${id}`,
      {
        accept: 'application/json',
        Authorization: token
      }
    );

    const contracts = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      getDataLogger.error('Error retrieving owner contracts', {
        from: 'getOwnerContractOngoing',
        ownerId: id,
        dataReceived: contracts,
        username
      });
      return [contracts, response.status];
    }

    const allAssets = await Assets.getAllAssetResilink(token);
    const allAssetTypes = await AssetTypes.getAllAssetTypesResilink(token);

    const filteredContracts = contracts
      .filter(c =>
        ![
          'cancelled',
          'endOfConsumption',
          'assetReceivedByTheRequestor',
          'assetNotReceivedByTheRequestor',
          'assetNotReturnedToTheOfferer'
        ].includes(c.state)
      )
      .map(c => {
        const asset = allAssets[0][c.asset.toString()];
        const assetType = allAssetTypes[0][asset.assetType];
        c.nature = assetType.nature;
        return c;
      });

    getDataLogger.info('Ongoing contracts successfully retrieved', {
      from: 'getOwnerContractOngoing',
      ownerId: id,
      username
    });

    return [filteredContracts, 200];
  } catch (e) {
    getDataLogger.error('Unhandled error while retrieving ongoing contracts', {
      from: 'getOwnerContractOngoing',
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Generic PATCH handler for contract state transitions.
 * Centralizes contract update logic with configurable endpoint and cURL fallback.
 * Used for state changes like completion, cancellation, or confirmation steps.
 * 
 * @param {string} from - Calling function name for logging traceability
 * @param {string} endpoint - Full ODEP endpoint URL for the PATCH operation
 * @param {Object} body - State update payload
 * @param {Object} user - Authenticated user performing the update
 * @param {boolean} useCurl - If true, use cURL instead of fetch (for compatibility)
 * @returns {Promise<Array>} - [updatedContract, statusCode] tuple
 */
const patchContract = async (from, endpoint, body, user, useCurl = false) => {
  const { token, username } = user;

  try {
    patchDataODEP.warn('Sending patch request to ODEP', {
      from,
      dataToSend: body,
      username
    });

    const response = useCurl
      ? await Utils.executeCurl('PATCH', endpoint, {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token
        }, body)
      : await Utils.fetchJSONData('PATCH', endpoint, {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: token
        }, body);

    const data = await Utils.streamToJSON(response.body);

    if (response.status !== 200) {
      patchDataODEP.error('Error patching contract', {
        from,
        dataReceived: data,
        username
      });
    } else {
      patchDataODEP.info('Contract successfully patched', {
        from,
        username
      });
    }

    return [data, response.status];
  } catch (e) {
    patchDataODEP.error('Unhandled error while patching contract', {
      from,
      error: e.message,
      username
    });
    throw e;
  }
};

const patchContractImmaterial = (url, body, id, user) =>
  patchContract('patchContractImmaterial', `${url}immaterialContract/${id}`, body, user);

const patchContractMaterialPurchase = (url, body, id, user) =>
  patchContract('patchContractMaterialPurchase', `${url}purchaseMaterialContract/${id}`, body, user);

const patchContractMaterialRent = (url, body, id, user) =>
  patchContract('patchContractMaterialRent', `${url}rentMaterialContract/${id}`, body, user, true);

const patchContractCancel = (url, body, id, user) =>
  patchContract('patchContractCancel', `${url}cancelContract/${id}`, body, user);

module.exports = {
  createContract,
  getAllContract,
  getOneContract,
  getContractFromOwner,
  getOwnerContractOngoing,
  patchContractImmaterial,
  patchContractMaterialPurchase,
  patchContractMaterialRent,
  patchContractCancel
};
