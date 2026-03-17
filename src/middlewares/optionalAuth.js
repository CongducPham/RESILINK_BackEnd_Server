const Utils = require("../v3/services/Utils.js");
const winston = require("winston");

const getDataLogger = winston.loggers.get("GetDataLogger");

module.exports = function auth({ required = true } = {}) {
  return (req, res, next) => {
    const authHeader = req.header("Authorization");

    // If authentication is not required, skip validation and proceed to next middleware
    if (!required) {
      if (!authHeader) {
        // No token provided, proceed as anonymous user
        req.user = null;
      } else {
        // Validate the token and check if it's associated with a valid user
        if (Utils.validityToken(authHeader)) {
          req.user = {
            username: Utils.getUserIdFromToken(
              authHeader.replace(/^Bearer\s+/i, "")
            ),
            token: authHeader
          };
        } else {
          req.user = null;
        }
      }
    } else {
      // Check if Authorization header is present
      if (!authHeader) {

        getDataLogger.error("error: Unauthorize", {
          from: "auth.middleware",
          username: "no token provided"
        });

        return res.status(401).send({ message: "Unauthorize: no token provided" });
      }

      // Validate the token and check if it's associated with a valid user
      if (!Utils.validityToken(authHeader)) {
        getDataLogger.error("error: Unauthorize", {
          from: "auth.middleware",
          username:
            Utils.getUserIdFromToken(authHeader.replace(/^Bearer\s+/i, "")) ??
            "no user associated with the token"
        });

        return res.status(401).send({ message: "Unauthorize: no user associated with the token" });
      }

      // User/token injected into the request
      req.user = {
        username: Utils.getUserIdFromToken(
          authHeader.replace(/^Bearer\s+/i, "")
        ),
        token: authHeader
      };
    }

    next();
  };
};
