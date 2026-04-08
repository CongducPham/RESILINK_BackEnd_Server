const { UpdateDBError } = require('../errors.js');
const connectToDatabase = require('./ConnectDB.js');
const cron = require('node-cron');
const winston = require('winston');

const updateData = winston.loggers.get('UpdateDataResilinkLogger');
const connectDB = winston.loggers.get('ConnectDBResilinkLogger');

/**
 * Aggregates all user recommendation stats into the global recommendation document.
 *
 * This function reads every document from `RecommendationStats`, sums all `assetType`
 * counters, and upserts the consolidated result into `GlobalRecommendationStats`.
 *
 * @returns {Promise<void>} Resolves when aggregation and upsert complete.
 */
async function updateGlobalRecommendationStats() {
  try {
    const db = await connectToDatabase.connectToDatabase();
    const recommendationStatsCollection = db.collection('RecommendationStats');
    const globalStatsCollection = db.collection('GlobalRecommendationStats');

    // Load all user-level recommendation stats.
    const allUserStats = await recommendationStatsCollection.find({}).toArray();

    // Aggregate all assetType counters across users.
    const aggregated = {};

    for (const stat of (allUserStats || [])) {
      const assetTypes = stat.assetType || {};
      for (const [type, count] of Object.entries(assetTypes)) {
        aggregated[type] = (aggregated[type] || 0) + count;
      }
    }

    // Upsert global aggregated stats.
    const now = new Date().toISOString();
    const result = await globalStatsCollection.updateOne(
      {},
      {
        $set: {
          assetType: aggregated,
          lastUpdated: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );

    if (!result) {
      throw new UpdateDBError('Failed to update GlobalRecommendationStats');
    }

    updateData.info('GlobalRecommendationStats successfully updated', {
      from: 'updateGlobalRecommendationStats',
      updatedCount: Object.keys(aggregated).length,
      sourceStatsCount: (allUserStats || []).length
    });

  } catch (e) {
    connectDB.error('Error updating GlobalRecommendationStats', {
      from: 'updateGlobalRecommendationStats',
      error: e.message
    });
  }
}

/**
 * Starts the daily CRON task that refreshes global recommendation stats.
 *
 * Schedule: every day at midnight (`0 0 * * *`).
 *
 * @returns {void}
 */
function startGlobalRecommendationStatsCron() {
  cron.schedule('0 0 * * *', async () => {
    updateData.info('CRON: Starting GlobalRecommendationStats update...');
    await updateGlobalRecommendationStats();
  });
}

module.exports = {
  startGlobalRecommendationStatsCron,
  updateGlobalRecommendationStats
};
