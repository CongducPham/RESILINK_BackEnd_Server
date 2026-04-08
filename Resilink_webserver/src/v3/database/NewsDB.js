const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates a new news entry in the RESILINK database with an auto-incremented ID.
 * Uses a counters collection for atomic ID generation.
 *
 * @param {string} url - URL of the news article
 * @param {string} country - Country associated with the news
 * @param {string} institute - Publishing institution
 * @param {string} imgBase64 - Base64-encoded image for the news
 * @param {string} platform - Source platform of the news
 * @param {boolean} isPublic - Whether the news is publicly visible
 * @returns {Promise<Object>} - The created news document
 */
const createNews = async (url, country, institute, imgBase64, platform, isPublic) => {
  const db = await connectToDatabase();
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

    updateData.warn('before inserting data', { from: 'createNews', data: { url, country, institute, platform, isPublic } });

    const newsDocument = {
      _id: nextId,
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

    updateData.info('success creating a news', { from: 'createNews', newsId: nextId });

    return newsDocument;

  } catch (e) {
    // Duplicate key protection.
    if (e.code === 11000) {
      throw new InsertDBError("Duplicate news id detected");
    }

    if (e instanceof InsertDBError) {
      updateData.error('error creating a news', { from: 'createNews', error: e.message });
    } else {
      connectDB.error('error connecting to DB', { from: 'createNews', error: e.message });
    }
    throw e;
  }
};

/**
 * Updates an existing news entry by its ID in the RESILINK database.
 * Removes the _id field from the body to prevent overwrite.
 *
 * @param {string} id - The news document ID
 * @param {Object} body - Fields to update on the news document
 * @returns {Promise<void>} - Resolves when the news is updated
 */
const updateNews = async (id, body) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('News');

    // Remove any “_id” key from the body to avoid using it in the update    
    if (body.hasOwnProperty('_id')) {
      delete body._id;
    }

    updateData.warn('before updating news', { from: 'updateNews', data: body });

    // Update fields in the 'News' collection
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
 * Retrieves all news entries for a given country from the RESILINK database.
 *
 * @param {string} country - Country name to filter news by
 * @returns {Promise<Array<Object>>} - Array of news documents for that country
 */
const getNewsfromCountry = async (country) => {
    try {
        const _database = await connectToDatabase();
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
 * Retrieves all news entries from the RESILINK database regardless of country.
 *
 * @param {string} country - Unused parameter (kept for signature compatibility)
 * @returns {Promise<Array<Object>>} - Array of all news documents
 */
const getAllNews = async (country) => {
  try {
      const _database = await connectToDatabase();
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
 * Retrieves country news excluding entries whose IDs appear in the provided list.
 * Used to show only news not yet bookmarked by the requesting user.
 *
 * @param {string} country - Country name to filter news by
 * @param {Array<string>} IdList - List of news IDs to exclude
 * @returns {Promise<Array<Object>>} - Filtered array of news documents
 */
const getNewsfromCountryWithoutUserNews = async (country, IdList) => {
  try {
      const db = await connectToDatabase();
      const _collection = db.collection('News');

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
 * Retrieves news entries matching a list of IDs from the RESILINK database.
 *
 * @param {Array<string>|string} IdList - One or more news IDs to retrieve
 * @returns {Promise<Array<Object>>} - Array of matching news documents
 */
const getNewsfromIdList = async (IdList) => {
  try {
      const _database = await connectToDatabase();
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
 * Deletes a news entry by its ID from the RESILINK database.
 *
 * @param {string} NewsId - The news document ID to delete
 * @returns {Promise<Object>} - Confirmation message object
 */
const deleteNewsById = async (NewsId) => {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('News');

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