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
