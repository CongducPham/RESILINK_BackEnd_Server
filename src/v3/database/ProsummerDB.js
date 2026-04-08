const { getDBError, UpdateDBError, InsertDBError, IDNotFoundError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');
const config = require('../config.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger')

const encodeServerNameKey = (serverName) =>
  encodeURIComponent(String(serverName)).replaceAll('.', '%2E');

const decodeServerNameKey = (serverKey) =>
  decodeURIComponent(String(serverKey));

/**
 * Retrieves all prosumer documents.
 * @returns {Promise<Array>} List of prosumers.
 */
const getAllProsummer = async () => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('prosumer');
    
        const prosummerList = _collection.find().toArray();

        getDataLogger.info('succes retrieving all prosummers in Resilink DB', { from: 'getAllProsummer'});
        return prosummerList;

    } catch (e) {
      connectDB.error('error connecting to DB', { from: 'getAllProsummer',  error: e});
      throw(e);
    }
};

/**
 * Retrieves one prosumer by identifier.
 * @param {string} prosumer - Prosumer identifier.
 * @returns {Promise<Object>} Prosumer document.
 */
const getOneProsummer = async (prosumer) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('prosumer');
        const prosumers = await _collection.findOne({ id: prosumer });

        if (prosumers == null || prosumers.length === 0) {
          throw new getDBError("no prosummer found");
        } 
        getDataLogger.info('succes retrieving one prosummer in Resilink DB', { from: 'getOneProsummer'});
        return prosumers;

    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving one prosummer in Resilink DB', { from: 'getOneProsummer'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getOneProsummer',  error: e});
      }
      throw(e);
    }
}

/**
 * Retrieves one prosumer by username identifier.
 * @param {string} prosumerName - Prosumer username.
 * @returns {Promise<Object>} Prosumer document.
 */
const getOneProsummerWithUsername = async (prosumerName) => {
  try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('prosumer');
  
      const prosumer = await _collection.findOne({ id: prosumerName });

      if (prosumer == null || prosumer.length === 0) {
          throw new getDBError("no prosummer found");
      } 
      getDataLogger.info('succes retrieving one prosummer in Resilink DB', { from: 'getBookmarkedProsumer'});
      return prosumer;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving one prosummer in Resilink DB', { from: 'getBookmarkedProsumer'});
    } else {
      connectDB.error('error connecting to DB', { from: 'getBookmarkedProsumer',  error: e});
    }
    throw(e);
  }
}

/**
 * Retrieves the activity domain value for one prosumer.
 * @param {string} id - Prosumer identifier.
 * @returns {Promise<string>} Activity domain value.
 */
const getJobProsummer = async (id) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    var job;
    var prosummer = await _collection.findOne({ id: id });
    if (prosummer != null) {
      job = prosummer.job;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving prosummer\'s job in Resilink DB', { from: 'getJobProsummer'});
    return job;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving prosummer\'s job in Resilink DB', { from: 'getJobProsummer', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getJobProsummer', error: e.message});
    }
  }
}

/**
 * Creates a prosumer profile document.
 * @param {Object} body - Prosumer payload.
 * @returns {Promise<Object>} Inserted prosumer document.
 */
const newProsumer = async (body) => {
  const _database = await connectToDatabase.connectToDatabase();
  const _collection = _database.collection('prosumer');

  try {
    updateData.info('data to insert', {
      from: 'newProsumer',
      body
    });

    const prosumerDocument = {
      id: body.id,
      sharingAccount: body.sharingAccount,
      balance: body.balance,
      bookMarked: [],
      blockedOffers: { [encodeServerNameKey(config.SWAGGER_URL)]: [] },
      activityDomain: body.activityDomain ?? "",
      specificActivity: body.specificActivity ?? "",
      location: body.location ?? ""
    };

    const result = await _collection.insertOne(prosumerDocument);

    if (!result.acknowledged) {
      throw new InsertDBError('Prosumer not created in local DB');
    }

    updateData.info('success creating one prosumer in Resilink DB', {
      from: 'newProsumer',
      id: body.id
    });

    return prosumerDocument;

  } catch (e) {
    // Duplicate key error thrown by MongoDB.
    if (e.code === 11000) {
      throw new InsertDBError(`Prosumer with id ${body.id} already exists`);
    }

    connectDB.error('error connecting to DB', {
      from: 'newProsumer',
      error: e.message
    });

    throw e;
  }
};

/**
 * Increments a prosumer balance value.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {number} balance - Delta to apply.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateBalance  = async (prosumerId, balance) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the balance field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $inc: { "balance": balance } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The balance value was the same, no update performed.', { from: 'updateBalance' });
    } else {
      updateData.info('Success updating prosumer\'s balance field', { from: 'updateBalance' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating balance field in Resilink DB', { from: 'updateBalance'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateBalance',  error: e});
    }
    throw(e);
  }
};

/**
 * Increments a prosumer sharing account value.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {number} sharingAccount - Delta to apply.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateSharingAccount  = async (prosumerId, sharingAccount) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the sharingAccount field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $inc: { "sharingAccount": sharingAccount } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The sharingAccount value was the same, no update performed.', { from: 'updateSharingAccount' });
    } else {
      updateData.info('Success updating prosumer\'s sharingAccount field', { from: 'updateSharingAccount' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating sharingAccount field in Resilink DB', { from: 'updateSharingAccount'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateSharingAccount',  error: e});
    }
    throw(e);
  }
};

/**
 * Updates the activity domain value for one prosumer.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} job - Activity domain value.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateJob  = async (prosumerId, job) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the activityDomain field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $set: { "activityDomain": job } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The job value was the same, no update performed.', { from: 'updateJob' });
    } else {
      updateData.info('Success updating prosumer\'s joactivityDomainb field', { from: 'updateJob' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating activityDomain field in Resilink DB', { from: 'updateJob'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateJob',  error: e});
    }
    throw(e);
  }
};

/**
 * Updates the specific activity value for one prosumer.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} specificActivity - Specific activity value.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateSpecificActivity  = async (prosumerId, specificActivity) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the specificActivity field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $set: { "specificActivity": specificActivity } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The specificActivity value was the same, no update performed.', { from: 'updateSpecificActivity' });
    } else {
      updateData.info('Success updating prosumer\'s specificActivity field', { from: 'updateSpecificActivity' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating job field in Resilink DB', { from: 'updateSpecificActivity'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateSpecificActivity',  error: e});
    }
    throw(e);
  }
};

/**
 * Updates the location value for one prosumer.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} location - Location value.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateLocation  = async (prosumerId, location) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the location field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $set: { "location": location } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The location value was the same, no update performed.', { from: 'updateLocation' });
    } else {
      updateData.info('Success updating prosumer\'s location field', { from: 'updateLocation' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating location field in Resilink DB', { from: 'updateLocation'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateLocation',  error: e});
    }
    throw(e);
  }
};

/**
 * Adds one news ID to the prosumer bookmark list.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} newId - News identifier to add.
 * @returns {Promise<void>} Resolves when update completes.
 */
const addbookmarked  = async (prosumerId, newId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID already exists in the bookmark list.
    const prosumer = await _collection.findOne({ "id": prosumerId, "bookMarked": { $in: [newId] } });
    if (prosumer) {
      throw new IDNotFoundError(`ID ${newId} already does exist in prosumer's bookMarked field`);
    }

    // Add the new ID to the `bookMarked` field.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $push: { "bookMarked": newId } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError("Failed to update prosumer's bookMarked field");
    }

    updateData.info('Success adding new ID to prosumer\'s bookMarked field', { from: 'addBookmarked', idnews: newId, prosumer: prosumerId});

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error creating one prosummer in Resilink DB', { from: 'addbookmarked'});
    } else if (e instanceof IDNotFoundError) {
      updateData.error('id already exist in bookmarklist', { from: 'addbookmarked'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'addbookmarked',  error: e});
    }
    throw(e);
  }
};

/**
 * Removes one news ID from the prosumer bookmark list.
 * @param {string} id - News identifier to remove.
 * @param {string} owner - Prosumer identifier.
 * @returns {Promise<void>} Resolves when update completes.
 */
const deleteBookmarkedId  = async (id, owner) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the bookmark list.
    const prosumer = await _collection.findOne({ "id": owner, "bookMarked": { $in: [id] } });
    if (!prosumer) {
      throw new IDNotFoundError(`ID ${id} does not exist in prosumer's bookMarked field`);
    }

    // Remove the specified ID from `bookMarked`.
    const result = await _collection.updateOne(
      { "id": owner },
      { $pull: { "bookMarked": id } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError("Failed to update prosumer's bookMarked field");
    }

    updateData.info('Success adding new ID to prosumer\'s bookMarked field', { from: 'deleteBookmarkedId' });

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error creating one prosummer in Resilink DB', { from: 'deleteBookmarkedId'});
    } else if (e instanceof IDNotFoundError) {
      updateData.error('id does\' not exist in bookmarklist', { from: 'deleteBookmarkedId'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'deleteBookmarkedId',  error: e});
    }
    throw(e);
  }
};

/**
 * Adds an offer ID to a server-specific blocked-offer list.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} serverName - Server identifier.
 * @param {string} offerId - Offer ID to block.
 * @returns {Promise<void>} Resolves when update completes.
 */
const addBlockedOfferByServer = async (prosumerId, serverName, offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    const prosumer = await _collection.findOne({ "id": prosumerId });
    if (!prosumer) {
      throw new IDNotFoundError(`Prosumer with ID ${prosumerId} does not exist`);
    }

    // Check if offer is already blocked for this server.
    const encodedServerName = encodeServerNameKey(serverName);
    const serverKey = `blockedOffers.${encodedServerName}`;
    const existing = await _collection.findOne({
      "id": prosumerId,
      [serverKey]: offerId
    });

    if (existing) {
      throw new IDNotFoundError(`Offer ${offerId} already blocked for server ${serverName}`);
    }

    // Add offer to server blocked list.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $push: { [serverKey]: offerId } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError(`Failed to block offer ${offerId} for server ${serverName}`);
    }

    updateData.info('Success blocking offer by server', {
      from: 'addBlockedOfferByServer',
      prosumerId,
      serverName,
      offerId
    });

  } catch (e) {
    if (e instanceof UpdateDBError || e instanceof IDNotFoundError) {
      updateData.error(e.message, { from: 'addBlockedOfferByServer' });
    } else {
      connectDB.error('Database error', { from: 'addBlockedOfferByServer', error: e });
    }
    throw(e);
  }
};

/**
 * Retrieves the blocked offers structure for one prosumer.
 * @param {string} prosumerId - Prosumer identifier.
 * @returns {Promise<Object>} Blocked offers structure.
 */
const getProsumerBlockedOffers  = async (prosumerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Ensure prosumer exists before reading blocked offers.
    const prosumer = await _collection.findOne({ "id": prosumerId});
    if (!prosumer) {
      throw new IDNotFoundError(`Prosumer with ID ${prosumerId} does not exist`);
    }

    const blockedOffers = prosumer.blockedOffers;

    if (blockedOffers && typeof blockedOffers === 'object') {
      const decodedBlockedOffers = {};

      for (const [key, value] of Object.entries(blockedOffers)) {
        decodedBlockedOffers[decodeServerNameKey(key)] = value;
      }

      getDataLogger.info('Success retrieving blocked offers', { from: 'getProsumerBlockedOffers' });
      return decodedBlockedOffers;
    }

    getDataLogger.info('Success retrieving blocked offers', { from: 'getProsumerBlockedOffers' });
    return blockedOffers;

  } catch (e){
    if (e instanceof IDNotFoundError) {
      getDataLogger.error(e.message, { from: 'getProsumerBlockedOffers'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'getProsumerBlockedOffers',  error: e});
    }
    throw(e);
  }
};

/**
 * Retrieves blocked offers for a specific server.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} serverName - Server identifier.
 * @returns {Promise<Array>} Array of blocked offer IDs.
 */
const getBlockedOffersForServer = async (prosumerId, serverName) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    const prosumer = await _collection.findOne({ "id": prosumerId });
    if (!prosumer) {
      throw new IDNotFoundError(`Prosumer with ID ${prosumerId} does not exist`);
    }

    // Return server-specific blocked offers or empty array.
    const encodedServerName = encodeServerNameKey(serverName);
    const blockedOffers = prosumer.blockedOffers?.[encodedServerName] || [];

    getDataLogger.info('Success retrieving blocked offers for server', {
      from: 'getBlockedOffersForServer',
      prosumerId,
      serverName,
      count: blockedOffers.length
    });

    return blockedOffers;

  } catch (e) {
    if (e instanceof IDNotFoundError) {
      getDataLogger.error(e.message, { from: 'getBlockedOffersForServer' });
    } else {
      connectDB.error('Database error', { from: 'getBlockedOffersForServer', error: e });
    }
    throw(e);
  }
};

/**
 * Removes an offer ID from a server-specific blocked-offer list.
 * @param {string} prosumerId - Prosumer identifier.
 * @param {string} serverName - Server identifier.
 * @param {string} offerId - Offer ID to unblock.
 * @returns {Promise<void>} Resolves when update completes.
 */
const removeBlockedOfferByServer = async (prosumerId, serverName, offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    const prosumer = await _collection.findOne({ "id": prosumerId });
    if (!prosumer) {
      throw new IDNotFoundError(`Prosumer with ID ${prosumerId} does not exist`);
    }

    // Check if offer is blocked for this server.
    const encodedServerName = encodeServerNameKey(serverName);
    const serverKey = `blockedOffers.${encodedServerName}`;
    const existing = await _collection.findOne({
      "id": prosumerId,
      [serverKey]: offerId
    });

    if (!existing) {
      throw new IDNotFoundError(`Offer ${offerId} not blocked for server ${serverName}`);
    }

    // Remove offer from server blocked list.
    const result = await _collection.updateOne(
      { "id": prosumerId },
      { $pull: { [serverKey]: offerId } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError(`Failed to unblock offer ${offerId} for server ${serverName}`);
    }

    updateData.info('Success unblocking offer by server', {
      from: 'removeBlockedOfferByServer',
      prosumerId,
      serverName,
      offerId
    });

  } catch (e) {
    if (e instanceof UpdateDBError || e instanceof IDNotFoundError) {
      updateData.error(e.message, { from: 'removeBlockedOfferByServer' });
    } else {
      connectDB.error('Database error', { from: 'removeBlockedOfferByServer', error: e });
    }
    throw(e);
  }
};

/**
 * Checks whether the blockedOffers map contains an offer ID for the local server.
 * @param {string|number} id - Offer identifier.
 * @param {string} owner - Prosumer identifier.
 * @returns {Promise<boolean>} True when the offer is blocked.
 */
const checkIdInBlockedOffers  = async (id, owner) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the local server's blocked offers list.
    const localServerKey = `blockedOffers.${encodeServerNameKey(config.SWAGGER_URL)}`;
    const prosumer = await _collection.findOne({ "id": owner, [localServerKey]: { $in: [id] } });
    
    if (prosumer === null) {
      return false;
    } else {
      return true;
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error creating one prosummer in Resilink DB', { from: 'deleteBookmarkedId'});
    } else if (e instanceof IDNotFoundError) {
      updateData.error('id does\' not exist in bookmarklist', { from: 'deleteBookmarkedId'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'deleteBookmarkedId',  error: e});
    }
    throw(e);
  }
};

/**
 * Deletes one prosumer by identifier.
 * @param {string} owner - Prosumer identifier.
 * @returns {Promise<void>} Resolves when deletion completes.
 */
const deleteProsumerODEPRESILINK  = async (owner) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    const prosumer = await _collection.deleteOne({ "id": owner});

    if (prosumer.deletedCount === 1) {
      deleteData.info(`Document with ID ${owner} successfully deleted`, { from: 'deleteProsumerODEPRESILINK'});
    } else {
      throw new DeleteDBError('error deleting a prosumer in Resilink DB');
    }

  } catch (e){
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting one prosummer in Resilink DB', { from: 'deleteProsumerODEPRESILINK'});
    } else {
      deleteData.error('error connecting to DB ', { from: 'deleteProsumerODEPRESILINK',  error: e});
    }
    throw(e);
  }
};

module.exports = {
    getAllProsummer,
    newProsumer,
    getOneProsummer,
    getOneProsummerWithUsername,
    updateJob,
    updateSpecificActivity,
    updateBalance,
    updateSharingAccount,
    updateLocation,
    getJobProsummer,
    addbookmarked,
    deleteBookmarkedId,
    getProsumerBlockedOffers,
    deleteProsumerODEPRESILINK,
    checkIdInBlockedOffers,
    // Multi-server blocked offers functions
    addBlockedOfferByServer,
    getBlockedOffersForServer,
    removeBlockedOfferByServer
}