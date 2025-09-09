const { getDBError, InsertDBError, DeleteDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

const createNews = async (url, country, institute, imgBase64, platform, public) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('News');

    const lastNews = await _collection.find().toArray();

    lastNews.sort((a, b) => parseInt(b._id) - parseInt(a._id));
    
    const latestNews = lastNews[0];

    var nextId = 1;

        if (lastNews.length !== 0) {
          const lastId = parseInt(lastNews[0]._id);
          nextId += lastId
        }

    updateData.warn('before inserting data', { from: 'newNews', data: {url, country, institute, imgBase64, platform, public}});

    // Insert an News with its imgpath. Can be empty if default image from mobile app selected
    const news = await _collection.insertOne({
      "_id": nextId.toString(),
      "url": url,
      "country": country,
      "institute": institute,
      "img": imgBase64,
      "platform": platform,
      "public": public
    });

    if (!news) {
      throw new InsertDBError("news not created in local DB");
    }  

    updateData.info('success creating a news', { from: 'createNews' });

    return {
      "_id": nextId.toString(),
      "url": url,
      "country": country,
      "institute": institute,
      "img": imgBase64,
      "platform": platform,
      "public": public
    };
  } catch (e) {
    if (e instanceof InsertDBError) {
      updateData.error('error creating a news', { from: 'createNews' });
    } else {
      connectDB.error('error connecting to DB', { from: 'createNews', error: e });
    }
    throw e;
  }
};

const updateNews = async (id, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('News');

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

// Retrieves the news account by a country 
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

// Retrieves all news
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

// Retrieves a country's news account without those subscribed by the user from the RESILINK database.
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

// Retrieves the news account by an id list 
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

// Deletes an News by id 
const deleteNewsById = async (NewsId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('News');

    const numericNewsId = parseInt(NewsId);
    const result = await _collection.deleteOne({ _id: numericNewsId });

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