/*
*  This file is part of the RESILINK back-end server developed by the PRIMA RESILINK (2022-2026) project. 
* RESILINK (2022-2026) is a project funded by the PRIMA Programme supported by the European Union. The project web site is https://resilink.eu/"
*  
*
*  Copyright (C) 2026 Axel Cazaux, University of Pau, UPPA
*
*  This program is free software: you can redistribute it and/or modify
*  it under the terms of the GNU General Public License as published by
*  the Free Software Foundation, either version 3 of the License, or
*  (at your option) any later version.
*
*  This program is distributed in the hope that it will be useful,
*  but WITHOUT ANY WARRANTY; without even the implied warranty of
*  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*  GNU General Public License for more details.
*
*  You should have received a copy of the GNU General Public License
*  along with the program.  If not, see <http://www.gnu.org/licenses/>.
*
******************************************************************************/

const { MongoClient, ObjectId } = require('mongodb');
const winston = require('winston');

const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const config = require('../config.js');

/**
 * MongoDB connection string.
 * @type {string}
 */
const _url = config.DB_URL;

let client;
let db;

/**
 * Opens or reuses the MongoDB connection and returns the active database.
 * @returns {Promise<Object>} MongoDB database instance.
 */
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

/**
 * Generates a unique ObjectId that is not already present in a collection.
 * @param {Object} collection - MongoDB collection to validate uniqueness against.
 * @returns {Promise<string>} Unique ObjectId string.
 */
const generateUniqueObjectId = async (collection) => {
  let newObjectId;
  let exists;

  do {
    newObjectId = new ObjectId();
    // Check if ObjectId exists in collection.
    exists = await collection.findOne({ _id: newObjectId });
  } while (exists); // Repeat until a unique ObjectId is generated.

  return newObjectId.toString();
};

module.exports = {
  connectToDatabase,
  generateUniqueObjectId
};
