const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Configure logging levels based on environment
const logLevel = isProduction ? 'info' : 'debug';

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format,
  }),
  
  // File transport for errors (only in development)
  ...(process.env.NODE_ENV !== 'production' ? [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // File transport for all logs (only in development)
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ] : []),
];

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  levels,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper functions for different log types
const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

const logError = (message, error = null, meta = {}) => {
  if (error) {
    logger.error(`${message}: ${error.message}`, {
      ...meta,
      stack: error.stack,
      name: error.name,
    });
  } else {
    logger.error(message, meta);
  }
};

const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

const logHttp = (message, meta = {}) => {
  logger.http(message, meta);
};

// Request logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    };
    
    // Update metrics if healthCheck module is available
    try {
      const { updateMetrics } = require('./healthCheck');
      updateMetrics(duration, isError);
    } catch (error) {
      // Health check module not available, continue without metrics
    }
    
    if (isError) {
      logError(`HTTP ${req.method} ${req.url}`, null, logData);
    } else {
      logHttp(`HTTP ${req.method} ${req.url}`, logData);
    }
  });
  
  next();
};

// Database logging middleware
const logDatabase = (operation, collection, duration, success = true) => {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    success,
  };
  
  if (success) {
    logDebug(`Database ${operation} on ${collection}`, logData);
  } else {
    logError(`Database ${operation} failed on ${collection}`, null, logData);
  }
};

// API logging middleware
const logAPI = (endpoint, method, duration, status, userId = null) => {
  const logData = {
    endpoint,
    method,
    duration: `${duration}ms`,
    status,
    userId,
  };
  
  if (status >= 400) {
    logError(`API ${method} ${endpoint} failed`, null, logData);
  } else {
    logInfo(`API ${method} ${endpoint} completed`, logData);
  }
};

module.exports = {
  logger,
  logInfo,
  logError,
  logWarn,
  logDebug,
  logHttp,
  logRequest,
  logDatabase,
  logAPI,
}; 