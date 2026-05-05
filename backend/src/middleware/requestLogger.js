// Custom Request Logger Middleware
// Logs HTTP requests with method, path, status, and response time

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override send to log response
  res.send = function (data) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;

    const logMessage = `${method} ${path} - Status: ${statusCode} - ${duration}ms - IP: ${ip}`;

    // Log based on status code
    if (statusCode >= 400) {
      logger.error(logMessage);
    } else if (statusCode >= 200 && statusCode < 300) {
      logger.info(logMessage);
    } else {
      logger.warn(logMessage);
    }

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

module.exports = requestLogger;
