const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Handles persistence for news documents and filtered news retrieval.
 */

/**
 * Creates a new news document with an incremental string ID.
 * @param {string} url - News URL.
 * @param {string} country - Country associated with the news.
 * @param {string} institute - Source institute name.
 * @param {string} imgBase64 - Base64 encoded image.
 * @param {string} platform - Platform metadata.
 * @param {boolean} isPublic - Visibility flag.
 * @returns {Promise<Object>} Inserted news document.
 */
const createNews = async (url, country, institute, imgBase64, platform, isPublic) => {
  const db = await connectToDatabase.connectToDatabase();
  const newsCollection = db.collection('News');
  const countersCollection = db.collection('Counters');

  try {
    // Atomically increment the news counter.
    const counterResult = await countersCollection.findOneAndUpdate(
      { _id: "newsId" },
      { $inc: { seq: 1 } },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    const nextId = counterResult.seq.toString();

    updateData.warn('before inserting data', {
      from: 'createNews',
      data: { url, country, institute, platform, isPublic }
    });

    const newsDocument = {
      _id: nextId.toString(),
      url,
      country,
      institute,
      img: imgBase64,
      platform,
      public: isPublic,
      createdAt: new Date().toISOString()
    };

    const result = await newsCollection.insertOne(newsDocument);

    if (!result.acknowledged) {
      throw new InsertDBError("news not created in local DB");
    }

    updateData.info('success creating a news', {
      from: 'createNews',
      newsId: nextId
    });

    return newsDocument;

  } catch (e) {
    // Duplicate key protection.
    if (e.code === 11000) {
      throw new InsertDBError("Duplicate news id detected");
    }

    if (e instanceof InsertDBError) {
      updateData.error('error creating a news', {
        from: 'createNews',
        error: e.message
      });
    } else {
      connectDB.error('error connecting to DB', {
        from: 'createNews',
        error: e.message
      });
    }

    throw e;
  }
};

/**
 * Updates one news document by ID.
 * @param {string} id - News identifier.
 * @param {Object} body - Fields to update.
 * @returns {Promise<void>} Resolves when update completes.
 */
const updateNews = async (id, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('News');

    // Remove any `_id` key from body before update.
    if (body.hasOwnProperty('_id')) {
      delete body._id;
    }

    updateData.warn('before updating news', { from: 'updateNews', data: body });

    // Update fields in the News collection.
    const result = await _collection.updateOne(
      { "_id": id },
      { $set: body } 
    );

    if (result.matchedCount === 0) {
      throw new Error(`No news found with ID ${id}`);
    }

    if (result.modifiedCount === 0) {
      throw new Error(`no update made with id ${id} news`);
    }

    updateData.info('success updating news', { from: 'updateNews', updatedData: body });

  } catch (e) {
    updateData.error('error updating news', { from: 'updateNews', error: e.message });
    throw e;
  }
};

/**
 * Retrieves news by country.
 * @param {string} country - Country filter.
 * @returns {Promise<Array>} News list.
 */
const getNewsfromCountry = async (country) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('News');
  
        const result = await _collection.find({ country: country.charAt(0).toUpperCase() + country.slice(1).toLowerCase() }).toArray();
    
        if (result == null) {
          throw new getDBError("no News in DB")
        }
        
        getDataLogger.info('succes retrieving all news', { from: 'getNewsfromCountry'});

        return result;
    
      } catch (e) {
        if (e instanceof getDBError) {
          getDataLogger.error('error retrieving all news', { from: 'getNewsfromCountry'});
        } else {
          connectDB.error('error connecting to DB', { from: 'getNewsfromCountry',  error: e});
        }
        throw(e);
      }
};

/**
 * Retrieves all news documents.
 * @param {string} country - Unused parameter kept for signature compatibility.
 * @returns {Promise<Array>} News list.
 */
const getAllNews = async (country) => {
  try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('News');

      const result = await _collection.find({}).toArray();
  
      if (result == null) {
        throw new getDBError("no News in DB")
      }
      
      getDataLogger.info('succes retrieving all news', { from: 'getAllNews'});

      return result;
    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving all news', { from: 'getAllNews'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getAllNews',  error: e});
      }
      throw(e);
    }
};

/**
 * Retrieves news by country, excluding IDs already linked to a user.
 * @param {string} country - Country filter.
 * @param {Array} IdList - News IDs to exclude.
 * @returns {Promise<Array>} Filtered news list.
 */
const getNewsfromCountryWithoutUserNews = async (country, IdList) => {
  try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('News');

      const result = await _collection.find({ 
        country: country.charAt(0).toUpperCase() + country.slice(1).toLowerCase(),
        _id: { $nin: IdList } 
      }).toArray();
  
      if (result == null) {
        throw new getDBError("no News in DB")
      }
      
      getDataLogger.info('succes retrieving all news', { from: 'getNewsfromCountryWithoutUserNews'});

      return result;
  
    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving all news', { from: 'getNewsfromCountryWithoutUserNews'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getNewsfromCountryWithoutUserNews',  error: e});
      }
      throw(e);
    }
};

/**
 * Retrieves news documents by ID list.
 * @param {Array} IdList - Multiple IDs.
 * @returns {Promise<Array>} Matching news list.
 */
const getNewsfromIdList = async (IdList) => {
  try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('News');

      const result = await _collection.find({ _id: typeof IdList === 'string' ? IdList : { $in: IdList}}).toArray();

      if (result == null || (result.length === 0 && IdList.length === 0)) {
        throw new getDBError("no News in DB")
      }
      
      getDataLogger.info('succes retrieving all news', { from: 'getNewsfromIdList'});

      return result;
  
    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving all news', { from: 'getNewsfromIdList'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getNewsfromIdList',  error: e});
      }
      throw(e);
    }
};

/**
 * Deletes one news document by ID.
 * @param {string} NewsId - News identifier.
 * @returns {Promise<Object>} Deletion status message.
 */
const deleteNewsById = async (NewsId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('News');

    const result = await _collection.deleteOne({ _id: NewsId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${NewsId} successfully deleted`, { from: 'deleteNewsById' });
      return {message: `news with ID ${NewsId} successfully deleted`};
    } else {
      deleteData.error('error deleting News', { from: 'deleteNewsById' });
      throw new DeleteDBError('error deleting News');
    }

  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting News', { from: 'deleteNewsById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteNewsById', error: e });
    }
    throw e.message;
  }
};

module.exports = {
  createNews,
  updateNews,
  getAllNews,
  getNewsfromCountry,
  getNewsfromIdList,
  getNewsfromCountryWithoutUserNews,
  deleteNewsById
}