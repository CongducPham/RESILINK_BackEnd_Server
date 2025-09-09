const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

// Creates an offer in RESILINK DB 
const newOffer = async (body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');
    updateData.warn('before inserting data', { from: 'newOffer', data: body });

    const lastOffer = await _collection.find().sort({ offerId: -1 }).limit(1).toArray();

    if (lastOffer.length === 0) {
      body.offerId = 1;
    } else {
      body.offerId = lastOffer[0].offerId + 1;
    }

    // Insert an offer
    const offer = await _collection.insertOne(body);

    if (!offer) {
      throw new InsertDBError("Offer not created in local DB");
    }  

    updateData.info('success creating an offer in Resilink DB', { from: 'newOffer' });
    return offer;
  } catch (e) {
    if (e instanceof InsertDBError) {
      updateData.error('error creating an offer in Resilink DB', { from: 'newOffer' });
    } else {
      connectDB.error('error connecting to DB', { from: 'newOffer', error: e });
    }
    throw e;
  }
};

// Retrieves all offers in RESILINK DB
const getAllOffers = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const result = await _collection.find({}).toArray();

    if (result == null) {
      throw new getDBError("Offers not found in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving all offers in Resilink DB', { from: 'getAllOffers' });
    }

    return result;
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving all offers in Resilink DB', { from: 'getAllOffers' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllOffers', error: e });
    }
    throw e;
  }
};

// Retrieves one offer
const getOneOffer = async (offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);
    const valueOffer = await _collection.findOne({ offerId: numericOfferId });

    if (valueOffer == null) {
      throw new getDBError("No offer with this ID was found");
    } 
    getDataLogger.info('success retrieving one offer in Resilink DB', { from: 'getOneOffer' });
    return valueOffer;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving one offer in Resilink DB', { from: 'getOneOffer' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getOneOffer', error: e });
    }
    throw e;
  }
};

// Deletes an offer by ID in RESILINK DB
const deleteOfferById = async (offerId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);
    const result = await _collection.deleteOne({ offerId: numericOfferId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${offerId} successfully deleted`, { from: 'deleteOfferById' });
    } else {
      deleteData.error('error deleting offer in Resilink DB', { from: 'deleteOfferById' });
      throw new DeleteDBError('Error deleting offer in Resilink DB');
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting offer in Resilink DB', { from: 'deleteOfferById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteOfferById', error: e });
    }
    throw e;
  }
};

// Updates an offer by ID in RESILINK DB
const updateOfferById = async (offerId, offer) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Offer');

    const numericOfferId = parseInt(offerId);

    const result = await _collection.updateOne(
      { offerId: numericOfferId },
      { $set: offer }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${offerId} successfully updated`, { from: 'updateOfferById' });
      } else {
        updateData.info(`Document with ID ${offerId} found but value unchanged`, { from: 'updateOfferById' });
      }
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${offerId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating offer in Resilink DB', { from: 'updateOfferById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateOfferById', error: e });
    }
    throw e;
  }
};

module.exports = {
  newOffer,
  getAllOffers,
  getOneOffer,
  deleteOfferById,
  updateOfferById
};
