const mongoose = require('mongoose');
const { logInfo, logError, logWarn, logDebug } = require('./logger');

// Query performance monitoring
const queryStats = {
  totalQueries: 0,
  slowQueries: 0,
  averageQueryTime: 0,
  queriesByCollection: {},
  slowQueryThreshold: 100 // ms
};

// Track query performance
function trackQuery(collection, operation, duration, query = {}) {
  queryStats.totalQueries++;
  
  // Update average query time
  const currentAvg = queryStats.averageQueryTime;
  const newAvg = (currentAvg * (queryStats.totalQueries - 1) + duration) / queryStats.totalQueries;
  queryStats.averageQueryTime = Math.round(newAvg);
  
  // Track by collection
  if (!queryStats.queriesByCollection[collection]) {
    queryStats.queriesByCollection[collection] = {
      total: 0,
      slow: 0,
      averageTime: 0
    };
  }
  
  const collectionStats = queryStats.queriesByCollection[collection];
  collectionStats.total++;
  
  // Update collection average
  const collectionAvg = collectionStats.averageTime;
  const newCollectionAvg = (collectionAvg * (collectionStats.total - 1) + duration) / collectionStats.total;
  collectionStats.averageTime = Math.round(newCollectionAvg);
  
  // Track slow queries
  if (duration > queryStats.slowQueryThreshold) {
    queryStats.slowQueries++;
    collectionStats.slow++;
    
    logWarn('Slow query detected', {
      collection,
      operation,
      duration: `${duration}ms`,
      query: JSON.stringify(query).substring(0, 200),
      threshold: `${queryStats.slowQueryThreshold}ms`
    });
  }
  
  // Log all queries in debug mode
  logDebug('Database query', {
    collection,
    operation,
    duration: `${duration}ms`,
    totalQueries: queryStats.totalQueries
  });
}

// Optimized query wrapper
function optimizedQuery(query, options = {}) {
  const startTime = Date.now();
  
  return query.exec().then(result => {
    const duration = Date.now() - startTime;
    trackQuery(query.model.collection.name, 'find', duration, query.getQuery());
    return result;
  }).catch(error => {
    const duration = Date.now() - startTime;
    logError('Query failed', {
      collection: query.model.collection.name,
      operation: 'find',
      duration: `${duration}ms`,
      error: error.message,
      query: JSON.stringify(query.getQuery()).substring(0, 200)
    });
    throw error;
  });
}

// Create database indexes for better performance
async function createIndexes() {
  try {
    logInfo('Creating database indexes for performance optimization...');
    
    // User collection indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('users').createIndex({ resetPasswordToken: 1 });
    await mongoose.connection.db.collection('users').createIndex({ createdAt: -1 });
    
    // Conversation collection indexes
    await mongoose.connection.db.collection('conversations').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('conversations').createIndex({ createdAt: -1 });
    await mongoose.connection.db.collection('conversations').createIndex({ userId: 1, createdAt: -1 });
    
    // ClosetItem collection indexes
    await mongoose.connection.db.collection('closetitems').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('closetitems').createIndex({ category: 1 });
    await mongoose.connection.db.collection('closetitems').createIndex({ userId: 1, category: 1 });
    await mongoose.connection.db.collection('closetitems').createIndex({ createdAt: -1 });
    
    // FitCheck collection indexes
    await mongoose.connection.db.collection('fitchecks').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('fitchecks').createIndex({ createdAt: -1 });
    await mongoose.connection.db.collection('fitchecks').createIndex({ userId: 1, createdAt: -1 });
    
    // WishListItem collection indexes
    await mongoose.connection.db.collection('wishlistitems').createIndex({ userId: 1 });
    await mongoose.connection.db.collection('wishlistitems').createIndex({ category: 1 });
    await mongoose.connection.db.collection('wishlistitems').createIndex({ userId: 1, category: 1 });
    
    logInfo('Database indexes created successfully');
  } catch (error) {
    logError('Failed to create database indexes', error);
  }
}

// Query optimization helpers
const queryOptimizers = {
  // Optimize user queries
  user: {
    // Get user with minimal fields
    getMinimal: (userId) => {
      return mongoose.model('User').findById(userId)
        .select('name email isAdmin')
        .lean();
    },
    
    // Get user profile with all fields
    getProfile: (userId) => {
      return mongoose.model('User').findById(userId)
        .select('-password')
        .lean();
    },
    
    // Search users efficiently
    search: (searchTerm, limit = 10) => {
      return mongoose.model('User').find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      })
      .select('name email')
      .limit(limit)
      .lean();
    }
  },
  
  // Optimize conversation queries
  conversation: {
    // Get recent conversations with pagination
    getRecent: (userId, page = 1, limit = 20) => {
      const skip = (page - 1) * limit;
      return mongoose.model('Conversation').find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    },
    
    // Get conversation count
    getCount: (userId) => {
      return mongoose.model('Conversation').countDocuments({ userId });
    }
  },
  
  // Optimize closet queries
  closet: {
    // Get items by category with pagination
    getByCategory: (userId, category, page = 1, limit = 20) => {
      const skip = (page - 1) * limit;
      return mongoose.model('ClosetItem').find({ userId, category })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    },
    
    // Get closet statistics
    getStats: (userId) => {
      return mongoose.model('ClosetItem').aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: '$category',
          count: { $sum: 1 }
        }}
      ]);
    }
  }
};

// Database connection optimization
function optimizeConnection() {
  // Set mongoose options for better performance
  // Enable debug mode only in development
  mongoose.set('debug', process.env.NODE_ENV === 'development' && process.env.MONGODB_DEBUG === 'true');
  
  // Optimize query performance
  mongoose.set('autoIndex', false); // Disable auto-indexing in production
  
  logInfo('Database connection optimized');
}

// Get query statistics
function getQueryStats() {
  return {
    ...queryStats,
    timestamp: new Date().toISOString()
  };
}

// Reset query statistics
function resetQueryStats() {
  queryStats.totalQueries = 0;
  queryStats.slowQueries = 0;
  queryStats.averageQueryTime = 0;
  queryStats.queriesByCollection = {};
}

// Monitor database performance
function startPerformanceMonitoring() {
  // Monitor every 5 minutes
  setInterval(() => {
    const stats = getQueryStats();
    
    if (stats.slowQueries > 0) {
      logWarn('Database performance alert', {
        slowQueries: stats.slowQueries,
        totalQueries: stats.totalQueries,
        averageQueryTime: `${stats.averageQueryTime}ms`,
        slowQueryPercentage: Math.round((stats.slowQueries / stats.totalQueries) * 100)
      });
    }
    
    // Reset stats every hour
    if (stats.totalQueries > 1000) {
      resetQueryStats();
    }
  }, 5 * 60 * 1000); // 5 minutes
  
  logInfo('Database performance monitoring started');
}

// Optimize model schemas
function optimizeSchemas() {
  // Add schema-level optimizations
  const User = mongoose.model('User');
  const Conversation = mongoose.model('Conversation');
  const ClosetItem = mongoose.model('ClosetItem');
  const FitCheck = mongoose.model('FitCheck');
  const WishListItem = mongoose.model('WishListItem');
  
  // Set schema options for better performance
  [User, Conversation, ClosetItem, FitCheck, WishListItem].forEach(model => {
    if (model.schema) {
      // Optimize schema options
      model.schema.set('timestamps', true);
      model.schema.set('toJSON', { virtuals: false });
      model.schema.set('toObject', { virtuals: false });
    }
  });
  
  logInfo('Database schemas optimized');
}

module.exports = {
  trackQuery,
  optimizedQuery,
  createIndexes,
  queryOptimizers,
  optimizeConnection,
  getQueryStats,
  resetQueryStats,
  startPerformanceMonitoring,
  optimizeSchemas
}; 