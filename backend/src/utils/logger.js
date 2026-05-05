// Logger Utility
// File-based logging with daily rotation and multiple log levels

const fs = require('fs');
const path = require('path');

const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const getCurrentLogFileName = (level) => {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `${level}-${date}.log`);
};

const formatLogMessage = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${dataStr}\n`;
};

const writeLog = (level, message, data = {}) => {
  const logLevel = LOG_LEVELS[level] || LOG_LEVELS.info;
  const currentLevel = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

  if (logLevel > currentLevel) return;

  const fileName = getCurrentLogFileName(level);
  const allLogsFile = path.join(LOG_DIR, 'all.log');
  const logMessage = formatLogMessage(level, message, data);

  // Write to level-specific file
  fs.appendFileSync(fileName, logMessage, { encoding: 'utf8' });

  // Write to combined log file
  fs.appendFileSync(allLogsFile, logMessage, { encoding: 'utf8' });

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(logMessage);
  }
};

const logger = {
  error: (message, data) => writeLog('error', message, data),
  warn: (message, data) => writeLog('warn', message, data),
  info: (message, data) => writeLog('info', message, data),
  debug: (message, data) => writeLog('debug', message, data),
};

module.exports = logger;
