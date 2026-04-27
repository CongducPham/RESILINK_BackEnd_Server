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

const winston = require('winston');

const securityLogger = winston.loggers.get('SecurityLogger');

module.exports = function networkKeyAuth(req, res, next) {
  const networkKey = req.header('X-Resilink-Network-Key');

  if (!networkKey) {
    securityLogger.warn('Missing network key', {
      from: 'networkKeyAuth',
      ip: req.ip,
      path: req.originalUrl
    });
    return res.status(401).json({ message: 'Missing network key' });
  }

  if (networkKey !== process.env.RESILINK_NETWORK_KEY) {
    securityLogger.warn('Invalid network key', {
      from: 'networkKeyAuth',
      ip: req.ip,
      path: req.originalUrl
    });
    return res.status(403).json({ message: 'Invalid network key' });
  }

  req.network = {
    trusted: true
  };

  next();
};
