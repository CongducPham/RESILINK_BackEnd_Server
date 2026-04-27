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

const IP_ADDRESS = process.env.IP_ADDRESS;

const PORT = process.env.PORT;

const SWAGGER_URL = process.env.SWAGGER_URL;

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

const TOKEN_KEY = process.env.TOKEN_KEY;

const TOKEN_REQUIRED = process.env.TOKEN_REQUIRED === "true";

const CENTRAL_SERVER_URL = process.env.CENTRAL_SERVER_URL;

const RESILINK_NETWORK_KEY = process.env.RESILINK_NETWORK_KEY;

const SERVER_NAME = process.env.SERVER_NAME || "RESILINK Server";

// ------------------ DB CONFIG ------------------ //
const DB_MODE = process.env.DB_MODE;

let DB_URL;
let DB_LOGS_URL;

if (DB_MODE === "local") {
    DB_URL = "mongodb://127.0.0.1:27017/ResilinkWithoutODEP";
    DB_LOGS_URL = "mongodb://127.0.0.1:27017/Logs";
} else {
    DB_URL = process.env.DB_URL;
    DB_LOGS_URL = process.env.DB_LOGS_URL;
}

module.exports = {
    IP_ADDRESS,
    PORT,
    SWAGGER_URL,
    SERVER_NAME,
    ENCRYPTION_KEY,
    TOKEN_KEY,
    TOKEN_REQUIRED,
    CENTRAL_SERVER_URL,
    RESILINK_NETWORK_KEY,
    DB_MODE,
    DB_URL,
    DB_LOGS_URL
}
