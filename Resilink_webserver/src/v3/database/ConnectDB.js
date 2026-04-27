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
*****************************************************************************/

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
