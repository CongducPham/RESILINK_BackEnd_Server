const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

const createNewRating = async (userId, rating) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('Rating');
  
      updateData.warn('before inserting data', { from: 'createNewRating', data: {userId, rating}});
      const existingDocument = await _collection.findOne({ userId: userId });

      if (existingDocument === null) {
        const newRating = await _collection.insertOne({
          "userId": userId,
          "rating": rating
        });

        if (newRating == null) {
          throw new InsertDBError("create rating failed");
        }

        updateData.info('success adding a Rating', { from: 'createNewRating' });

        return newRating;
      } else {
        throw new InsertDBError("user already had a rating");
      }      
    } catch (e) {
      if (e instanceof InsertDBError) {
        updateData.error('error adding a Rating', { from: 'createNewRating', error: e });
      } else {
        connectDB.error('error connecting to DB', { from: 'createNewRating', error: e });
      }
      throw e;
    }
};

const updateRating = async (userId, Rating) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('Rating');
  
      updateData.warn('before updating rating', { from: 'updateRating', data: {userId, Rating} });
  
      const result = await _collection.updateOne(
        { "userId": userId },
        { $set: {"rating": Rating} } 
      );
  
      if (result.matchedCount === 0) {
        throw new Error(`No Rating found with userID ${userId}`);
      }
  
      if (result.modifiedCount === 0) {
        throw new Error(`no update made with userId ${userId}`);
      }
  
      updateData.info('success updating Rating', { from: 'updateRating', updatedData: Rating });
  
    } catch (e) {
      updateData.error('error updating Rating', { from: 'updateRating', error: e.message });
      throw e;
    }
}; 

// Retrieves all Rating
const getAllRating = async () => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('Rating');
  
        const result = await _collection.find({}).toArray();
    
        if (result == null) {
          throw new getDBError("no rating in DB")
        }
        
        getDataLogger.info('succes retrieving all ratings', { from: 'getAllRating'});
  
        return result;
      } catch (e) {
        if (e instanceof getDBError) {
          getDataLogger.error('error retrieving all ratings', { from: 'getAllRating'});
        } else {
          connectDB.error('error connecting to DB', { from: 'getAllRating',  error: e});
        }
        throw(e);
      }
  };

  // Retrieves a user rating
const getRatingByUserId = async (userId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Rating');

      const result = await _collection.findOne({ userId: userId });
      if (result == null) {
        return {"message": "no rating found for this user"};
      }
      
      getDataLogger.info('succes retrieving user rating', { from: 'getRatingByUserId'});

      return result;
    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving user rating', { from: 'getRatingByUserId'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getRatingByUserId',  error: e});
      }
      throw(e);
    }
};

// Deletes a Rating by userId 
const deleteRatingByUserId = async (userId) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('Rating');
  
      const numericUserId = parseInt(userId);
      const result = await _collection.deleteOne({ userId: numericUserId });
  
      if (result.deletedCount === 1) {
        deleteData.info(`Document by userID ${NewsId} successfully deleted`, { from: 'deleteRatingByUserId' });
        return {message: `Rating by userID ${NewsId} successfully deleted`};
      } else {
        deleteData.error('error deleting Rating', { from: 'deleteRatingByUserId' });
        throw new DeleteDBError('error deleting Rating');
      }
  
    } catch (e) {
      if (e instanceof DeleteDBError) {
        deleteData.error('error deleting Rating', { from: 'deleteRatingByUserId' });
      } else {
        connectDB.error('error connecting to DB', { from: 'deleteRatingByUserId', error: e });
      }
      throw e.message;
    }
};

module.exports = {
  createNewRating,
  getRatingByUserId,
  getAllRating,
  updateRating,
  deleteRatingByUserId
}