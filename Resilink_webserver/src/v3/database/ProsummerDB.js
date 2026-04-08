const { getDBError, UpdateDBError, InsertDBError, IDNotFoundError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger')

/**
 * Enriches a list of ODEP prosumer objects with RESILINK-specific data.
 * Mutates each prosumer in the list in place, adding bookMarked, location, blockedOffers, activityDomain, specificActivity.
 *
 * @param {Array<Object>} prosumerList - List of ODEP prosumer objects containing id fields
 * @returns {Promise<void>} - Resolves when all prosumers are enriched
 */
const getAllProsummer = async (prosumerList) => {
    try {
        const _database = await connectToDatabase();
        const _collection = _database.collection('prosumer');
    
        for (var i = 0; i < prosumerList.length; i++) {
          var prosumers = await _collection.findOne({ _id : prosumerList[i].id });
          if (prosumers != null) {
            prosumerList[i].bookMarked = prosumers.bookMarked;
            prosumerList[i].location = prosumers.location;
            prosumerList[i].blockedOffers = prosumers.blockedOffers ?? [];
            prosumerList[i].activityDomain = prosumers.activityDomain ?? "";
            prosumerList[i].specificActivity = prosumers.specificActivity ?? ""
          } else {
            prosumerList[i].bookMarked = [];
            prosumerList[i].location = "";
            prosumerList[i].blockedOffers = [];
            prosumerList[i].activityDomain = "";
            prosumerList[i].specificActivity = ""
          }
        }

        getDataLogger.info('succes retrieving all prosummers in Resilink DB', { from: 'getAllProsummer'});

    } catch (e) {
      connectDB.error('error connecting to DB', { from: 'getAllProsummer',  error: e});
      throw(e);
    }
};

/**
 * Enriches a single ODEP prosumer object with RESILINK-specific data.
 * Mutates the prosumer object in place with bookMarked, location, blockedOffers, activityDomain, specificActivity.
 *
 * @param {Object} prosumer - ODEP prosumer object containing an id field
 * @returns {Promise<Object|null>} - The RESILINK prosumer document (null if not found)
 */
const getOneProsummer = async (prosumer) => {
    try {
        const _database = await connectToDatabase();
        const _collection = _database.collection('prosumer');
    
        const prosumers = await _collection.findOne({ _id: prosumer.id });

        if (prosumers == null || prosumers.length === 0) {
          prosumer.bookMarked = [];
          prosumer.location = "";
          prosumer.blockedOffers = [];
          prosumer.activityDomain = "";
          prosumer.specificActivity = ""
        } else {
          prosumer.bookMarked = prosumers.bookMarked;
          prosumer.location = prosumers.location;
          prosumer.blockedOffers = prosumers.blockedOffers ?? [];
          prosumer.activityDomain = prosumers.activityDomain;
          prosumer.specificActivity = prosumers.specificActivity
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
 * Creates a new prosumer entry in the RESILINK local database.
 *
 * @param {string} id - The ODEP prosumer ID (used as _id)
 * @param {string} location - Geographic location of the prosumer
 * @param {string} activityDomain - Main activity domain of the prosumer
 * @param {string} specificActivity - Specific activity description
 * @returns {Promise<void>} - Resolves when the prosumer is created
 */
const newProsumer = async (id, location, activityDomain, specificActivity) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    updateData.info('data to insert', { from: 'newProsumer', _id: id, location: location, activityDomain: activityDomain, specificActivity: specificActivity});
    const prosumer = await _collection.insertOne({
      "_id": id,
      "bookMarked": [],
      "blockedOffers": [],
      "location": location,
      "activityDomain": activityDomain,
      "specificActivity": specificActivity
    });

    if (prosumer == null) {
      throw new InsertDBError("prosummer not created in local DB")
    }
    
    updateData.info('succes creating one prosummer in Resilink DB', { from: 'newProsumer'});

  } catch (e){
    if (e instanceof InsertDBError) {
      updateData.error('error creating one prosummer in Resilink DB', { from: 'newProsumer'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'newProsumer',  error: e});
    }
    throw(e);
  }
};

/**
 * Updates the activity domain field of a prosumer in the RESILINK local database.
 *
 * @param {string} prosumerId - The prosumer ID (_id)
 * @param {string} activityDomain - New activity domain value
 * @returns {Promise<void>} - Resolves when the field is updated
 */
const updateActivityDomain  = async (prosumerId, activityDomain) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the document to update the job
    const result = await _collection.updateOne(
      { "_id": prosumerId },
      { $set: { "activityDomain": activityDomain } }
    );

    if (result.matchedCount === 0) {
      throw new UpdateDBError("Prosumer not found");
    } else if (result.modifiedCount === 0) {
      updateData.info('The activityDomain value was the same, no update performed.', { from: 'updateActivityDomain' });
    } else {
      updateData.info('Success updating prosumer\'s activityDomain field', { from: 'updateActivityDomain' });
    }

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error updating activityDomain field in Resilink DB', { from: 'updateActivityDomain'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'updateActivityDomain',  error: e});
    }
    throw(e);
  }
};

/**
 * Updates the specific activity field of a prosumer in the RESILINK local database.
 *
 * @param {string} prosumerId - The prosumer ID
 * @param {string} specificActivity - New specific activity value
 * @returns {Promise<void>} - Resolves when the field is updated
 */
const updateSpecificActivity  = async (prosumerId, specificActivity) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the document to update the job
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
 * Updates the location field of a prosumer in the RESILINK local database.
 *
 * @param {string} prosumerId - The prosumer ID (_id)
 * @param {string} location - New location value
 * @returns {Promise<void>} - Resolves when the field is updated
 */
const updateLocation  = async (prosumerId, location) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Update the document to update the job
    const result = await _collection.updateOne(
      { "_id": prosumerId },
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
 * Adds a news ID to the bookMarked list of a prosumer in the RESILINK local database.
 * Throws an error if the ID is already in the list.
 *
 * @param {string} prosumerId - The prosumer ID (_id)
 * @param {string} newId - The news ID to add to the bookMarked list
 * @returns {Promise<void>} - Resolves when the ID is added
 */
const addbookmarked  = async (prosumerId, newId) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the bookMarked list
    const prosumer = await _collection.findOne({ "_id": prosumerId, "bookMarked": { $in: [newId] } });
    if (prosumer) {
      throw new IDNotFoundError(`ID ${newId} already does exist in prosumer's bookMarked field`);
    }

    // Update the document to add the new ID to the 'bookMarked' field
    const result = await _collection.updateOne(
      { "_id": prosumerId },
      { $push: { "bookMarked": newId } }
    );
    
    if (result.modifiedCount !== 1) {
      throw new UpdateDBError("Failed to update prosumer's bookMarked field");
    }

    updateData.info('Success adding new ID to prosumer\'s bookMarked field', { from: 'addBookmarked' });

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
 * Removes a news ID from the bookMarked list of a prosumer in the RESILINK local database.
 * Throws an error if the ID is not found in the list.
 *
 * @param {string} id - The news ID to remove
 * @param {string} owner - The prosumer ID (_id)
 * @returns {Promise<void>} - Resolves when the ID is removed
 */
const deleteBookmarkedId  = async (id, owner) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the bookMarked list
    const prosumer = await _collection.findOne({ "_id": owner, "bookMarked": { $in: [id] } });
    if (!prosumer) {
      throw new IDNotFoundError(`ID ${id} does not exist in prosumer's bookMarked field`);
    }

    // Update the document to remove the specified ID from the 'bookMarked' field
    const result = await _collection.updateOne(
      { "_id": owner },
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
 * Adds an offer ID to the blockedOffers list of a prosumer in the RESILINK local database.
 * Throws an error if the offer ID is already in the list.
 *
 * @param {string} prosumerId - The prosumer ID (_id)
 * @param {string} offerId - The offer ID to add to the blocked list
 * @returns {Promise<void>} - Resolves when the ID is added
 */
const addIdToBlockedOffers  = async (prosumerId, offerId) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the blockedOffers list
    const prosumer = await _collection.findOne({ "_id": prosumerId, "blockedOffers": { $in: [offerId] } });
    if (prosumer) {
      throw new IDNotFoundError(`ID ${offerId} already does exist in prosumer's bookMarked field`);
    }

    // Update the document to add the offer ID to the 'blockedOffers' field
    const result = await _collection.updateOne(
      { "_id": prosumerId },
      { $push: { "blockedOffers": offerId } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError("Failed to update prosumer's blockedOffers field");
    }

    updateData.info('Success adding new ID to prosumer\'s blockedOffers field', { from: 'addIdToBlockedOffers' });

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error creating one prosummer in Resilink DB', { from: 'addIdToBlockedOffers'});
    } else if (e instanceof IDNotFoundError) {
      updateData.error('id already exist in blockedOffers', { from: 'addIdToBlockedOffers'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'addIdToBlockedOffers',  error: e});
    }
    throw(e);
  }
};

/**
 * Retrieves the blocked offers list of a prosumer from the RESILINK local database.
 *
 * @param {string} prosumerId - The prosumer ID (_id)
 * @returns {Promise<Array<string>>} - Array of blocked offer IDs
 */
const getProsumerBlockedOffers  = async (prosumerId,) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the blockedOffers list
    const prosumer = await _collection.findOne({ "_id": prosumerId});
    if (!prosumer) {
      throw new IDNotFoundError(`Prosumer with ID ${offerId} does not exist`);
    }

    getDataLogger.info('Success retrievieng', { from: 'getProsumerBlockedOffers' });
    return prosumer.blockedOffers;

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
 * Retrieves a single prosumer by their username from the RESILINK local database.
 *
 * @param {string} prosumerName - The prosumer username (_id)
 * @returns {Promise<Object>} - The prosumer document
 */
const getOneProsummerWithUsername = async (prosumerName) => {
  try {
      const _database = await connectToDatabase();
      const _collection = _database.collection('prosumer');

      const prosumer = await _collection.findOne({ _id: prosumerName });

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
 * Removes an offer ID from the blockedOffers list of a prosumer in the RESILINK local database.
 * Throws an error if the offer ID is not found in the list.
 *
 * @param {string} id - The offer ID to remove
 * @param {string} owner - The prosumer ID (_id)
 * @returns {Promise<void>} - Resolves when the ID is removed
 */
const deleteBlockedOffersId  = async (id, owner) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the blockedOffers list
    const prosumer = await _collection.findOne({ "_id": owner, "blockedOffers": { $in: [id] } });
    if (!prosumer) {
      throw new IDNotFoundError(`ID ${id} does not exist in prosumer's blocked list`);
    }

    // Update the document to remove the specified ID from the 'blockOffers' field
    const result = await _collection.updateOne(
      { "_id": owner },
      { $pull: { "blockedOffers": id } }
    );

    if (result.modifiedCount !== 1) {
      throw new UpdateDBError("Failed to update prosumer's offers blocked list");
    }

    updateData.info('Success adding offer ID to prosumer\'s blocked list', { from: 'deleteBookmarkedId' });

  } catch (e){
    if (e instanceof UpdateDBError) {
      updateData.error('error deleting one offer in blocked list in Resilink DB', { from: 'deleteBookmarkedId'});
    } else if (e instanceof IDNotFoundError) {
      updateData.error('id does\' not exist in blocked list', { from: 'deleteBookmarkedId'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'deleteBookmarkedId',  error: e});
    }
    throw(e);
  }
};

/**
 * Checks whether a given offer ID exists in the blocked offers list of a prosumer.
 *
 * @param {string} id - The offer ID to check
 * @param {string} owner - The prosumer ID (_id)
 * @returns {Promise<boolean>} - True if the offer is blocked, false otherwise
 */
const checkIdInBlockedOffers  = async (id, owner) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    // Check if the ID exists in the blockedOffers list
    const prosumer = await _collection.findOne({ "_id": owner, "blockedOffers": { $in: [id] } });
    
    if (prosumer === null) {
      return false;
    } else {
      return true;
    }

  } catch (e){
    if (e instanceof IDNotFoundError) {
      updateData.error('id does\' not exist in bookmarklist', { from: 'deleteBookmarkedId'});
    } else {
      connectDB.error('error connecting to DB ', { from: 'deleteBookmarkedId',  error: e});
    }
    throw(e);
  }
};

/**
 * Deletes a prosumer entry from the RESILINK local database.
 *
 * @param {string} owner - The prosumer ID (_id) to delete
 * @returns {Promise<void>} - Resolves when the prosumer is deleted
 */
const deleteProsumerODEPRESILINK  = async (owner) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('prosumer');

    const prosumer = await _collection.deleteOne({ "_id": owner});

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
    updateActivityDomain,
    updateSpecificActivity,
    updateLocation,
    addbookmarked,
    deleteBookmarkedId,
    addIdToBlockedOffers,
    deleteBlockedOffersId,
    getProsumerBlockedOffers,
    deleteProsumerODEPRESILINK,
    checkIdInBlockedOffers
}