const { MongoClient, ObjectId } = require('mongodb');
const winston = require('winston');

const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const config = require('../config.js');

// MongoDB Atlas cluster connection _url
const _url = config.DB_URL;

let client;
let db;

const connectToDatabase = async () => {
  if (!client || !client.topology || !client.topology.isConnected()) {
    try {
      client = new MongoClient(_url);
      await client.connect();
      db = client.db('ResilinkWithoutODEP');
      connectDB.info('Connected to MongoDB');
    } catch (error) {
      connectDB.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  } else {
    //connectDB.info('Reusing existing MongoDB connection');
  }
  return db;
};

// Generates a unique ObjectId and returns it as a string.
const generateUniqueObjectId = async (collection) => {
  let newObjectId;
  let exists;

  do {
    newObjectId = new ObjectId();
    // Check if ObjectId exists in collection
    exists = await collection.findOne({ _id: newObjectId });
  } while (exists); // Repeat until find a unique ObjectId

  return newObjectId.toString();
};

module.exports = {
  connectToDatabase,
  generateUniqueObjectId
};
