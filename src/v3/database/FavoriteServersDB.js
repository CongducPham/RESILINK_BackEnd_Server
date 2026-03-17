const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const connectToDatabase = require('./ConnectDB.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Creates a new FavoriteServers document.
 * @param {Object} body - Favorite server payload containing `id` and `servers`.
 * @returns {Promise<Object>} MongoDB insert result.
 */
const createFavoriteServers = async (body) => {
  const db = await connectToDatabase.connectToDatabase();
  const collection = db.collection('FavoriteServers');

  try {
    const id = body.id;

    body.createdAt = new Date().toISOString();
    body.lastUpdated = body.createdAt;

    const result = await collection.insertOne(body);

    if (!result.acknowledged) {
      throw new InsertDBError(`FavoriteServers for ${id} could not be created`);
    }

    updateData.info("Successfully created FavoriteServers", {
      from: "createFavoriteServers",
      id
    });

    return result;

  } catch (e) {
    // Duplicate key error (unique index violation).
    if (e.code === 11000) {
      throw new InsertDBError(
        `FavoriteServers entry already exists for user ${body.id}`
      );
    }

    connectDB.error("Error inserting FavoriteServers", {
      from: "createFavoriteServers",
      error: e.message,
      data: body
    });

    throw e;
  }
};

/**
 * Retrieves one FavoriteServers document by username.
 * @param {string} username - User identifier.
 * @returns {Promise<Object>} FavoriteServers document.
 */
const getFavoriteServers = async (username) => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const doc = await collection.findOne({ id: username });
       
        if (doc == null) {
            throw new getDBError("no data found for " + username);
        }
        getDataLogger.info("Successfully retrieved FavoriteServers", {
            from: "getFavoriteServers",
            username
        });

        return doc;

    } catch (e) {
        if (e instanceof getDBError) {
            getDataLogger.error("Error retrieving FavoriteServers", {
                from: "getFavoriteServers",
                username,
                error: e.message
            });
        } else {
            connectDB.error("Error connecting to DB", {
                from: "getFavoriteServers",
                error: e.message
            });
        }
        throw e;
    }
};

/**
 * Retrieves all FavoriteServers documents.
 * @returns {Promise<Array>} List of FavoriteServers documents.
 */
const getAllFavoriteServers = async () => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const docs = await collection.find({}).toArray();

        getDataLogger.info("Successfully retrieved all FavoriteServers", {
            from: "getAllFavoriteServers"
        });

        return docs;

    } catch (e) {
        connectDB.error("Error retrieving all FavoriteServers", {
            from: "getAllFavoriteServers",
            error: e.message
        });
        throw e;
    }
};

/**
 * Updates fields of one FavoriteServers document.
 * @param {string} username - User identifier.
 * @param {Object} updateFields - Fields to update.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const updateFavoriteServers = async (username, updateFields) => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const existing = await collection.findOne({ id: username });
      
        if (existing == null) {
            throw new getDBError("no data found for " + username);
        }

        updateData.warn("Before updating FavoriteServers", {
            from: "updateFavoriteServers",
            data: { username, updateFields }
        });

        const result = await collection.updateOne(
            { id: username },
            { $set: { ...updateFields, lastUpdated: new Date().toISOString() } }
        );

        if (result.modifiedCount !== 1) {
            throw new UpdateDBError(`No FavoriteServers updated for ${username}`);
        }

        updateData.info("Successfully updated FavoriteServers", {
            from: "updateFavoriteServers",
            username
        });

    } catch (e) {
        if (e instanceof UpdateDBError || e instanceof getDBError) {
            updateData.error("Error updating FavoriteServers", {
                from: "updateFavoriteServers",
                error: e.message
            });
        } else {
            connectDB.error("Error connecting to DB", {
                from: "updateFavoriteServers",
                error: e.message
            });
        }
        throw e;
    }
};

/**
 * Adds a server name to one user's favorites.
 * @param {string} username - User identifier.
 * @param {string} serverName - Server name to add.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const addFavoriteServer = async (username, serverName) => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const existing = await collection.findOne({ id: username });
       
        if (existing == null) {
            throw new getDBError("no data found for " + username);
        }

        updateData.warn("Before adding favorite server", {
            from: "addFavoriteServer",
            data: { username, serverName }
        });

        const result = await collection.updateOne(
            { id: username },
            {
                $addToSet: { servers: serverName },
                $set: { lastUpdated: new Date().toISOString() }
            }
        );

        if (result.modifiedCount !== 1) {
            throw new UpdateDBError(`Failed to add server ${serverName} to favorites`);
        }

        updateData.info("Successfully added favorite server", {
            from: "addFavoriteServer",
            username,
            serverName
        });

    } catch (e) {
        if (e instanceof UpdateDBError || e instanceof getDBError) {
            updateData.error("Error adding favorite server", {
                from: "addFavoriteServer",
                error: e.message
            });
        } else {
            connectDB.error("Error connecting to DB", {
                from: "addFavoriteServer",
                error: e.message
            });
        }
        throw e;
    }
};

/**
 * Removes a server name from one user's favorites.
 * @param {string} username - User identifier.
 * @param {string} serverName - Server name to remove.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const removeFavoriteServer = async (username, serverName) => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const existing = await collection.findOne({ id: username });
      
        if (existing == null) {
            throw new getDBError("no data found for " + username);
        }

        updateData.warn("Before removing favorite server", {
            from: "removeFavoriteServer",
            data: { username, serverName }
        });

        const result = await collection.updateOne(
            { id: username },
            {
                $pull: { servers: serverName },
                $set: { lastUpdated: new Date().toISOString() }
            }
        );

        if (result.modifiedCount !== 1) {
            throw new UpdateDBError(`Failed to remove server ${serverName} from favorites`);
        }

        updateData.info("Successfully removed favorite server", {
            from: "removeFavoriteServer",
            username,
            serverName
        });

    } catch (e) {
        if (e instanceof UpdateDBError || e instanceof getDBError) {
            updateData.error("Error removing favorite server", {
                from: "removeFavoriteServer",
                error: e.message
            });
        } else {
            connectDB.error("Error connecting to DB", {
                from: "removeFavoriteServer",
                error: e.message
            });
        }
        throw e;
    }
};

/**
 * Deletes one FavoriteServers document.
 * @param {string} username - User identifier.
 * @returns {Promise<void>} Resolves when the deletion completes.
 */
const deleteFavoriteServers = async (username) => {
    try {
        const db = await connectToDatabase.connectToDatabase();
        const collection = db.collection('FavoriteServers');

        const existing = await collection.findOne({ id: username });
              
        if (existing == null) {
            throw new getDBError("no data found for " + username);
        }

        const result = await collection.deleteOne({ id: username });

        if (result.deletedCount !== 1) {
            throw new DeleteDBError(`No FavoriteServers deleted for ${username}`);
        }

        deleteData.info("Successfully deleted FavoriteServers", {
            from: "deleteFavoriteServers",
            username
        });

    } catch (e) {
        if (e instanceof DeleteDBError || e instanceof getDBError) {
            deleteData.error("Error deleting FavoriteServers", {
                from: "deleteFavoriteServers",
                error: e.message
            });
        } else {
            connectDB.error("Error connecting to DB", {
                from: "deleteFavoriteServers",
                error: e.message
            });
        }
        throw e;
    }
};

module.exports = {
    createFavoriteServers,
    getFavoriteServers,
    getAllFavoriteServers,
    updateFavoriteServers,
    addFavoriteServer,
    removeFavoriteServer,
    deleteFavoriteServers,
};
