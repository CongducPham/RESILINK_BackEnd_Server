const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const winston = require('winston');
const connectToDatabase = require('./ConnectDB.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

// Creates an asset in RESILINK DB 
const newAsset = async (body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');
    updateData.warn('before inserting data', { from: 'newAsset', data: body });

    // Trouver le dernier asset inséré et récupérer son ID
    const lastAsset = await _collection.find().sort({ id: -1 }).limit(1).toArray();
    
    // Vérifier si `lastAsset` est vide et attribuer `id = 1`
    let newId = 1;
    if (lastAsset.length > 0 && typeof lastAsset[0].id === "number") {
      newId = lastAsset[0].id + 1;
    }

    body.id = newId;

    const result = await _collection.insertOne({
      ...body,
      remainingQuantity: body.remainingQuantity,
      images: []
    });

    if (!result.acknowledged) {
      throw new InsertDBError("Asset not created in local DB");
    }  

    updateData.info('success creating an asset in Resilink DB', { from: 'newAsset' });

    // Retourner le document inséré sans `_id`
    return { ...body };

  } catch (e) {
    if (e instanceof InsertDBError) {
      updateData.error('error creating an asset in Resilink DB', { from: 'newAsset' });
    } else {
      connectDB.error('error connecting to DB', { from: 'newAsset', error: e });
    }
    throw e;
  }
};

// Retrieves all assets in RESILINK DB
const getAllAsset = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const result = await _collection.find({}).toArray();

    if (result == null) {
      throw new getDBError("assets didn't find in the Resilink DB");
    } else {
      getDataLogger.info('success retrieving all assets in Resilink DB', { from: 'getAllAsset' });
    }

    return result;
  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error('error retrieving all assets in Resilink DB', { from: 'getAllAsset' });
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllAsset', error: e });
    }
    throw e;
  }
};

//Retrieves one asset
const getOneAsset = async (assetId) => {
    try {
        const _database = await connectToDatabase.connectToDatabase();
        const _collection = _database.collection('Asset');
    
        const numericAssetId = parseInt(assetId);
        const valueAsset = await _collection.findOne({ id: numericAssetId});

        if (valueAsset == null || valueAsset.length === 0) {
          throw new getDBError("no asset with this id was found")
        } 
        getDataLogger.info('succes retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
        return valueAsset;

    } catch (e) {
      if (e instanceof getDBError) {
        getDataLogger.error('error retrieving one prosummer in Resilink DB', { from: 'getOneAssetType'});
      } else {
        connectDB.error('error connecting to DB', { from: 'getOneAssetType',  error: e});
      }
      throw(e);
    }
};

// Deletes an asset by id in RESILINK DB
const deleteAssetById = async (assetId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);
    const result = await _collection.deleteOne({ id: numericAssetId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${assetId} successfully deleted`, { from: 'deleteAssetById' });
    } else {
      deleteData.error('error deleting asset in Resilink DB', { from: 'deleteAssetById' });
      throw new DeleteDBError('error deleting asset in Resilink DB');
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error deleting asset in Resilink DB', { from: 'deleteAssetById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteAssetById', error: e });
    }
    throw e;
  }
};

// Updates an asset by id in RESILINK DB
const updateAssetById = async (assetId, asset) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.updateOne(
      { id: numericAssetId },
      { $set: asset }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${assetId} successfully updated`, { from: 'updateAssetById' });
      } else {
        updateData.info(`Document with ID ${assetId} found but value unchanged`, { from: 'updateAssetById' });
      }
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${assetId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating asset in Resilink DB', { from: 'updateAssetById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateAssetById', error: e });
    }
    throw e;
  }
};

// Updates an asset by id in RESILINK DB
const updateAssetImagesById = async (assetId, img) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('Asset');

    const numericAssetId = parseInt(assetId);

    const result = await _collection.updateOne(
      { id: numericAssetId },
      { $set: { images: img} }
    );
    if (result.matchedCount === 1) {
      if (result.modifiedCount === 1) {
        updateData.info(`Document with ID ${assetId} successfully updated`, { from: 'updateAssetImagesById' });
      } else {
        updateData.info(`Document with ID ${assetId} found but value unchanged`, { from: 'updateAssetImagesById' });
      }
    } else {
      throw new UpdateDBError(`Failed to find document with ID ${assetId}`);
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating asset in Resilink DB', { from: 'updateAssetImagesById' });
    } else {
      connectDB.error('error connecting to DB', { from: 'updateAssetImagesById', error: e });
    }
    throw e;
  }
};

module.exports = {
  newAsset,
  getAllAsset,
  getOneAsset,
  deleteAssetById,
  updateAssetById,
  updateAssetImagesById
};
