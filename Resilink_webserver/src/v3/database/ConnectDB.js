const { MongoClient } = require('mongodb');
const winston = require('winston');

const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const config = require('../config.js');

// MongoDB Atlas cluster connection URL
const _url = config.DB_URL;

let client;
let db;

/**
 * Establishes and returns a singleton connection to the RESILINK MongoDB database.
 * Reuses an existing connection if one is already active.
 *
 * @returns {Promise<Db>} - The connected MongoDB database instance
 */
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
