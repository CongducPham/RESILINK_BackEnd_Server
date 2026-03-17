const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates a rating entry for one user.
 * @param {string} userId - User identifier.
 * @param {number} rating - Rating value.
 * @returns {Promise<Object>} MongoDB insert result.
 */
const createNewRating = async (userId, rating) => {
  const db = await connectToDatabase.connectToDatabase();
  const collection = db.collection('Rating');

  try {
    updateData.warn('before inserting data', {
      from: 'createNewRating',
      data: { userId, rating }
    });

    const result = await collection.insertOne({
      userId,
      rating,
      createdAt: new Date().toISOString()
    });

    if (!result.acknowledged) {
      throw new InsertDBError("create rating failed");
    }

    updateData.info('success adding a Rating', {
      from: 'createNewRating',
      userId
    });

    return result;

  } catch (e) {
    // Duplicate key error thrown by MongoDB when userId already exists.
    if (e.code === 11000) {
      throw new InsertDBError("user already has a rating");
    }

    if (e instanceof InsertDBError) {
      updateData.error('error adding a Rating', {
        from: 'createNewRating',
        error: e.message
      });
    } else {
      connectDB.error('error connecting to DB', {
        from: 'createNewRating',
        error: e.message
      });
    }

    throw e;
  }
};

/**
 * Updates a user rating value.
 * @param {string} userId - User identifier.
 * @param {number} Rating - Rating value.
 * @returns {Promise<void>} Resolves when update completes.
 */
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

/**
 * Retrieves all rating documents.
 * @returns {Promise<Array>} List of ratings.
 */
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

/**
 * Retrieves one user's rating.
 * @param {string} userId - User identifier.
 * @returns {Promise<Object>} Rating document or message object.
 */
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

/**
 * Deletes a rating by user ID.
 * @param {string} userId - User identifier.
 * @returns {Promise<Object>} Deletion status message.
 */
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