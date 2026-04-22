require('../loggers.js');
const winston = require('winston');
const config = require('../config.js');

const getDataLogger = winston.loggers.get('GetDataLogger');
const updateDataODEP = winston.loggers.get('UpdateDataODEPLogger');
const deleteDataResilink = winston.loggers.get('DeleteDataODEPLogger');

const Utils = require("./Utils.js");
const AssetTypes = require("./AssetTypeService.js");
const Asset = require("./AssetService.js");
const UserDB = require("../database/UserDB.js");
const PosumerDB = require("../database/ProsummerDB.js");
const OfferDB = require("../database/OfferDB.js");
const AssetDB = require("../database/AssetDB.js");
const RecommendantionStatsDB = require("../database/RecommendationStatsDB.js");
const FavoriteServersDB = require("../database/FavoriteServersDB.js");

const tokenRequired = config.TOKEN_REQUIRED;

/**
 * Retrieves valid offers from local server only (no external federation).
 * Filters out expired offers, out-of-stock items, and user-blocked offers.
 * Enriches offers with phone numbers for direct prosumer contact.
 * When called by another server (fromServer=true), only returns offers with acceptSharing=true.
 * Public-accessible endpoint - works with or without authentication.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @param {boolean} [fromServer=false] - True if the call originates from another RESILINK server
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets: {} } }, statusCode]
 */
const getLocalOffersOnlyCustom = async (user, fromServer = false) => {
  try {
    const username = user?.username ?? "no token required";

    const allAssetType = await AssetTypes.getAllAssetTypesResilink(user);
    const allAssetResilink = await Asset.getAllAssetResilink(user);
    const allOffer = await OfferDB.getAllOffers();

    if (allAssetType[1] !== 200 || allAssetResilink[1] !== 200) {
      getDataLogger.error("error retrieving assets / assetTypes", {
        from: "getLocalOffersOnlyCustom",
        user: username
      });
      return [
        allAssetType[1] !== 200 ? allAssetType[0] : allAssetResilink[0],
        404
      ];
    }

    // Retrieve blocked offer IDs for the local server
    let blockedSet = new Set();
    if (user) {
      const blockedOffers = await PosumerDB.getProsumerBlockedOffers(username);
      if (blockedOffers) {
        const localServerBlocked = blockedOffers[config.SWAGGER_URL] || [];
        blockedSet = new Set(localServerBlocked.map(id => id.toString()));
      }
    }

    const localServerUrl = config.SWAGGER_URL;
    const offersMap = {};
    const offererIds = new Set();
    const now = new Date();

    for (const offer of allOffer) {
      if (user && blockedSet.has(offer.id.toString())) continue;

      const asset = allAssetResilink[0][offer.assetId.toString()];
      if (!asset) continue;

      const assetType = allAssetType[0][asset.assetType];
      if (!assetType) continue;

      if (new Date(offer.validityLimit) <= now) continue;

      if (
        assetType.nature === "measurableByQuantity" &&
        offer.remainingQuantity !== null &&
        offer.remainingQuantity <= 0
      ) continue;

      // Server-to-server calls: only include offers with acceptSharing enabled
      if (fromServer && offer.acceptSharing === false) continue;

      offersMap[offer.id.toString()] = offer;
      offererIds.add(offer.offerer.toString());
    }

    const phoneMap = await UserDB.bulkInsertUserPhoneNumbers([...offererIds]);

    for (const id in offersMap) {
      offersMap[id].phoneNumber = phoneMap[offersMap[id].offerer] ?? "";
    }

    // Build assets map for valid offers
    const assetsMap = {};
    for (const id in offersMap) {
      const assetId = offersMap[id].assetId.toString();
      assetsMap[assetId] = allAssetResilink[0][assetId];
    }

    const resultOffers = {
      [localServerUrl]: {
        offers: Object.values(offersMap),
        assets: assetsMap,
        serverName: config.SERVER_NAME
      }
    };

    getDataLogger.info("successful local data retrieval", {
      from: "getLocalOffersOnlyCustom",
      username
    });

    return [resultOffers, 200];

  } catch (e) {
    getDataLogger.error("error local data retrieval", {
      from: "getLocalOffersOnlyCustom",
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves federated offers: local server + user's favorite external RESILINK servers.
 * Aggregates offers from multiple servers for authenticated users with favorite servers configured.
 * Falls back to local-only if user is not authenticated.
 * Requires authentication to access favorite servers functionality.
 * Supports multi-server blocked offers filtering.
 * 
 * @param {Object} user - Authenticated user (required for federation)
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets: {} }, ... }, statusCode]
 */
const getFederatedOffersCustom = async (user) => {
  try {
    const username = user?.username ?? "no token required";

    // Get local offers first (already filtered by local blocked offers)
    const [localOffers, localCode] = await getLocalOffersOnlyCustom(user);

    if (localCode !== 200) {
      return [localOffers, localCode];
    }

    const resultOffers = localOffers;

    // Add federated servers only if user is authenticated
    if (user) {
      // Get blockedOffers map for filtering external servers
      const blockedOffersMap = await PosumerDB.getProsumerBlockedOffers(username) || {};

      const favorites = await FavoriteServersDB.getFavoriteServers(username);
      
      // Parallel fetch from all favorite servers using Promise.allSettled
      // Each promise is self-contained: individual failures don't affect others
      const results = await Promise.allSettled(
        favorites.servers.map(async (serverUrl) => {
          const externalData = await getOffersFromFavoriteServer(
            serverUrl,
            "/v3/offers/local/all"
          );
          return { serverUrl, externalData };
        })
      );

      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value.externalData) continue;

        const { serverUrl, externalData } = result.value;

        // Normalize response: extract the server's data from the response envelope
        // Format: { "http://server:port": { offers: [...], assets: {...} } }
        const serverData = Object.values(externalData)[0];

        if (!serverData || !Array.isArray(serverData.offers)) continue;

        let offers = [...serverData.offers];
        let assets = { ...serverData.assets } || {};

        // Filter blocked offers for this specific server
        if (blockedOffersMap[serverUrl]) {
          const blockedSet = new Set(
            blockedOffersMap[serverUrl].map(id => id.toString())
          );

          offers = offers.filter(offer => !blockedSet.has(offer.id.toString()));

          // Re-filter assets to only include those referenced by non-blocked offers
          const filteredAssets = {};
          for (const offer of offers) {
            const assetId = offer.assetId?.toString();
            if (assetId && assets[assetId]) {
              filteredAssets[assetId] = assets[assetId];
            }
          }
          assets = filteredAssets;
        }

        resultOffers[serverUrl] = { offers, assets, serverName: serverData.serverName || serverUrl };
      }
    }

    getDataLogger.info("successful federated data retrieval", {
      from: "getFederatedOffersCustom",
      username,
      federatedServers: user ? Object.keys(resultOffers).length - 1 : 0
    });

    return [resultOffers, 200];

  } catch (e) {
    getDataLogger.error("error federated data retrieval", {
      from: "getFederatedOffersCustom",
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves a limited set of offers weighted by user preferences and recommendation stats.
 * Implements personalized offer ranking based on user's historical interactions with asset types.
 * Falls back to global statistics if user has no personal recommendation history.
 * Optimized MongoDB query reduces database load for large offer sets.
 * 
 * @param {number} offerNbr - Number of offers to return per iteration (pagination size)
 * @param {number} iteration - Page number (0-indexed)
 * @param {Object} user - Authenticated user for personalization
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets: {} } }, statusCode] with enriched data
 */
const getWeightedLimitedOffersForResilink = async (offerNbr, iteration, user) => {
  const username = user.username;
  const localServerUrl = config.SWAGGER_URL;

  try {
    const userProfil = await UserDB.getUserByUserName(username);

    // ---- Retrieve weights from RecommendationStats ----
    const recommendationStats = await RecommendantionStatsDB.getRecommendationStatsByName(username);
    const userWeights = recommendationStats?.assetType || {};

    // Always fetch global stats for diversity blending.
    const globalStats = await RecommendantionStatsDB.getLatestGlobalRecommendationStats();
    const globalWeights = globalStats?.assetType || {};

    // A user "has" weights only when at least one assetType counter is > 0.
    const hasUserWeights   = Object.values(userWeights).some(w => w > 0);
    const hasGlobalWeights = Object.values(globalWeights).some(w => w > 0);

    // ---- Blend personal + global weights ----
    // When the user has personal history we mix 70% personal / 30% global
    // so globally popular asset types the user hasn't interacted with still
    // appear (discovery / breaking filter bubble).
    // When the user has no personal history (new account, all 0) we rely 100% on global trends.
    const PERSONAL_RATIO = 0.70;
    const GLOBAL_RATIO   = 0.30;

    let weights = {};

    if (hasUserWeights && hasGlobalWeights) {
      // Normalize each source independently first.
      const totalUser   = Object.values(userWeights).reduce((s, w) => s + w, 0);
      const totalGlobal = Object.values(globalWeights).reduce((s, w) => s + w, 0);

      // Collect all asset types seen in either source.
      const allTypes = new Set([
        ...Object.keys(userWeights),
        ...Object.keys(globalWeights)
      ]);

      for (const type of allTypes) {
        const userNorm   = totalUser   > 0 ? (userWeights[type]   || 0) / totalUser   : 0;
        const globalNorm = totalGlobal > 0 ? (globalWeights[type] || 0) / totalGlobal : 0;
        weights[type] = (userNorm * PERSONAL_RATIO) + (globalNorm * GLOBAL_RATIO);
      }
    } else if (hasUserWeights) {
      // No global stats available — use personal only.
      weights = { ...userWeights };
    } else if (hasGlobalWeights) {
      // No personal stats (new account) — use global only (100%).
      weights = { ...globalWeights };
    }
    // else: both empty → weights stays {} → DB falls back to random.

    // ---- Retrieve user's activity domain & profession ----
    // Used for affinity scoring: the pipeline compares the offerer's
    // profession/domain with the requesting user's to boost relevant sellers.
    let userActivity = null;
    try {
      const prosumerProfile = await PosumerDB.getOneProsummer(username);
      if (prosumerProfile) {
        const domain = (prosumerProfile.activityDomain ?? "").trim();
        const profession = (prosumerProfile.specificActivity ?? "").trim();
        // Only pass activity info when the user has a meaningful domain.
        if (domain !== "" && domain !== "Other") {
          userActivity = {
            activityDomain: domain,
            specificActivity: (profession !== "Other") ? profession : ""
          };
        }
      }
    } catch (_) {
      userActivity = null;
    }

    // ---- Normalize blended weights to [0, 1] range ----
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      const MIN_DISCOVERY_WEIGHT = 0.05; // 5% minimum so unseen types still appear
      const normalizedWeights = {};
      for (const [type, w] of Object.entries(weights)) {
        normalizedWeights[type] = Math.max(w / totalWeight, MIN_DISCOVERY_WEIGHT);
      }
      weights = normalizedWeights;
    }

    // ---- Retrieve blocked offers ----
    const blockedRaw = await PosumerDB.getProsumerBlockedOffers(userProfil.userName);
    const blockedIds = blockedRaw?.[config.SWAGGER_URL] || [];

    // ---- Optimized MongoDB query with composite scoring ----
    const offers = await OfferDB.getWeightedOffersFromDB(
      weights, blockedIds, offerNbr, iteration, username, userActivity
    );

    // ---- Asset mapping for display ----
    const allAssetResilink = await Asset.getAllAssetResilink(user);
    const validMapAssets = {};
    for (const offer of offers) {
      validMapAssets[offer.assetId.toString()] = allAssetResilink[0][offer.assetId.toString()];
    }

    // ---- Phone numbers ----
    const uniqueOfferers = [...new Set(offers.map(o => o.offerer.toString()))];
    const phoneMap = await UserDB.bulkInsertUserPhoneNumbers(uniqueOfferers);
    for (const offer of offers) {
      offer.phoneNumber = phoneMap[offer.offerer.toString()] ?? "";
    }

    const result = {
      [localServerUrl]: {
        offers,
        assets: validMapAssets,
        serverName: config.SERVER_NAME
      }
    };

    getDataLogger.info("successful weighted data retrieval", {
      from: "getWeightedLimitedOffersForResilink",
      username,
    });

    return [result, 200];
  } catch (e) {
    getDataLogger.error("error retrieving weighted offers", {
      from: "getWeightedLimitedOffersForResilink",
      error: e.message,
      username
    });
    throw e;
  }
};

/**
 * Retrieves a paginated subset of valid offers with basic filtering.
 * Non-personalized alternative to weighted offers for public/anonymous browsing.
 * Filters expired offers, out-of-stock items, and user-blocked offers.
 * Implements reverse chronological ordering (newest first) with pagination.
 * 
 * @param {number} offerNbr - Number of offers per page
 * @param {number} iteration - Page number (0-indexed)
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets: {} } }, statusCode] with paginated results
 */
const getLimitedOfferForResilinkCustom = async (offerNbr, iteration, user, federated = false) => {
  const username = user?.username ?? "no token required";
  const localServerUrl = config.SWAGGER_URL;

  try {

    // ---- Base data loading ----
    const allAssetType = await AssetTypes.getAllAssetTypesResilink(user);
    const allAssetResilink = await Asset.getAllAssetResilink(user);
    const allOffer = await OfferDB.getAllOffers();

    if (allAssetType[1] !== 200 || allAssetResilink[1] !== 200) {
      getDataLogger.error("error retrieving assets / assetTypes", {
        from: "getLimitedOfferForResilinkCustom",
        username
      });
      return [{ message: "Error retrieving assets or asset types" }, 400];
    }

    // ---- Blocked offers (only when user is authenticated) ----
    let blockedSet = new Set();
    let blockedOffersMap = {};
    if (user) {
      const userProfil = await UserDB.getUserByUserName(username);
      const blockedOffers = await PosumerDB.getProsumerBlockedOffers(
        userProfil.userName
      );
      if (blockedOffers) {
        blockedOffersMap = blockedOffers;
        const localServerBlocked = blockedOffers[config.SWAGGER_URL] || [];
        blockedSet = new Set(localServerBlocked.map(id => id.toString()));
      }
    }

    // ---- Fetch phone numbers for all offerers ----
    const uniqueOfferers = [
      ...new Set(allOffer.map(o => o.offerer.toString()))
    ];
    const phoneMap = await UserDB.bulkInsertUserPhoneNumbers(uniqueOfferers);

    const validOffers = [];
    const now = new Date();

    // ---- Filtering ----
    for (const offer of allOffer) {
      const asset = allAssetResilink[0][offer.assetId.toString()];
      if (!asset) continue;

      const assetType = allAssetType[0][asset.assetType];
      if (!assetType) continue;

      const validDate = new Date(offer.validityLimit) > now;
      const validQuantity =
        assetType.nature !== "measurableByQuantity" ||
        (offer.remainingQuantity ?? 1) > 0;

      const notBlocked = !user || !blockedSet.has(offer.id.toString());

      if (validDate && validQuantity && notBlocked) {
        offer.phoneNumber = phoneMap[offer.offerer.toString()] ?? "";
        validOffers.push(offer);
      }
    }

    // ---- Global pagination (local + federated) ----
    const limit = parseInt(offerNbr);
    const offset = parseInt(iteration) * limit;
    const totalLocalValid = validOffers.length;

    // Sort local offers newest first
    validOffers.reverse();

    // Extract the local slice for this page
    const localSlice = validOffers.slice(offset, offset + limit);

    const validMapAssets = {};
    for (const offer of localSlice) {
      validMapAssets[offer.assetId.toString()] =
        allAssetResilink[0][offer.assetId.toString()];
    }

    const result = {
      [localServerUrl]: {
        offers: localSlice,
        assets: validMapAssets,
        serverName: config.SERVER_NAME
      }
    };

    // ---- Federation: fill the page with favorite servers if the local page is incomplete ----
    // Federation is triggered only when explicitly requested AND the page is not already full
    const needsFederation = federated && (offset + limit > totalLocalValid) && user;

    if (needsFederation) {
      const favorites = await FavoriteServersDB.getFavoriteServers(username);

      if (favorites && favorites.servers && favorites.servers.length > 0) {
        // How many federated offers are needed to fill this page
        const federatedNeeded = limit - localSlice.length;

        // How many federated offers were already consumed by previous pages
        const federatedOffset = Math.max(0, offset - totalLocalValid);

        // Parallel fetch from all favorite servers
        const federatedResults = await Promise.allSettled(
          favorites.servers.map(async (serverUrl) => {
            const externalData = await getOffersFromFavoriteServer(
              serverUrl,
              "/v3/offers/local/all",
              user
            );
            return { serverUrl, externalData };
          })
        );

        // Build an ordered federated pool (per server, newest first)
        const federatedPool = [];

        for (const r of federatedResults) {
          if (r.status !== 'fulfilled' || !r.value.externalData) continue;

          const { serverUrl, externalData } = r.value;
          const serverData = Object.values(externalData)[0];
          if (!serverData || !Array.isArray(serverData.offers)) continue;

          let offers = [...serverData.offers];

          // Filter blocked offers for this server
          if (blockedOffersMap[serverUrl]) {
            const blockedSetExt = new Set(
              blockedOffersMap[serverUrl].map(id => id.toString())
            );
            offers = offers.filter(o => !blockedSetExt.has(o.id.toString()));
          }

          // Newest first
          offers.reverse();

          for (const offer of offers) {
            federatedPool.push({
              offer,
              serverUrl,
              assets: serverData.assets || {},
              serverName: serverData.serverName || serverUrl
            });
          }
        }

        // Slice the federated pool with the correct offset to avoid duplicates across pages
        const federatedSlice = federatedPool.slice(federatedOffset, federatedOffset + federatedNeeded);

        // Group by server to match the result format
        for (const item of federatedSlice) {
          if (!result[item.serverUrl]) {
            result[item.serverUrl] = {
              offers: [],
              assets: {},
              serverName: item.serverName
            };
          }
          result[item.serverUrl].offers.push(item.offer);
          const assetId = item.offer.assetId?.toString();
          if (assetId && item.assets[assetId]) {
            result[item.serverUrl].assets[assetId] = item.assets[assetId];
          }
        }
      }
    }

    getDataLogger.info("successful data retrieval", {
      from: "getLimitedOfferForResilinkCustom",
      username,
      localOffers: localSlice.length,
      federatedServers: Object.keys(result).length - 1,
      totalOffersReturned: Object.values(result).reduce((sum, s) => sum + s.offers.length, 0)
    });

    return [result, 200];

  } catch (e) {
    getDataLogger.error("error data retrieval", {
      from: "getLimitedOfferForResilinkCustom",
      error: e.message,
      username
    });
    throw e;
  }
};


/**
 * Extracts blocked offer IDs for a specific server key from the blockedOffers map.
 * Format: { "http://localserver:port": [id1, id2], "http://server:port": [id3, id4] }
 * 
 * @param {Object|null} blockedData - Blocked offers map from DB
 * @param {string} serverKey - Server URL key to extract
 * @returns {Set<string>} - Set of blocked offer ID strings
 */
const extractBlockedIdsForServer = (blockedData, serverKey) => {
  if (!blockedData) return new Set();

  const ids = blockedData[serverKey] || [];
  return new Set(ids.map(id => id.toString()));
};

/**
 * Retrieves local offers by a list of IDs with optional asset data.
 * Uses a bulk DB query for efficiency. Enriches offers with phone numbers.
 * Missing offers/assets are silently skipped.
 * 
 * @param {Array<string|number>} offerIds - List of offer IDs to retrieve
 * @param {boolean} includeAssets - Whether to include associated assets
 * @param {Object} user - Authenticated user for asset data access
 * @returns {Promise<Object>} { offers: [], assets?: {} }
 */
const getLocalOffersByIds = async (offerIds, includeAssets, user) => {
  if (!offerIds || offerIds.length === 0) {
    return includeAssets ? { offers: [], assets: {} } : { offers: [] };
  }

  // Bulk fetch offers from DB
  const offers = await OfferDB.getOffersByIds(offerIds);

  // Retrieve phone numbers for all offerers in one bulk call
  const offererIds = [...new Set(offers.map(o => o.offerer.toString()))];
  const phoneMap = await UserDB.bulkInsertUserPhoneNumbers(offererIds);

  for (const offer of offers) {
    offer.phoneNumber = phoneMap[offer.offerer.toString()] ?? "";
  }

  if (!includeAssets) {
    return { offers };
  }

  // Retrieve all assets and map only those referenced by our offers
  const [assetData, assetCode] = await Asset.getAllAssetResilink(user);
  const assetsResilink = assetCode === 200 ? assetData : {};
  const assets = {};

  for (const offer of offers) {
    const assetId = offer.assetId?.toString();
    if (assetId && assetsResilink[assetId]) {
      assets[assetId] = assetsResilink[assetId];
    }
  }

  return { offers, assets };
};

/**
 * Retrieves offers by a list of IDs from the local server.
 * Public endpoint used both internally and by external servers for federated blocked offers.
 * Wraps getLocalOffersByIds with server URL keying and error handling.
 * 
 * @param {Array<number|string>} offerIds - List of offer IDs to retrieve
 * @param {boolean} includeAssets - Whether to include associated assets in the response
 * @param {Object} user - User object for asset data access
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets?: {} } }, statusCode]
 */
const getOffersByIdsCustom = async (offerIds, includeAssets, user) => {
  const localServerUrl = config.SWAGGER_URL;

  try {
    if (!Array.isArray(offerIds) || offerIds.length === 0) {
      const empty = includeAssets
        ? { offers: [], assets: {}, serverName: config.SERVER_NAME }
        : { offers: [], serverName: config.SERVER_NAME };
      return [{ [localServerUrl]: empty }, 200];
    }

    const serverResult = await getLocalOffersByIds(offerIds, includeAssets, user);
    serverResult.serverName = config.SERVER_NAME;

    getDataLogger.info("successful offers by IDs retrieval", {
      from: "getOffersByIdsCustom",
      count: serverResult.offers.length
    });

    return [{ [localServerUrl]: serverResult }, 200];

  } catch (e) {
    getDataLogger.error("error offers by IDs retrieval", {
      from: "getOffersByIdsCustom",
      error: e.message
    });
    throw e;
  }
};

/**
 * Retrieves all blocked offers for the authenticated user from the local server only.
 * Internally fetches blocked IDs from ProsumerDB, then uses getLocalOffersByIds for data retrieval.
 * 
 * @param {boolean} includeAssets - Whether to include assets in the response
 * @param {Object} user - Authenticated user (user.username used to fetch blocked offers)
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets?: {} } }, statusCode]
 */
const getLocalBlockedOffersCustom = async (includeAssets, user, federated = false) => {
  const localServerUrl = config.SWAGGER_URL;
  const username = user.username;

  try {
    const blockedData = await PosumerDB.getProsumerBlockedOffers(username);
    const localBlockedSet = extractBlockedIdsForServer(blockedData, localServerUrl);

    // Build local result
    let localEntry;
    if (localBlockedSet.size === 0) {
      localEntry = includeAssets
        ? { offers: [], assets: {}, serverName: config.SERVER_NAME }
        : { offers: [], serverName: config.SERVER_NAME };
    } else {
      const serverResult = await getLocalOffersByIds([...localBlockedSet], includeAssets, user);
      serverResult.serverName = config.SERVER_NAME;
      localEntry = serverResult;
    }

    const result = { [localServerUrl]: localEntry };

    // ---- Federation: fetch blocked offers from favorite servers if requested ----
    if (federated) {
      const favorites = await FavoriteServersDB.getFavoriteServers(username);

      if (favorites?.servers?.length > 0) {
        const fetches = await Promise.allSettled(
          favorites.servers.map(async (serverUrl) => {
            const serverBlockedSet = extractBlockedIdsForServer(blockedData, serverUrl);

            if (serverBlockedSet.size === 0) {
              return { serverUrl, data: includeAssets ? { offers: [], assets: {} } : { offers: [] } };
            }

            try {
              const response = await Utils.fetchJSONData(
                'POST',
                serverUrl + "/v3/offers/byIds",
                { 'Content-Type': 'application/json', 'accept': 'application/json' },
                { offerIds: [...serverBlockedSet], includeAssets }
              );

              if (response.status !== 200) {
                getDataLogger.warn("server " + serverUrl + " responded with non-200 on byIds", {
                  from: "getLocalBlockedOffersCustom",
                  serverUrl,
                  status: response.status
                });
                return { serverUrl, data: null };
              }

              const externalData = await Utils.streamToJSON(response.body);
              const externalServerData = Object.values(externalData)[0];
              if (!externalServerData || !Array.isArray(externalServerData.offers)) {
                return { serverUrl, data: null };
              }

              const fetchedResult = includeAssets
                ? { offers: externalServerData.offers, assets: externalServerData.assets || {}, serverName: externalServerData.serverName || serverUrl }
                : { offers: externalServerData.offers, serverName: externalServerData.serverName || serverUrl };

              return { serverUrl, data: fetchedResult };
            } catch (fetchErr) {
              getDataLogger.error("error fetching byIds from " + serverUrl, {
                from: "getLocalBlockedOffersCustom",
                serverUrl,
                error: fetchErr.message
              });
              return { serverUrl, data: null };
            }
          })
        );

        for (const fetch of fetches) {
          if (fetch.status !== 'fulfilled' || !fetch.value.data) continue;
          result[fetch.value.serverUrl] = fetch.value.data;
        }
      }
    }

    getDataLogger.info("successful blocked offers retrieval", {
      from: "getLocalBlockedOffersCustom",
      username,
      federated,
      servers: Object.keys(result).length
    });

    return [result, 200];

  } catch (e) {
    getDataLogger.error("error blocked offers retrieval", {
      from: "getLocalBlockedOffersCustom",
      username,
      error: e.message
    });
    throw e;
  }
};


/**
 * Pure filtering function that applies filter criteria to a flat map of offers.
 * Reused across local and federated filtering contexts.
 * No side effects (no DB writes, no logging) — caller handles those.
 *
 * @param {Object} offersMap - Map of {offerId: offerObject}
 * @param {Object} allAsset - Map of {assetId: assetObject}
 * @param {Object|null} filter - Filter criteria object (null = no filtering, returns all)
 * @returns {Array} - Array of offer objects matching all filter criteria
 */
const applyOfferFilters = (offersMap, allAsset, filter) => {
  const allOfferFiltered = [];

  for (const key in offersMap) {
    let isCompatible = true;

    if (filter !== null) {
      // ---- assetType filter ----
      if (filter.hasOwnProperty("assetType")) {
        if (typeof filter["assetType"] !== "string") {
          let i = 0;
          let notFound = true;
          while (i <= filter["assetType"].length && notFound) {
            if (offersMap[key]["assetType"] == filter["assetType"][i]) {
              notFound = false;
            }
            i++;
          }
          if (notFound) { isCompatible = false; continue; }
        } else {
          if (allAsset[offersMap[key]["assetId"]]?.["assetType"]?.replaceAll(/\d+/g, '') != filter["assetType"]) {
            isCompatible = false;
            continue;
          }
        }
      }

      // ---- properties (specificAttributes) filter ----
      if (filter.hasOwnProperty("properties")) {
        if (allAsset[offersMap[key]["assetId"]]?.hasOwnProperty("specificAttributes")) {
          if (
            Object.keys(filter["properties"]).length > 0 &&
            filter["properties"].every(
              attr2 => allAsset[offersMap[key]["assetId"]]["specificAttributes"].some(
                attr1 => attr1.attributeName.toUpperCase() == attr2.attributeName.toUpperCase() &&
                         attr1.value.toUpperCase() == attr2.value.toUpperCase()
              )
            ) == false
          ) {
            isCompatible = false;
            continue;
          }
        } else {
          isCompatible = false;
          continue;
        }
      }

      // ---- GPS proximity filter (only if no cityVillage) ----
      if (filter.hasOwnProperty("latitude") && !filter.hasOwnProperty("cityVillage")) {
        if (allAsset[offersMap[key]["assetId"]]?.["specificAttributes"] !== undefined) {
          const gpsAttribute = allAsset[offersMap[key]["assetId"]]["specificAttributes"]
            .find(attribute => attribute.attributeName === "GPS");
          if (gpsAttribute !== undefined) {
            const regex = /<(-?\d+\.\d+),(-?\d+\.\d+)>/;
            const match = gpsAttribute["value"].match(regex);
            if (match !== undefined && match !== null) {
              const pointInCircle = Utils.isInPerimeter(
                filter["latitude"], filter["longitude"],
                parseFloat(match[1]), parseFloat(match[2]),
                filter["distance"]
              );
              if (!pointInCircle) { isCompatible = false; continue; }
            } else { isCompatible = false; continue; }
          } else { isCompatible = false; continue; }
        } else { isCompatible = false; continue; }
      }

      // ---- cityVillage filter ----
      if (filter.hasOwnProperty("cityVillage")) {
        if (allAsset[offersMap[key]["assetId"]]?.hasOwnProperty("specificAttributes")) {
          if (allAsset[offersMap[key]["assetId"]]["specificAttributes"].some(
            attr1 => attr1.attributeName === "City/Village" &&
                     attr1.value.toLowerCase().includes(filter["cityVillage"].toLowerCase()) === false
          )) {
            isCompatible = false;
            continue;
          }
        } else {
          isCompatible = false;
          continue;
        }
      }

      // ---- name (text search in asset name/description) ----
      if (filter.hasOwnProperty("name")) {
        const asset = allAsset[offersMap[key]["assetId"]];
        if (!(asset?.["name"]?.toLowerCase().includes(filter["name"].toLowerCase()) ||
              asset?.["description"]?.toLowerCase().includes(filter["name"].toLowerCase()))) {
          isCompatible = false;
          continue;
        }
      }

      // ---- country filter ----
      if (filter.hasOwnProperty("country") && filter["country"] != "") {
        if (offersMap[key]["country"]?.toLowerCase() != filter["country"].toLowerCase()) {
          isCompatible = false;
          continue;
        }
      }

      // ---- minPrice ----
      if (filter.hasOwnProperty("minPrice")) {
        if (offersMap[key]["price"] < filter["minPrice"]) { isCompatible = false; continue; }
      }

      // ---- maxPrice ----
      if (filter.hasOwnProperty("maxPrice")) {
        if (offersMap[key]["price"] > filter["maxPrice"]) { isCompatible = false; continue; }
      }

      // ---- maxQuantity ----
      if (filter.hasOwnProperty("maxQuantity")) {
        if (offersMap[key]["remainingQuantity"] < filter["maxQuantity"]) { isCompatible = false; continue; }
      }

      // ---- minQuantity ----
      if (filter.hasOwnProperty("minQuantity")) {
        if (offersMap[key]["remainingQuantity"] < filter["minQuantity"]) { isCompatible = false; continue; }
      }

      // ---- minDate ----
      if (filter.hasOwnProperty("minDate")) {
        if (offersMap[key]["validityLimit"] < filter["minDate"]) { isCompatible = false; continue; }
      }

      // ---- maxDate ----
      if (filter.hasOwnProperty("maxDate")) {
        if (offersMap[key]["validityLimit"] > filter["maxDate"]) { isCompatible = false; continue; }
      }

      // ---- transactionType ----
      if (filter.hasOwnProperty("transactionType")) {
        if (allAsset[offersMap[key]["assetId"]]?.["transactionType"] != filter["transactionType"]) {
          isCompatible = false;
          continue;
        }
      }

      if (isCompatible) {
        allOfferFiltered.push(offersMap[key]);
      }
    } else {
      allOfferFiltered.push(offersMap[key]);
    }
  }

  return allOfferFiltered;
};

/**
 * Retrieves filtered offers from local server only (no federation).
 * Uses getLocalOffersOnlyCustom for base offers, then applies user filter criteria.
 * Public endpoint - works with or without authentication.
 * Updates recommendation stats when assetType filter is used.
 *
 * @param {Object} filter - Filter criteria object (null returns all local offers)
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [{ [serverUrl]: { offers: [], assets: {} } }, statusCode]
 */
const getLocalOffersFilteredCustom = async (filter, user, federated = false, fromServer = false) => {
  const username = user?.username ?? "no token required";
  const localServerUrl = config.SWAGGER_URL;

  try {
    // ---- Retrieve local offers (already filtered: expired, blocked, out-of-stock) ----
    const [localOffers, localCode] = await getLocalOffersOnlyCustom(user, fromServer);

    if (localCode !== 200) {
      getDataLogger.error("error retrieving local offers", {
        from: "getLocalOffersFilteredCustom",
        username
      });
      return [localOffers, localCode];
    }

    // ---- Retrieve assets for filter checks ----
    const [allAsset, assetCode] = await Asset.getAllAssetResilink(user);

    if (assetCode !== 200) {
      getDataLogger.error("error retrieving assets", {
        from: "getLocalOffersFilteredCustom",
        username
      });
      return [allAsset, assetCode];
    }

    // ---- Convert offers array to map for applyOfferFilters ----
    const offersMap = {};
    for (const offer of localOffers[localServerUrl].offers) {
      offersMap[offer.id.toString()] = offer;
    }

    // ---- Apply filters on local offers ----
    const filtered = applyOfferFilters(offersMap, allAsset, filter);

    // ---- Build assets map for filtered offers ----
    const filteredAssets = {};
    for (const offer of filtered) {
      const assetId = offer.assetId.toString();
      filteredAssets[assetId] = allAsset[assetId];
    }

    // ---- Update recommendation stats ----
    if (username !== "public" && filter?.hasOwnProperty("assetType")) {
      await RecommendantionStatsDB.incrementAssetTypeCount(username, filter["assetType"]);
    }

    const result = { [localServerUrl]: { offers: filtered, assets: filteredAssets, serverName: config.SERVER_NAME } };

    // ---- Federation: fetch filtered offers from favorite servers if requested ----
    if (federated && user) {
      const favorites = await FavoriteServersDB.getFavoriteServers(username);

      const results = await Promise.allSettled(
        favorites.servers.map(async (serverUrl) => {
          const externalFiltered = await postFilterToFavoriteServer(
            serverUrl,
            "/v3/offers/local/all/filtered",
            filter
          );
          return { serverUrl, externalFiltered };
        })
      );

      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value.externalFiltered) continue;
        const { serverUrl, externalFiltered } = r.value;

        const serverData = Object.values(externalFiltered)[0];

        if (serverData && Array.isArray(serverData.offers)) {
          result[serverUrl] = serverData;
        } else {
          result[serverUrl] = { offers: [], assets: {}, serverName: serverUrl };
        }
      }
    }

    getDataLogger.info("success filtered data", {
      from: "getLocalOffersFilteredCustom",
      username,
      federated,
      federatedServers: federated && user ? Object.keys(result).length - 1 : 0
    });

    return [result, 200];

  } catch (e) {
    getDataLogger.error("error filtered data", {
      from: "getLocalOffersFilteredCustom",
      error: e.message,
      username
    });
    return [{ error: e }, 500];
  }
};

/**
 * Retrieves all active offers created by the authenticated user.
 * Enables prosumers to manage their published offers and monitor availability.
 * Filters out fully consumed offers for measurable assets (remainingQuantity = 0).
 * 
 * @param {Object} user - Authenticated user whose offers to retrieve
 * @returns {Promise<Array>} - [{offerId: offer, ...}, statusCode] map of user's offers
 */
const getAllOfferOwnerCustom = async (user) => {
  try {
    const username = user.username;

    const allAssetType = await AssetTypes.getAllAssetTypesResilink(user);
    const allAssetResilink = await Asset.getAllAssetResilink(user);
    const allOffer = await OfferDB.getAllOffers();

    const allOfferOwner = {};

    // Filter offers created by the current user
    for (const offer of allOffer) {
      const asset = allAssetResilink[0][offer.assetId.toString()];
      const assetType = allAssetType[0][asset.assetType];

      const isQuantityValid =
        assetType.nature === 'measurableByQuantity'
          ? (offer.remainingQuantity !== null ? offer.remainingQuantity > 0 : true)
          : true;

      if (offer.offerer === username && isQuantityValid) {
        allOfferOwner[offer.id.toString()] = offer;
      }
    }

    getDataLogger.info('Successfully retrieved offers for owner', {
      from: 'getAllOfferOwnerCustom',
      username
    });

    return [allOfferOwner, 200];
  } catch (e) {
    getDataLogger.error('Error retrieving offers for owner', {
      from: 'getAllOfferOwnerCustom',
      error: e.message,
      username: user?.username
    });
    throw e;
  }
};

/**
 * Creates a new offer in the RESILINK marketplace.
 * Offers represent prosumers' willingness to sell or rent their assets.
 * Validates asset existence and transaction type before creation.
 * Updates recommendation statistics for analytics and personalization.
 * 
 * @param {Object} body - Offer details
 * @param {Object} user - Authenticated user creating the offer (becomes offerer)
 * @returns {Promise<Array>} - [createdOffer, statusCode] or error message
 */
const createOffer = async (body, user) => {
  try {
    const username = user.username;

    // ---- Check asset existence ----
    const [asset, assetCode] =
      await Asset.getOneAsset(body.assetId, user);

    if (assetCode !== 200) {
      updateDataODEP.error(
        "error finding asset associated to offer",
        {
          from: "createOffer",
          dataToSend: body,
          username
        }
      );
      return [
        { message: `error finding asset ${body.assetId} associated to offer` },
        404
      ];
    }

    // ---- Validate asset ownership ----
    if (username !== 'admin' && asset.owner !== username) {
      updateDataODEP.error(
        "user is not the owner of the asset",
        { from: "createOffer", assetId: body.assetId, username }
      );
      return [
        { message: "you are not the owner of this asset" },
        403
      ];
    }

    // ---- Validate transaction type ----
    if (
      !body.transactionType ||
      !["sale/purchase", "rent"].includes(body.transactionType)
    ) {
      updateDataODEP.error(
        "error transactionType does not match correct values",
        {
          from: "createOffer",
          dataToSend: body,
          username
        }
      );
      return [
        { message: "transactionType does not match the correct values" },
        400
      ];
    }

    // ---- Validate offered quantity ----
    const offeredQty = body.offeredQuantity ?? 0;

    if (offeredQty <= 0) {
      updateDataODEP.error(
        "offeredQuantity must be greater than 0",
        { from: "createOffer", offeredQuantity: offeredQty, username }
      );
      return [
        { message: "offeredQuantity must be greater than 0" },
        400
      ];
    }

    const assetRemaining = asset.remainingQuantity ?? asset.totalQuantity ?? 0;

    if (offeredQty > assetRemaining) {
      updateDataODEP.error(
        "offeredQuantity exceeds asset remainingQuantity",
        {
          from: "createOffer",
          offeredQuantity: offeredQty,
          assetRemainingQuantity: assetRemaining,
          assetId: body.assetId,
          username
        }
      );
      return [
        {
          message: `offeredQuantity (${offeredQty}) exceeds asset remaining quantity (${assetRemaining})`,
          assetRemainingQuantity: assetRemaining
        },
        400
      ];
    }

    // ---- Create offer ----
    updateDataODEP.warn("data to create a new offer", {
      from: "createOffer",
      dataToSend: body,
      username
    });

    body.offerer = username;

    const data = await OfferDB.newOffer(body);

    // ---- Decrement asset remaining quantity ----
    await AssetDB.incrementAssetRemainingQuantity(body.assetId, -offeredQty);

    updateDataODEP.info(
      "success creating an offer in RESILINK",
      {
        from: "createOffer",
        username,
        offeredQuantity: offeredQty,
        newAssetRemainingQuantity: assetRemaining - offeredQty
      }
    );

    await RecommendantionStatsDB
      .incrementTotalOfferAndAssetTypeCount(
        username,
        asset.assetType
      );

    return [data, 200];

  } catch (e) {
    updateDataODEP.error(
      "error creating an offer in RESILINK",
      {
        from: "createOffer",
        error: e.message,
        username: user?.username ?? "no token required"
      }
    );
    throw e;
  }
};


/**
 * Creates both an asset and its associated offer in a single operation.
 * Streamlined workflow for prosumers listing new items: creates asset first,
 * then automatically creates offer linked to the new asset.
 * 
 * @param {Object} body - Combined payload {asset: {...}, offer: {...}}
 * @param {Object} user - Authenticated user creating asset and offer
 * @returns {Promise<Array>} - [{asset: {}, offer: {}}, statusCode] or error
 */
const createOfferAsset = async (body, user) => {
  try {

    const username = user.username;
    
    updateDataODEP.warn("data for creation", {
      from: "createOfferAsset",
      dataToSend: body,
      username
    });

    // ---- Create asset ----
    const [createdAsset, assetCode] =
      await Asset.createAsset(body.asset, user);

    if (assetCode !== 200) {
      updateDataODEP.error("error creating asset", {
        from: "createOfferAsset",
        dataReceived: createdAsset,
        username
      });
      return [createdAsset, assetCode];
    }

    // ---- Create offer linked to asset ----
    body.offer.assetId = createdAsset.id;

    const [createdOffer, offerCode] =
      await createOffer(body.offer, user);

    if (offerCode !== 200) {
      updateDataODEP.error("error creating offer", {
        from: "createOfferAsset",
        dataReceived: createdOffer,
        username
      });
      return [createdOffer, offerCode];
    }

    return [
      {
        asset: createdAsset,
        offer: createdOffer
      },
      200
    ];

  } catch (e) {
    deleteDataResilink.error(
      "error creating an offer/asset in RESILINK",
      {
        from: "createOfferAsset",
        error: e.message,
        username: user.username
      }
    );
    throw e;
  }
};

/**
 * Retrieves all offers in the RESILINK platform (no filtering applied).
 * Used for administrative dashboards and analytics.
 * Returns raw offer data including expired and out-of-stock items.
 * 
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [offers[], statusCode] with complete unfiltered list
 */
const getAllOffer = async (user) => {
  const username = user?.username ?? "no token required";

  try {
    const data = await OfferDB.getAllOffers();

    deleteDataResilink.info(
      "success retrieving all offers in RESILINK",
      {
        from: 'getAllOffer',
        username: username
      }
    );

    return [data, 200];
  } catch (e) {
    deleteDataResilink.error(
      "error retrieving all offers in RESILINK",
      {
        from: 'getAllOffer',
        dataReceiver: e.message,
        username: username
      }
    );
    throw e;
  }
};

/**
 * Retrieves detailed information for a specific offer.
 * Used for offer detail pages and transaction initiation workflows.
 * 
 * @param {string} id - Unique offer identifier
 * @param {Object} user - User object (optional for anonymous access)
 * @returns {Promise<Array>} - [offer, statusCode] tuple
 */
const getOneOffer = async (id, user) => {
  const username = user?.username ?? "no token required";
  try {
    const data = await OfferDB.getOneOffer(id);

    getDataLogger.info(
      "success retrieving the offer in RESILINK",
      {
        from: 'getOneOffer',
        username: username
      }
    );

    return [data, 200];
  } catch (e) {
    getDataLogger.error(
      "error retrieving an offer in RESILINK",
      {
        from: 'getOneOffer',
        dataReceiver: e.message,
        username: username
      }
    );
    throw e;
  }
};

/**
 * Updates an existing offer's details.
 * Only the offer creator (offerer) or admin can perform updates.
 * Allows modification of price, quantity, validity, and other offer parameters.
 * 
 * @param {Object} body - Updated offer fields wrapped in {offer: {...}}
 * @param {string} id - Offer identifier to update
 * @param {Object} user - Authenticated user (must be owner or admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const putOffer = async (body, id, user) => {
  try {
    const offer = await OfferDB.getOneOffer(id);

    if (
      user.username !== 'admin' &&
      user.username !== offer.offerer
    ) {
      updateDataODEP.error(
        'error: not the owner or administrator',
        { from: 'putOffer', username: user.username }
      );
      return [{ message: "not the owner or administrator" }, 403];
    }

    // ---- Quantity management on offeredQuantity change ----
    if (body.offer.offeredQuantity !== undefined && body.offer.offeredQuantity !== offer.offeredQuantity) {
      const newOfferedQty = body.offer.offeredQuantity;
      const oldOfferedQty = offer.offeredQuantity;
      const consumed = oldOfferedQty - (offer.remainingQuantity ?? oldOfferedQty);

      // New offered quantity must cover already-consumed amount
      if (newOfferedQty < consumed) {
        updateDataODEP.error(
          'new offeredQuantity is less than already consumed quantity',
          {
            from: 'putOffer',
            newOfferedQty,
            consumed,
            offerId: id,
            username: user.username
          }
        );
        return [
          {
            message: `new offeredQuantity (${newOfferedQty}) cannot be less than already consumed quantity (${consumed})`,
            consumedQuantity: consumed
          },
          400
        ];
      }

      const delta = newOfferedQty - oldOfferedQty;

      if (delta > 0) {
        // Need more from asset — check availability
        const asset = await AssetDB.getOneAsset(offer.assetId);
        const assetRemaining = asset.remainingQuantity ?? 0;

        if (delta > assetRemaining) {
          updateDataODEP.error(
            'quantity increase exceeds asset remaining quantity',
            {
              from: 'putOffer',
              delta,
              assetRemainingQuantity: assetRemaining,
              offerId: id,
              username: user.username
            }
          );
          return [
            {
              message: `quantity increase (${delta}) exceeds asset remaining quantity (${assetRemaining})`,
              assetRemainingQuantity: assetRemaining
            },
            400
          ];
        }
      }

      // Adjust asset remaining quantity (negative delta = increase asset, positive delta = decrease asset)
      await AssetDB.incrementAssetRemainingQuantity(offer.assetId, -delta);

      // Update offer's remainingQuantity proportionally
      body.offer.remainingQuantity = newOfferedQty - consumed;
    }

    updateDataODEP.warn(
      'new data',
      { from: 'putOffer', dataToSend: body, username: user.username }
    );

    await OfferDB.updateOfferById(id, body.offer);

    updateDataODEP.info(
      "success updating the offer in RESILINK",
      { from: 'putOffer', username: user.username }
    );

    return [{ message: "success updating the offer" }, 200];
  } catch (e) {
    updateDataODEP.error(
      "error updating an offer in RESILINK",
      { from: 'putOffer', dataReceiver: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Updates both an offer and its associated asset in a single operation.
 * Only the offer creator or admin can perform updates.
 * Ensures consistency between offer terms and asset specifications.
 * 
 * @param {Object} body - Combined payload {asset: {...}, offer: {...}}
 * @param {string} id - Offer identifier to update
 * @param {Object} user - Authenticated user (must be owner or admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const putOfferAsset = async (body, id, user) => {
  try {
    const offer = await OfferDB.getOneOffer(id);

    if (
      user.username !== 'admin' &&
      user.username !== offer.offerer
    ) {
      updateDataODEP.error(
        'error: not the owner or administrator',
        { from: 'putOfferAsset', username: user.username }
      );
      return [{ message: "not the owner or administrator" }, 403];
    }

    updateDataODEP.warn(
      'new data',
      { from: 'putOfferAsset', dataToSend: body, username: user.username }
    );

    // ---- Handle offer quantity change (delegates to putOffer logic) ----
    if (body.offer.offeredQuantity !== undefined && body.offer.offeredQuantity !== offer.offeredQuantity) {
      const [result, code] = await putOffer({ offer: body.offer }, id, user);
      if (code !== 200) {
        return [result, code];
      }
    } else {
      await OfferDB.updateOfferById(id, body.offer);
    }

    // ---- Handle asset update ----
    await Asset.putAsset(body.asset, body.offer.assetId, user);

    deleteDataResilink.info(
      "success updating the offer and the asset in RESILINK",
      { from: 'putOfferAsset', username: user.username }
    );

    return [{ message: "success updating the offer and the asset" }, 200];
  } catch (e) {
    deleteDataResilink.error(
      "error updating an offer/asset account in RESILINK",
      { from: 'putOfferAsset', dataReceiver: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Permanently deletes an offer from the platform.
 * Only the offer creator or admin can perform deletion.
 * Note: Does not delete the associated asset (asset remains available for new offers).
 * 
 * @param {string} id - Offer identifier to delete
 * @param {Object} user - Authenticated user (must be owner or admin)
 * @returns {Promise<Array>} - [successMessage, statusCode] or 403 if unauthorized
 */
const deleteOffer = async (id, user) => {
  try {
    const offer = await OfferDB.getOneOffer(id);

    if (
      user.username !== 'admin' &&
      user.username !== offer.offerer
    ) {
      getDataLogger.error(
        'error: not the owner or administrator',
        { from: 'deleteOffer', username: user.username }
      );
      return [{ message: "not the owner or administrator" }, 403];
    }

    // ---- Restore unconsumed quantity back to the asset ----
    const unconsumed = offer.remainingQuantity ?? 0;
    if (unconsumed > 0) {
      await AssetDB.incrementAssetRemainingQuantity(offer.assetId, unconsumed);

      deleteDataResilink.info(
        `restored ${unconsumed} units to asset ${offer.assetId}`,
        { from: 'deleteOffer', assetId: offer.assetId, restoredQuantity: unconsumed }
      );
    }

    await OfferDB.deleteOfferById(id);

    deleteDataResilink.info(
      "success deleting the offer in RESILINK",
      { from: 'deleteOffer', username: user.username }
    );

    return [{ message: `success deleting the offer ${id}` }, 200];
  } catch (e) {
    deleteDataResilink.error(
      "error deleting an offer account in RESILINK",
      { from: 'deleteOffer', dataReceiver: e.message, username: user?.username }
    );
    throw e;
  }
};

/**
 * Utility function to fetch offers from an external RESILINK server.
 * Authenticates with public credentials and retrieves offers for cross-server aggregation.
 * Enables federated marketplace functionality across multiple RESILINK instances.
 * Gracefully handles errors to prevent single server failures from breaking aggregation.
 * 
 * @param {string} serverUrl - Base URL of the external RESILINK server
 * @param {string} requestPath - API endpoint path (e.g., '/v3/offers/federated/all')
 * @returns {Promise<Object|null>} - Offers data or null if server unavailable/error
 */
const getOffersFromFavoriteServer = async (serverUrl, requestPath, user) => {
  try {
    const tokenData = user.token;
    const response = await Utils.fetchJSONData(
        'GET',
        serverUrl + requestPath,
        headers = {
          'accept': 'application/json',
          'Authorization': "Bearer " + tokenData["accessToken"],
          'X-Resilink-Network-Key': config.RESILINK_NETWORK_KEY
        });
    const data = await Utils.streamToJSON(response.body);
    if (response.status === 200) {
      return data;
    } else {
      getDataLogger.warn("server" + serverUrl +"responded with non-200", {
        from: "fetchOffersFromFavoriteServer",
        serverUrl,
        status: response.status
      });
      return null;
    }
  } catch (e) {
    getDataLogger.error("error fetching from " + serverUrl, {
      from: "fetchOffersFromFavoriteServer",
      serverUrl,
      error: e.message
    });
    return null;
  }
};

/**
 * Utility function to POST a filter to an external RESILINK server's filtered endpoint.
 * Authenticates with public credentials and sends filter criteria for server-side filtering.
 * Enables federated filtered search across multiple RESILINK instances.
 * 
 * @param {string} serverUrl - Base URL of the external RESILINK server
 * @param {string} requestPath - API endpoint path (e.g., '/v3/offers/local/all/filtered')
 * @param {Object} filter - Filter criteria to send to the external server
 * @returns {Promise<Object|null>} - Filtered offers data or null if server unavailable/error
 */
const postFilterToFavoriteServer = async (serverUrl, requestPath, filter) => {
  try {
    const response = await Utils.fetchJSONData(
        'POST',
        serverUrl + requestPath,
        {
          'Content-Type': 'application/json',
          'accept': 'application/json',
          'X-Resilink-Network-Key': config.RESILINK_NETWORK_KEY
        },
        filter
    );
    const data = await Utils.streamToJSON(response.body);
    if (response.status === 200) {
      return data;
    } else {
      getDataLogger.warn("server " + serverUrl + " responded with non-200 on filtered", {
        from: "postFilterToFavoriteServer",
        serverUrl,
        status: response.status
      });
      return null;
    }
  } catch (e) {
    getDataLogger.error("error posting filter to " + serverUrl, {
      from: "postFilterToFavoriteServer",
      serverUrl,
      error: e.message
    });
    return null;
  }
};

module.exports = {
    getLocalOffersOnlyCustom,
    getFederatedOffersCustom,
    getLimitedOfferForResilinkCustom,
    getWeightedLimitedOffersForResilink,
    getOffersByIdsCustom,
    getLocalBlockedOffersCustom,
    getLocalOffersFilteredCustom,
    getAllOfferOwnerCustom,
    createOffer,
    createOfferAsset,
    getAllOffer,
    getOneOffer,
    putOffer,
    putOfferAsset,
    deleteOffer,
}