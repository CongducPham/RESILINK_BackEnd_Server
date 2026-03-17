const config = require('../v3/config.js');

/**
 * Optional middleware that detects if the request comes from another RESILINK server.
 * Does NOT block the request if the header is missing or invalid — it simply
 * sets `req.fromServer = true` when the header is present and valid.
 * 
 * Detection is based on the `X-Resilink-Network-Key` header matching
 * the configured RESILINK_NETWORK_KEY environment variable.
 * 
 * This allows route handlers to differentiate between:
 *   - User/developer calls (req.fromServer = false) → return all offers
 *   - Server-to-server calls (req.fromServer = true) → return only shared offers
 */
module.exports = function detectServerCall(req, res, next) {
  const networkKey = req.header('X-Resilink-Network-Key');

  req.fromServer = !!(
    networkKey &&
    config.RESILINK_NETWORK_KEY &&
    networkKey === config.RESILINK_NETWORK_KEY
  );

  next();
};
