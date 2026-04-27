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

const connectToDatabase = require('./ConnectDB');
const winston = require('winston');

const initLogger = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Removes duplicate documents from a collection, keeping the first occurrence for each unique field value.
 * @param {Object} collection - MongoDB collection.
 * @param {string} field - Field name to deduplicate on.
 */
const deduplicateCollection = async (collection, field) => {
  const pipeline = [
    { $group: { _id: `$${field}`, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ];
  const duplicates = await collection.aggregate(pipeline).toArray();
  for (const doc of duplicates) {
    const [, ...toDelete] = doc.ids;
    await collection.deleteMany({ _id: { $in: toDelete } });
    initLogger.warn(`Removed ${toDelete.length} duplicate(s) in ${collection.collectionName} for ${field}=${doc._id}`);
  }
};

/**
 * Ensures all required unique indexes exist across local MongoDB collections.
 * Only collections fully managed locally (not by ODEP) are indexed here.
 * @returns {Promise<void>} Resolves when index initialization completes.
 */
const initDB = async () => {
  try {    
    const db = await connectToDatabase.connectToDatabase();
    const collectionRating = db.collection('Rating');

    // Deduplicate before creating unique indexes to handle pre-existing duplicate data
    await deduplicateCollection(collectionRating, 'userId');

    await collectionRating.createIndex(
      { userId: 1 },
      { unique: true }
    );

    initLogger.info('Database indexes ensured', {
      from: 'initDB',
      indexes: ['Rating.userId(unique)']
    });

  } catch (e) {
    initLogger.error('Failed to initialize database indexes', {
      from: 'initDB',
      error: e.message
    });
    throw e;
  }
};

module.exports = { initDB };
