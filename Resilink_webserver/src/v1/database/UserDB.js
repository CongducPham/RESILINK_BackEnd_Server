const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js'); 
const { ObjectId } = require('mongodb');
const connectToDatabase = require('./ConnectDB.js');
const cryptData = require("./CryptoDB.js");
const Utils = require("../services/Utils.js");

require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

// Creates a user in RESILINK DB
const newUser = async (user) => {
    try {
      const _database = await connectToDatabase.connectToDatabase();
      const _collection = _database.collection('user');
      updateData.warn('before inserting data', { from: 'newUser', data: {user: user}});
      
      // Checks if a user having the same userName exists
      const existingUserName = await _collection.findOne({ userName: user["userName"] });
      if (existingUserName) {
        return [{ "message": `User with userName: ${user["userName"]} already exists`}, 404];
      }

      // Checks if a user having the same email exists
      const existingEmail = await _collection.findOne({ email: user["email"] });
      if (existingEmail) {
        return [{ "message": `User with email: ${user["email"]} already exists`}, 404];
      }

      const uniqueObjectId = await connectToDatabase.generateUniqueObjectId(_collection);

      // Inserts a document with a unique identifier and a telephone number
      const userCtreated = await _collection.insertOne({
        "_id": uniqueObjectId,
        "phoneNumber": user["phoneNumber"] != null ? cryptData.encryptAES(user["phoneNumber"]) : "",
        "userName": user["userName"],
        "firstName": user["lastName"],
        "lastName": user["lastName"],
        "roleOfUser": user["roleOfUser"],
        "email": user["email"],
        "password": cryptData.encryptAES(user["password"]),
        "gps": user["gps"] ?? "",
        "createdAt": Utils.getDateGMT0(),
        "updatedAt": Utils.getDateGMT0(),
        "accessToken": ""
      });

      if (userCtreated == null) {
        throw new InsertDBError(`user with _id: ${user["_id"]}not created in local DB`)
      }  

      updateData.info('succes creating a user in Resilink DB', { from: 'newUser'});
      const createdUser = await _collection.findOne({ userName: user["userName"] });
      return createdUser;

    } catch (e) {
      if (e instanceof InsertDBError) {
        updateData.error('error creating a user in Resilink DB', { from: 'newAssetDB', error: e.message});
      } else {
        connectDB.error('error connecting to DB', { from: 'newAssetDB', error: e.message});
      }
      throw (e);
    }
};

// Deletes a user by id in RESILINK DB
const deleteUser = async (userId) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const result = await _collection.deleteOne({ userName: userId });

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
    throw(e);
  }
}

// Updates a user by id in RESILINK DB
const updateUser = async (id, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    updateData.warn('before updating data', { from: 'updateUser', data: {phoneNumber: body.phoneNumber ?? ""}});

    var updateFields = { 
      userName: body.userName,
      firstName: body.firstName,
      lastName: body.lastName,
      roleOfUser: body.roleOfUser,
      password: cryptData.encryptAES(body.password),
      email: body.email,
      updatedAt: Utils.getDateGMT0()
    };
    
    // Add `phoneNumber` if not null
    if (body.phoneNumber != null) {
      updateFields.phoneNumber = cryptData.encryptAES(body.phoneNumber).toString();
    }
    
    // Add `gps` if not null
    if (body.gps != null) {
      updateFields.gps = body.gps;
    }
    
    const result = await _collection.updateOne(
      { userName: body.userName },
      { $set: updateFields }
    );

    if (result.modifiedCount === 1) {

      updateData.info(`Document with username ${body.userName} successfully updated`, { from: 'updateUser'});
    } else {
      throw new UpdateDBError();
    }
  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error('error updating user in Resilink DB', { from: 'updateUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'updateUser', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user by id in RESILINK DB
const getUser = async (id) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ _id: new ObjectId(id) });
    if (user != null) {
      user.phoneNumber = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError("not found in our database");
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUser'});
    return user;
  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUser', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user by id in RESILINK DB
const getUserByToken = async (token) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ accessToken: token });
    if (user != null) {
      getDataLogger.info('success retrieving a user in Resilink DB', { from: 'getUser'});
      return user
    } else {
      throw new getDBError("not found in our database");
    }
  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUser', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user by id in RESILINK DB
const getUserAndToken = async (body, data) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: body['userName'] });
    if (user != null) {
      Object.assign(data, user); 
      data['phoneNumber'] = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
    } else {
      throw new getDBError();
    }

    if (cryptData.decryptAES(data['password']) != body.password) {
      throw new getDBError("password not valid");
    }

    const accessToken = Utils.createJWSToken(body['userName']);
    await _collection.updateOne(
      { userName: body.userName },
      { $set: {
        accessToken: accessToken
      } }
    );
    data['accessToken'] = accessToken;
    getDataLogger.info('succes retrieving an user and creating jws token in Resilink DB', { from: 'getUser'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUser', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user by id in RESILINK DB
const getUserByUserName = async (userName,) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: userName });
    if (user != null) {
      user.phoneNumber = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUserByUserName'});
    return user;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserByUserName', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserByUserName', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user by id in RESILINK DB
const getUserByEmail = async (email) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ email: email });
    if (user != null) {
      user.phoneNumber = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      delete user.password;
      delete user.accessToken;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user in Resilink DB', { from: 'getUserByEmail'});
    return user;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getUserByEmail', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getUserByEmail', error: e.message});
    }
    throw(e);
  }
}


// Retrieves all users in RESILINK DB
const getAllUser = async () => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    const users = await _collection.find().toArray();
    const decryptedUsers = users.map(user => {
      user.phoneNumber = user.phoneNumber =! null && user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
      delete user.accessToken;
      delete user.password;
      return user;
    });
    getDataLogger.info('succes retrieving all user in Resilink DB', { from: 'getAllUser'});

    return decryptedUsers;

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user in Resilink DB', { from: 'getAllUser', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'getAllUser', error: e.message});
    }
    throw(e);
  }
}

// Retrieves a user phone number by id and add it in a map
const insertUserPhoneNumber = async (userName, body) => {
  try {
    const _database = await connectToDatabase.connectToDatabase();
    const _collection = _database.collection('user');

    var user = await _collection.findOne({ userName: userName });
    if (user != null) {
      body['phoneNumber'] = user.phoneNumber.length > 15 ? cryptData.decryptAES(user.phoneNumber) : user.phoneNumber;
    } else {
      throw new getDBError();
    }

    getDataLogger.info('succes retrieving an user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber'});

  } catch (e) {
    if (e instanceof getDBError) {
      updateData.error('error retrieving user phoneNumber in Resilink DB', { from: 'insertuserPhoneNumber', error: e.message});
    } else {
      connectDB.error('error connecting to DB', { from: 'insertuserPhoneNumber', error: e.message});
    }
    throw(e)
  }
}

module.exports = {
  newUser,
  deleteUser,
  updateUser,
  getUser,
  getUserByToken,
  getUserAndToken,
  getUserByEmail,
  getUserByUserName,
  getAllUser,
  insertUserPhoneNumber
}