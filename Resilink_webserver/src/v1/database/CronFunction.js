const { getDBError, InsertDBError, DeleteDBError, UpdateDBError } = require('../errors.js');
const connectToDatabase = require('./ConnectDB.js');

// Deletes AccessToken every 2 hours from User in RESILINK DB
async function clearAccessToken() {
  try {
    const db = await connectToDatabase();
    const _collection = db.collection('user');

    // Supprimer le champ AccessToken pour tous les utilisateurs qui le possèdent
    const result = await users.updateMany(
      { AccessToken: { $exists: true } },
      { $unset: { AccessToken: "" } }  // Supprimer le champ AccessToken
    );

    if (result == null) {
      throw new DeleteDBError('error deleting all AccessToken in Resilink DB');
    } 
    
  } catch (e) {
    
      connectDB.error('error connecting to DB', { from: 'deleteAssetById', error: e });
  }
};

clearAccessToken();