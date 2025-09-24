const { logError } = require('./logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400);
    this.details = details;
    this.type = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.type = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.type = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.type = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.type = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
    this.type = 'RateLimitError';
  }
}

// Error message mappings for user-friendly responses
const errorMessages = {
  // Authentication errors
  'JsonWebTokenError': 'Invalid authentication token',
  'TokenExpiredError': 'Authentication token has expired',
  'NoTokenError': 'Authentication token is required',
  
  // Database errors
  'CastError': 'Invalid data format',
  'ValidationError': 'Data validation failed',
  'DuplicateKeyError': 'This information already exists',
  'ConnectionError': 'Database connection failed',
  
  // File upload errors
  'FileTooLargeError': 'File size exceeds the limit',
  'InvalidFileTypeError': 'File type not supported',
  'UploadError': 'File upload failed',
  
  // API errors
  'OpenAIError': 'AI service temporarily unavailable',
  'ExternalAPIError': 'External service error',
  'NetworkError': 'Network connection failed',
  
  // General errors
  'ValidationFailed': 'Please check your input and try again',
  'ServerError': 'Something went wrong on our end',
  'UnknownError': 'An unexpected error occurred'
};

// Get user-friendly error message
function getUserFriendlyMessage(error) {
  const errorName = error.name || error.type || 'UnknownError';
  return errorMessages[errorName] || errorMessages['UnknownError'];
}

// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log the error with context
  logError('Express error handler', err, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    errorType: err.name || err.type,
    statusCode: err.statusCode || 500
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new AppError(message, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error = new ValidationError('Validation failed', details);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    error = new RateLimitError();
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = 'Internal server error';
  }

  // Prepare response
  const response = {
    error: getUserFriendlyMessage(error),
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  };

  // Add details for validation errors
  if (error.details && Array.isArray(error.details)) {
    response.details = error.details;
  }

  // Add request ID for tracking (if available)
  if (req.id) {
    response.requestId = req.id;
  }

  // Add more details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.message = error.message;
  }

  res.status(error.statusCode).json(response);
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
function notFoundHandler(req, res, next) {
  const error = new NotFoundError('API endpoint');
  next(error);
}

// Request ID middleware for error tracking
function addRequestId(req, res, next) {
  req.id = Math.random().toString(36).substr(2, 9);
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  addRequestId,
  getUserFriendlyMessage
}; 