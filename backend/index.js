require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes/index');
const DataProtectionMonitor = require('./middleware/dataProtection');
const { logInfo, logError, logWarn, logDebug, logRequest } = require('./utils/logger');
const { errorHandler, notFoundHandler, addRequestId } = require('./utils/errorHandler');
const { initializeCache, closeCache } = require('./utils/cache');
const { 
  createIndexes, 
  optimizeConnection, 
  startPerformanceMonitoring, 
  optimizeSchemas 
} = require('./utils/databaseOptimizer');
// Import Passport configuration
require('./config/passport');

// Import email scheduler
const { startEmailScheduler } = require('./utils/emailScheduler');

// Initialize Data Protection Monitor
const dataProtectionMonitor = DataProtectionMonitor.instance;
logInfo('🛡️ Data Protection Monitor initialized');

const app = express();
const PORT = process.env.PORT || 4002;

// Trust proxy for rate limiting in production (Render)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://www.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting with environment-based configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Chat rate limiter - generous for chat interactions (users chat a lot!)
const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX) || (isDevelopment ? 1000 : 500), // Increased from 300 to 500
  message: {
    error: 'Too many chat requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust proxy for X-Forwarded-For headers
});

// Auth rate limiter - reasonable for normal usage
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || (isDevelopment ? 500 : 100), // Increased from 50 to 100
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust proxy for X-Forwarded-For headers
});

// General rate limiter - for all other API endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.GENERAL_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.GENERAL_RATE_LIMIT_MAX) || (isDevelopment ? 1000 : 300), // Increased from 200 to 300
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true, // Trust proxy for X-Forwarded-For headers
});

// Apply different rate limits to different routes
app.use('/api/auth', authLimiter); // Very strict for auth
app.use('/api/chat', chatLimiter); // More generous for chat
app.use('/api', generalLimiter); // General limit for other endpoints

// Middleware
// Universal tracking middleware (temporarily disabled for testing)
// const { trackAPICalls, trackUserSessions } = require('./middleware/universalTracking');
// app.use('/api', trackAPICalls);
// app.use('/api', trackUserSessions);

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add comprehensive input sanitization middleware
const { comprehensiveSanitization } = require('./middleware/validation');
app.use(comprehensiveSanitization);

// Get session secret with proper error handling
function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    logWarn('SESSION_SECRET not set, using development fallback. This should not be used in production.');
    return 'dev-session-secret-only-for-development';
  }
  return secret;
}

// MongoDB connection configuration
// Force database name for Atlas connections BEFORE setting MONGODB_URI
const atlasUri = process.env.MONGODB_URI;
let MONGODB_URI;

if (atlasUri && atlasUri.includes('mongodb+srv://')) {
  if (!atlasUri.includes('/jules_dating')) {
    // Fix the URI construction - insert database name before query parameters
    // Original: mongodb+srv://user:pass@cluster.mongodb.net/?params
    // Fixed:    mongodb+srv://user:pass@cluster.mongodb.net/jules_dating?params
    MONGODB_URI = atlasUri.replace('mongodb.net/?', 'mongodb.net/jules_dating?');
    console.log('🔧 Fixed Atlas URI with database name:', MONGODB_URI);
  } else {
    MONGODB_URI = atlasUri;
    console.log('✅ Atlas URI already has database name:', MONGODB_URI);
  }
} else {
  MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating';
  console.log('🔧 Using local MongoDB URI:', MONGODB_URI);
}

// Session configuration with MongoDB store (production-ready)
const sessionConfig = {
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  // Use MongoDB for session storage (production-ready)
  store: require('connect-mongo').create({
    mongoUrl: MONGODB_URI,
    touchAfter: 24 * 3600, // lazy session update (24 hours)
    ttl: 7 * 24 * 60 * 60 // 7 days session expiry
  })
};

logInfo('Using MongoDB session store for production-ready session management');
app.use(session(sessionConfig));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialize Segment Analytics
try {
  const segment = require('./utils/segment');
  console.log('📊 Segment Analytics service loaded');
} catch (error) {
  console.warn('⚠️  Segment Analytics failed to load:', error.message);
}

// MongoDB connection options - optimized for performance and reliability
const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  bufferCommands: true,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  // Connection pooling for better performance (increased for 50-100 users)
  maxPoolSize: 20,        // Keep up to 20 connections open (increased from 10)
  minPoolSize: 10,        // Always have at least 10 connections ready (increased from 5)
  maxIdleTimeMS: 30000    // Keep connections alive for 30 seconds
};

// Function to connect to MongoDB with retry logic
async function connectToMongoDB() {
  const maxRetries = 3; // Increased retries for better reliability
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      logInfo(`Attempting to connect to MongoDB (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Add a timeout to the connection attempt
      const connectionPromise = mongoose.connect(MONGODB_URI, mongooseOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      logInfo('Successfully connected to MongoDB', {
        poolSize: mongooseOptions.maxPoolSize,
        database: MONGODB_URI.split('/').pop().split('?')[0]
      });
      
      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        logError('MongoDB connection error', err);
      });

      mongoose.connection.on('disconnected', () => {
        logWarn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logInfo('MongoDB reconnected');
      });

      return true;
    } catch (error) {
      retryCount++;
      logError(`MongoDB connection attempt ${retryCount} failed`, error);
      
      if (retryCount < maxRetries) {
        const delay = 1000; // Fixed delay instead of exponential backoff
        logInfo(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        logError('Failed to connect to MongoDB after all retry attempts');
        logWarn('Server will start without database connection - some features may be limited');
        return false;
      }
    }
  }
}

// Graceful shutdown function
async function gracefulShutdown(signal) {
  logInfo(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close cache connection
    await closeCache();
    
    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      logInfo('Closing MongoDB connection...');
      await mongoose.connection.close();
      logInfo('MongoDB connection closed');
    }
    
    // Close server
    if (server) {
      logInfo('Closing HTTP server...');
      server.close(() => {
        logInfo('HTTP server closed');
        process.exit(0);
      });
      
      // Force exit after 10 seconds
      setTimeout(() => {
        logError('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
}

// Initialize cache
initializeCache();

// Add request ID and logging middleware
app.use(addRequestId);
app.use(logRequest);

// Session management middleware (after auth, before routes)
const { sessionManagerMiddleware } = require('./middleware/sessionManager');
app.use('/api', sessionManagerMiddleware);

// Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Jules Style Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Start server and capture instance for graceful shutdown
const server = app.listen(PORT, () => {
  logInfo(`Jules Dating Backend running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/api/health`
  });
  
  // Start email scheduler after server is running
  startEmailScheduler();
});

// Connect to MongoDB and initialize optimizations (non-blocking)
connectToMongoDB().then(async (connected) => {
  if (connected) {
    try {
      // Optimize database connection
      optimizeConnection();
      
      // Create database indexes (with timeout)
      const indexesPromise = createIndexes();
      const indexesTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Index creation timeout')), 15000)
      );
      await Promise.race([indexesPromise, indexesTimeout]);
      
      // Optimize schemas
      optimizeSchemas();
      
      // Start performance monitoring
      startPerformanceMonitoring();
      
      logInfo('Database initialization completed successfully');
    } catch (error) {
      logError('Database initialization failed, but server will continue:', error);
    }
  } else {
    logWarn('Server running without database connection - some features may be limited');
  }
}).catch((error) => {
  logError('Failed to connect to MongoDB during startup', error);
  logWarn('Server will continue without database connection');
});

// Set up graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', new Error(`Promise: ${promise}, Reason: ${reason}`));
  gracefulShutdown('unhandledRejection');
});