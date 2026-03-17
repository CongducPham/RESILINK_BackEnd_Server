const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const connectToDatabase = require('./ConnectDB.js');
require('../loggers.js');
const winston = require('winston');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');
const deleteData = winston.loggers.get('DeleteDataResilinkLogger');

/**
 * Creates a new RegisteredServer document.
 * @param {Object} body - Registered server payload.
 * @returns {Promise<void>} Resolves when the insert completes.
 */
const newRegisteredServer = async (body) => {
  const db = await connectToDatabase.connectToDatabase();
  const collection = db.collection("RegisteredServers");

  try {
    body.createdAt = new Date().toISOString();
    body.lastUpdated = body.createdAt;

    await collection.insertOne(body);

    updateData.info("Successfully created RegisteredServer", {
      from: "newRegisteredServer",
      serverName: body.serverName
    });

  } catch (e) {
    // MongoDB uniqueness error.
    if (e.code === 11000) {
      if (e.keyPattern?.serverName) {
        throw new InsertDBError(
          `RegisteredServer with name "${body.serverName}" already exists`
        );
      }

      if (e.keyPattern?.serverUrl) {
        throw new InsertDBError(
          `RegisteredServer with url "${body.serverUrl}" already exists`
        );
      }

      throw new InsertDBError("RegisteredServer already exists");
    }

    connectDB.error("Error inserting RegisteredServer", {
      from: "newRegisteredServer",
      error: e.message,
      data: body
    });

    throw e;
  }
};


/**
 * Retrieves one RegisteredServer document by name.
 * @param {string} serverName - Server name.
 * @returns {Promise<Object>} Registered server document.
 */
const getRegisteredServer = async (serverName) => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const collection = db.collection("RegisteredServers");

    const doc = await collection.findOne({ name: serverName });

    if (!doc) {
      throw new getDBError(`RegisteredServer ${serverName} not found`);
    }

    getDataLogger.info("Successfully retrieved RegisteredServer", {
      from: "getRegisteredServer",
      data: { serverName }
    });

    return doc;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error("Error retrieving RegisteredServer", {
        from: "getRegisteredServer",
        error: e.message
      });
    } else {
      connectDB.error("Error connecting to DB", {
        from: "getRegisteredServer",
        error: e.message
      });
    }
    throw e;
  }
};

/**
 * Retrieves all RegisteredServer documents.
 * @returns {Promise<Array>} List of registered servers.
 */
const getAllRegisteredServers = async () => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const collection = db.collection("RegisteredServers");

    const docs = await collection.find({}).toArray();

    getDataLogger.info("Successfully retrieved all RegisteredServers", {
      from: "getAllRegisteredServers"
    });

    return docs;

  } catch (e) {
    if (e instanceof getDBError) {
      getDataLogger.error("Error retrieving all RegisteredServers", {
        from: "getAllRegisteredServers",
        error: e.message
      });
    } else {
      connectDB.error("Error connecting to DB", {
        from: "getAllRegisteredServers",
        error: e.message
      });
    }
    throw e;
  }
};

/**
 * Updates one RegisteredServer by name.
 * @param {string} serverName - Server name.
 * @param {Object} updateFields - Fields to update.
 * @returns {Promise<void>} Resolves when the update completes.
 */
const updateRegisteredServer = async (serverName, updateFields) => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const collection = db.collection("RegisteredServers");

    const existing = await collection.findOne({ name: serverName });
    if (!existing) {
      throw new InsertDBError(`RegisteredServer with name: ${serverName} doesn't exist`);
    }

    updateData.warn("Before updating RegisteredServer", {
      from: "updateRegisteredServer",
      data: { serverName, updateFields }
    });

    const result = await collection.updateOne(
      { name: serverName },
      { $set: { ...updateFields, lastUpdated: new Date().toISOString() } }
    );

    if (result.modifiedCount === 1) {
      updateData.info("Successfully updated RegisteredServer", {
        from: "updateRegisteredServer",
        data: { serverName }
      });
    } else {
      throw new UpdateDBError(`No document updated for serverName: ${serverName}`);
    }

  } catch (e) {
    if (e instanceof UpdateDBError) {
      updateData.error("Error updating RegisteredServer", {
        from: "updateRegisteredServer",
        error: e.message
      });
    } else {
      connectDB.error("Error connecting to DB", {
        from: "updateRegisteredServer",
        error: e.message
      });
    }
    throw e;
  }
};

/**
 * Deletes one RegisteredServer by name.
 * @param {string} serverName - Server name.
 * @returns {Promise<void>} Resolves when the deletion completes.
 */
const deleteRegisteredServer = async (serverName) => {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const collection = db.collection("RegisteredServers");

    const existing = await collection.findOne({ name: serverName });
    if (!existing) {
      throw new InsertDBError(`RegisteredServer with name: ${serverName} doesn't exist`);
    }
    
    const result = await collection.deleteOne({ name: serverName });

    if (result.deletedCount === 1) {
      deleteData.info("Successfully deleted RegisteredServer", {
        from: "deleteRegisteredServer",
        data: { serverName }
      });
    } else {
      throw new DeleteDBError(`No RegisteredServer deleted for serverName: ${serverName}`);
    }

  } catch (e) {
    if (e instanceof DeleteDBError) {
      deleteData.error("Error deleting RegisteredServer", {
        from: "deleteRegisteredServer",
        error: e.message
      });
    } else {
      connectDB.error("Error connecting to DB", {
        from: "deleteRegisteredServer",
        error: e.message
      });
    }
    throw e;
  }
};

module.exports = {
  newRegisteredServer,
  getRegisteredServer,
  getAllRegisteredServers,
  updateRegisteredServer,
  deleteRegisteredServer
};
