const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js'); 
const connectToDatabase = require('./ConnectDB.js');
const cryptData = require("./CryptoDB.js");

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

// Creates a user in RESILINK DB
const newUser = async (user) => {
    try {
      const _database = await connectToDatabase();
      const _collection = _database.collection('user');
  
      updateData.warn('before inserting data', { from: 'newUser', data: {user: user, phoneNumber: user["phoneNumber"] ?? ""}});
      
      // Checks if a user having the same id exists
      const existingUser = await _collection.findOne({ _id: user["_id"] });
      if (existingUser) {
        throw new InsertDBError(`User with _id: ${user["_id"]} already exists`);
      }
      
      // Inserts a document with a unique identifier and a telephone number
      const userCtreated = await _collection.insertOne({
        "_id": user["_id"],
        "phoneNumber": user["phoneNumber"] != null ? cryptData.encryptAES(user["phoneNumber"]) : "",
        "userName": user["userName"],
        "gps": user["gps"] ?? ""
      });

      if (userCtreated == null) {
        throw new InsertDBError(`user with _id: ${user["_id"]}not created in local DB`)
      }  

      updateData.info('succes creating a user in Resilink DB', { from: 'newUser'});

    } catch (e) {
      if (e instanceof InsertDBError) {
        updateData.error('error creating a user in Resilink DB', { from: 'newAssetDB', error: e.message});
      } else {
        connectDB.error('error connecting to DB', { from: 'newAssetDB', error: e.message});
      }
      throw e;
    }
};

// Deletes a user by id in RESILINK DB
const deleteUser = async (userId) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('user');

    const result = await _collection.deleteOne({ _id: userId });

    if (result.deletedCount === 1) {
      deleteData.info(`Document with ID ${userId} successfully deleted`, { from: 'deleteUser'});
    } else {
      throw new DeleteDBError();
    }
  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error('error delete user in Resilink DB', { from: 'deleteUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'deleteUser', error: e.message});
    }
    throw e;
  }
}

// Updates a user by id in RESILINK DB
const updateUser = async (id, body) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('user');

    updateData.warn('before updating data', { from: 'updateUser', data: {phoneNumber: body.phoneNumber ?? ""}});

    const result = await _collection.updateOne(
      { _id: id },
      { $set: {
        phoneNumber: body.phoneNumber == "" ? "" : cryptData.encryptAES(body.phoneNumber).toString(),
        gps: body.gps
      }}
    );

    if (result.modifiedCount === 1) {
      updateData.info(`Document with username ${id} successfully updated`, { from: 'updateUser'});
    } else {
      throw new UpdateDBError();
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating user in Resilink DB', { from: 'updateUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'updateUser', error: e.message});
    }
  }
}

// Retrieves a user by id in RESILINK DB
const getUser = async (id, body) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ _id: id });
    if (user != null) {
      body['phoneNumber'] = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      body['gps'] = user.gps;
    } else {
      body['phoneNumber'] = "";
      body['gps'] = "";
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUser'});

  } catch (e) {
    if (e instanceof getDBError) {
      e.message = "User not found in the database"
      updateData.error('error retrieving user in Resilink DB', { from: 'getUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUser', error: e.message});
    }
    throw e;
  }
}

// Retrieves all users in RESILINK DB
const getAllUser = async (userList) => {
  try {
    const _database = await connectToDatabase();
    const _collection = _database.collection('user');

    for (var i = 0; i < userList.length; i++) {
      var user = await _collection.findOne({ _id : userList[i]._id });
      if (user != null) {
        userList[i].phoneNumber = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
        userList[i].gps = user.gps
      } else {
        userList[i].phoneNumber = "";
        userList[i].gps = "";
      }
    }

    getDataLogger.info('succes retrieving all user in Resilink DB', { from: 'getAllUser'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getAllUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllUser', error: e.message});
    }
    throw e;
  }
}

// Retrieves a user phone number by id in RESILINK DB
const insertUserPhoneNumber = async (userName, body) => {
  try {

    const _database = await connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: userName });
    if (user != null) {
      body['phoneNumber'] = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
    } else {
      body['phoneNumber'] = "";
    }

    getDataLogger.info('succes retrieving an user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'insertuserPhoneNumber', error: e.message});
    }
    throw e;
  }
}

module.exports = {
  newUser,
  deleteUser,
  updateUser,
  getUser,
  getAllUser,
  insertUserPhoneNumber
}