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
*****************************************************************************/

const winston = require('winston');
const config = require('./config.js');
require('winston-mongodb');

const { combine, timestamp, json, prettyPrint, metadata } = winston.format;

// MongoDB Atlas cluster connection URL
const url = config.DB_LOGS_URL; //'mongodb+srv://' + _username + ':' + _password + '@clusterinit.pvcejia.mongodb.net/Logs?retryWrites=true&w=majority&appName=AtlasApp';

const mongoOptions = (collectionName) => ({
    db: url,
    collection: collectionName,
    level: 'info',
    options: { useNewUrlParser: true, useUnifiedTopology: true },
});

winston.loggers.add('GetDataLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('GetLogs'))
    ],
    defaultMeta: { service: 'getDataODEPService' }
});

winston.loggers.add('UpdateDataODEPLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('PutLogs'))
    ],
    defaultMeta: { service: 'UpdateDataODEPService' }
});

winston.loggers.add('UpdateDataResilinkLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('PutLogs'))
    ],
    defaultMeta: { service: 'UpdateDataResilinkService' }
});

winston.loggers.add('DeleteDataODEPLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('DeleteLogs'))
    ],
    defaultMeta: { service: 'DeleteDataODEPService' }
});

winston.loggers.add('DeleteDataResilinkLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('DeleteLogs'))
    ],
    defaultMeta: { service: 'DeleteDataResilinkService' }
});

winston.loggers.add('ConnectDBResilinkLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('ConnectionLogs'))
    ],
    defaultMeta: { service: 'ConnectDBResilinkService' }
});

winston.loggers.add('PatchDataODEPLogger', {
    format: combine(
        json(),
        timestamp(),
        prettyPrint(),
        metadata({ fillExcept: ['message', 'level', 'timestamp'] })
    ),
    transports: [
        new winston.transports.MongoDB(mongoOptions('PatchLogs'))
    ],
    defaultMeta: { service: 'PatchDataODEPService' }
});
