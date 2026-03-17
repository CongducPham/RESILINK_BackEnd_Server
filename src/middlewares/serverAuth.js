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
