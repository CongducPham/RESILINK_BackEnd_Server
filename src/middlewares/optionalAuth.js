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
