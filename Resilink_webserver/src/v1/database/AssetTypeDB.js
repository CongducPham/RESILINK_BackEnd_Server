const { InsertDBError } = require('../errors.js'); 
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

require('../loggers.js');
const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

// If the assetType does not exist, creates its entity in the database, otherwise updates the assetType counter.
const newAssetTypeDBCounter = async (assetType) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('AssetTypeCounter');

      const existingDocument = await _collection.findOne({ assetType: assetType });
      updateData.warn('before inserting data', { from: 'newAssetTypeDB', data: assetType});

        if (existingDocument === null) {
            // Create a new document with the assetType
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
            // Update the document by incrementing the counter
            const updatedDocument = await _collection.findOneAndUpdate(
                { assetType: assetType },
                { $inc: { count: 1 } }, 
                { returnDocument: 'after' } // Resend the updated document
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

// Creates an assetType
const newAssetType = async (body) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('AssetType');

      // Delete the _id key if it exists in body  
      if (body._id) {
        delete body._id;
      }
    
      updateData.info('data to insert', { from: 'newAssetType', body: body});
      const assetType = await _collection.insertOne({
        ...body
      });
  
      if (assetType == null) {
        throw new InsertDBError("assetType not created in local DB")
      }
      
      updateData.info('succes creating one assetType in Resilink DB', { from: 'newAssetType'});
      return assetType;
  
    } catch (e){
      if (e instanceof InsertDBError) {
        updateData.error('error creating one assetType in Resilink DB', { from: 'newAssetType'});
      } else {
        connectDB.error('error connecting to DB ', { from: 'newAssetType',  error: e});
      }
      throw(e);
    }
};

//Retrieves all assetTypes in RESILINK DB
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

//Retrieves one prosumer by the entity prosummer
const getOneAssetType = async (assetType) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('AssetType');
    
        const valueAssetType = await _collection.findOne({ name: assetType });

        if (valueAssetType == null || valueAssetType.length === 0) {
          return "0"; // 0 if no assetType has been found. Different from the other Get One functions, it allows you to check whether an assetType exists (for cloning).
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

// Updates a user by id in RESILINK DB
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

// Delete an assetType
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