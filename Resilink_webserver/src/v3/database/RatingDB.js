const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates a new rating entry for a user in the RESILINK local database.
 * Throws an error if the user already has a rating.
 *
 * @param {string} userId - The user ID to associate the rating with
 * @param {number} rating - The rating value
 * @returns {Promise<Object>} - The inserted rating document
 */
const createNewRating = async (userId, rating) => {
    try {
      const db = await connectToDatabase();
      const _collection = db.collection('Rating');
  
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

/**
 * Updates the rating value for a user by their user ID in the RESILINK local database.
 *
 * @param {string} userId - The user ID whose rating to update
 * @param {number} Rating - The new rating value
 * @returns {Promise<void>} - Resolves when the rating is updated
 */
const updateRating = async (userId, Rating) => {
    try {
      const db = await connectToDatabase();
      const _collection = db.collection('Rating');
  
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

/**
 * Retrieves all rating entries from the RESILINK local database.
 *
 * @returns {Promise<Array<Object>>} - Array of all rating documents
 */
const getAllRating = async () => {
    try {
        const _database = await connectToDatabase();
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

/**
 * Retrieves the rating entry for a specific user by their user ID.
 * Returns a message object if no rating is found.
 *
 * @param {string} userId - The user ID to look up
 * @returns {Promise<Object>} - The rating document or a not-found message
 */
const getRatingByUserId = async (userId) => {
  try {
      const _database = await connectToDatabase();
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

/**
 * Deletes a rating entry by the user ID from the RESILINK local database.
 *
 * @param {string} userId - The user ID whose rating to delete
 * @returns {Promise<Object>} - Confirmation message object
 */
const deleteRatingByUserId = async (userId) => {
    try {
      const db = await connectToDatabase();
      const _collection = db.collection('Rating');
  
      const result = await _collection.deleteOne({ userId: userId });
  
      if (result.deletedCount === 1) {
        deleteData.info(`Document by userID ${userId} successfully deleted`, { from: 'deleteRatingByUserId' });
        return {message: `Rating by userID ${userId} successfully deleted`};
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