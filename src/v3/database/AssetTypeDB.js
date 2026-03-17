const { InsertDBError } = require('../errors.js'); 
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates or increments an AssetType counter entry.
 * @param {string} assetType - Asset type name to track.
 * @returns {Promise<string>} Concatenated key based on asset type and counter value.
 */
const newAssetTypeDBCounter = async (assetType) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('AssetTypeCounter');

      const existingDocument = await _collection.findOne({ assetType: assetType });
      updateData.warn('before inserting data', { from: 'newAssetTypeDB', data: assetType});

        if (existingDocument === null) {
            // Create a new document with the asset type.
            const ResultassetType = await _collection.insertOne({
                "assetType": assetType,
                "count": 1
            });
            if (ResultassetType == null) {
                throw InsertDBError("assetType not created in local DB")
            }  
            updateData.info('succes creating an assetType in Resilink DB', { from: 'newAssetTypeDB'});
            return `${assetType}1`;
        } else {
            // Update the document by incrementing the counter.
            const updatedDocument = await _collection.findOneAndUpdate(
                { assetType: assetType },
                { $inc: { count: 1 } }, 
                { returnDocument: 'after' } // Return the updated document.
            );
            if (updatedDocument == null) {
                throw new InsertDBError("assetType not created in local DB")
            };
            updateData.info('succes updating counter of an assetType in Resilink DB', { from: 'newAssetTypeDB'});

            return `${assetType}${updatedDocument["count"]}`; 
        }

    } catch (e) {
        if (e instanceof InsertDBError) {
            updateData.error('error creating/incrementing an assetType in Resilink DB', { from: 'newAssetTypeDB'});
        } else {
            connectDB.error('error connecting to DB', { from: 'newAssetTypeDB', error: e});
        }
        throw(e);
    }
};

/**
 * Creates a new asset type document.
 * @param {Object} body - Asset type payload.
 * @returns {Promise<Object>} Insert result.
 */
const newAssetType = async (body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('AssetType');

    if (body._id) {
      delete body._id;
    }

    const assetType = await _collection.insertOne({
      ...body,
      createdAt: new Date().toISOString()
    });

    if (!assetType.acknowledged) {
      throw new InsertDBError("assetType not created in local DB");
    }

    updateData.info('success creating one assetType in Resilink DB', {
      from: 'newAssetType',
      name: body.name
    });

    return assetType;

  } catch (e) {
    // Duplicate key error detected by MongoDB.
    if (e.code === 11000) {
      throw new InsertDBError(`AssetType "${body.name}" already exists`);
    }

    if (e instanceof InsertDBError) {
      updateData.error('error creating one assetType in Resilink DB', {
        from: 'newAssetType',
        error: e.message
      });
    } else {
      connectDB.error('error connecting to DB', {
        from: 'newAssetType',
        error: e
      });
    }

    throw e;
  }
};

/**
 * Retrieves all asset type documents.
 * @returns {Promise<Array>} List of asset types.
 */
const getAllAssetType = async () => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('AssetType');
    
        const assetTypeList = _collection.find().toArray();

        getDataLogger.info('succes retrieving all prosummers in Resilink DB', { from: 'getAllAssetType'});
        return assetTypeList;

    } catch (e) {
      connectDB.error('error connecting to DB', { from: 'getAllAssetType',  error: e});
      throw(e);
    }
};

/**
 * Retrieves one asset type by name.
 * @param {string} assetType - Asset type name.
 * @returns {Promise<Object|string>} Matching asset type document, or "0" when not found.
 */
const getOneAssetType = async (assetType) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('AssetType');
    
        const valueAssetType = await _collection.findOne({ name: assetType });

        if (valueAssetType == null || valueAssetType.length === 0) {
          return "0"; // Used by callers to explicitly detect missing asset types.
        } 
        getDataLogger.info('succes retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
        return valueAssetType;

    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getOneAssetType',  error: e});
      }
      throw(e);
    }
};

/**
 * Updates one asset type by name.
 * @param {string} id - Asset type name.
 * @param {Object} body - Fields to update.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const updateAssetType = async (id, body) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('AssetType');
  
      updateData.warn('before updating data', { from: 'updateAssetType', data: {phoneNumber: body.phoneNumber ?? ""}});
      
      const result = await _collection.updateOne(
        { name: id },
        { $set: body }
      );
  
      if (result.modifiedCount === 1) {
  
        updateData.info(`Document with username ${body.userName} successfully updated`, { from: 'updateAssetType'});
      } else {
        throw new UpdateDBError();
      }
    } catch (e) {
      if (e instanceof UpdateDBError) {
        updateData.error('error updating assetType in Resilink DB', { from: 'updateAssetType', error: e.message});
      } else {
        connectDB.error('error connecting to DB', { from: 'updateAssetType', error: e.message});
      }
      throw(e);
    }
}

/**
 * Deletes one asset type by name.
 * @param {string} assetType - Asset type name.
 * @returns {Promise<void>} Resolves when the deletion completes.
 */
const deleteAssetType  = async (assetType) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('AssetType');
  
      const prosumer = await _collection.deleteOne({ "name": assetType});
  
      if (prosumer.deletedCount === 1) {
        deleteData.info(`Document with name ${assetType} successfully deleted`, { from: 'deleteAssetType'});
      } else {
        throw new DeleteDBError('error deleting an assetType in Resilink DB');
      }
  
    } catch (e){
      if (e instanceof DeleteDBError) {
        deleteData.error('error deleting one assetType in Resilink DB', { from: 'deleteAssetType'});
      } else {
        deleteData.error('error connecting to DB ', { from: 'deleteAssetType',  error: e});
      }
      throw(e);
    }
};

module.exports = {
    newAssetTypeDBCounter,
    newAssetType,
    getAllAssetType,
    getOneAssetType,
    updateAssetType,
    deleteAssetType
}