const { MongoClient } = require('mongodb');
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
      db = client.db('Resilink');
    } catch (error) {
      connectDB.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }
  return db;
};

module.exports = connectToDatabase;
