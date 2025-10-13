const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');
const cryptData = require("./CryptoDB.js");

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

// Creates an offer in RESILINK DB
const newOffer = async (id, transactionType, country) => {
    try {
      const _database = await connectToDatabase();
      const _collection = _database.collection('Offer');
  
      updateData.warn('before inserting data', { from: 'newOffer', data: {id: id, transactionType: transactionType, country: country ?? ""}});
      
      // Checks if an offer having the same id exists
      const existingOffer = await _collection.findOne({ id: id });
      if (existingOffer) {
        throw new InsertDBError(`Offer with id: ${id} already exists`);
      }
      
      // Inserts a document
      const offerCreated = await _collection.insertOne({
        "id": id,
        "transactionType": transactionType,
        "country": country ?? ""
      });

      if (offerCreated == null) {
        throw new InsertDBError(`offer with id: ${id} not created in local DB`)
      }  

      updateData.info('succes creating an offer in Resilink DB', { from: 'newOffer'});

    } catch (e) {
      if (e instanceof InsertDBError) {
        updateData.error('error creating an offer in Resilink DB', { from: 'newOffer', error: e.message});
      } else {
        connectDB.error('error connecting to DB', { from: 'newOffer', error: e.message});
      }
      throw e;
    }
};

// Deletes an offer by id in RESILINK DB
const deleteOffer = async (id) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('Offer');

    const result = await _collection.deleteOne({ id: id });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${id} successfully deleted`, { from: 'deleteOffer'});
    } else {
      throw new DeleteDBError();
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error delete offer in Resilink DB', { from: 'deleteOffer', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteOffer', error: e.message});
    }
    throw e;
  }
}

// Updates a user by id in RESILINK DB
const updateOffer = async (id, transactionType, country) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('Offer');

    updateData.warn('before updating data', { from: 'updateOffer', data: {transactionType: transactionType, country: country}});

    const result = await _collection.updateOne(
      { id: id },
      { $set: {
        transactionType: transactionType,
        country: country ?? ""
      }}
    );

    if (result.modifiedCount === 1) {
      updateData.info(`Document with id ${id} successfully updated`, { from: 'updateOffer'});
    } else {
      throw new UpdateDBError();
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating user in Resilink DB', { from: 'updateOffer', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'updateOffer', error: e.message});
    }
  }
}

// Retrieves a user by id in RESILINK DB
const getOffer = async (id, body) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('Offer');

    var offer = await _collection.findOne({ id: id });
    if (offer != null) {
      body['transactionType'] = offer.transactionType;
      body['country'] = offer.country;
    } else {
      body['transactionType'] = "";
      body['country'] = "";
    }

    getDataLogger.info('succes retrieving an offer in Resilink DB', { from: 'getOffer'});

  } catch (e) {
    if (e instanceof getDBError) {
      e.message = "Offer not found in the database"
      updateData.error('error retrieving an offer in Resilink DB', { from: 'getOffer', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getOffer', error: e.message});
    }
    throw e;
  }
}

// Retrieves all users in RESILINK DB
const getAllOffer = async (offerList) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('Offer');

    for (var i = 0; i < offerList.length; i++) {
      var offer = await _collection.findOne({ id : offerList[i].id });
      if (offer != null) {
        offerList[i].transactionType = offer.transactionType;
        offerList[i].country = offer.country
      } else {
        offerList[i].transactionType = "";
        offerList[i].country = "";
      }
    }

    getDataLogger.info('succes retrieving all offers in Resilink DB', { from: 'getAllOffer'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving all offers in Resilink DB', { from: 'getAllOffer', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllOffer', error: e.message});
    }
    throw e;
  }
}

module.exports = {
  newOffer,
  deleteOffer,
  updateOffer,
  getOffer,
  getAllOffer
}