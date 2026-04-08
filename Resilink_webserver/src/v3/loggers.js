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
