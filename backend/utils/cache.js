const redis = require('redis');
const { logInfo, logError, logWarn } = require('./logger');

// Cache configuration
const CACHE_CONFIG = {
  // Performance data (safe to cache)
  PRODUCT_DATA: { ttl: 300 }, // 5 minutes
  USER_PROFILE: { ttl: 600 }, // 10 minutes
  STYLE_GUIDELINES: { ttl: 3600 }, // 1 hour
  IMAGE_URLS: { ttl: 1800 }, // 30 minutes
  API_RESPONSES: { ttl: 300 }, // 5 minutes
  
  // Never cache (Jules's personality)
  CHAT_RESPONSES: { ttl: 0 }, // Never cache
  CONVERSATION_CONTEXT: { ttl: 0 }, // Never cache
  PERSONALIZED_ADVICE: { ttl: 0 }, // Never cache
  REAL_TIME_RECOMMENDATIONS: { ttl: 0 } // Never cache
};

// Redis client - TEMPORARILY DISABLED
let redisClient = null;
const REDIS_DISABLED = true; // Temporary fix for Redis connection issues

// Initialize Redis connection
async function initializeCache() {
  // Check if Redis should be disabled via environment variable
  if (process.env.DISABLE_REDIS === 'true') {
    logWarn('Redis disabled via DISABLE_REDIS environment variable, using memory cache only');
    return false;
  }
  
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        // Stop retrying on authentication errors
        if (options.error && options.error.message && options.error.message.includes('WRONGPASS')) {
          logWarn('Redis authentication failed, using memory cache fallback');
          return null; // Stop retrying
        }
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logWarn('Redis server refused connection, using memory cache fallback');
          return null; // Stop retrying
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logError('Redis retry time exhausted');
          return null;
        }
        if (options.attempt > 5) {
          logError('Redis max retry attempts reached');
          return null;
        }
        return Math.min(options.attempt * 200, 5000);
      }
    });

    redisClient.on('error', (err) => {
      logError('Redis client error', err);
    });

    redisClient.on('connect', () => {
      logInfo('Redis client connected');
    });

    redisClient.on('ready', () => {
      logInfo('Redis client ready');
    });

    await redisClient.connect();
    return true;
  } catch (error) {
    logWarn('Redis connection failed, using memory cache fallback', error);
    return false;
  }
}

// Memory cache fallback
const memoryCache = new Map();

// Generate cache key
function generateCacheKey(prefix, identifier, userId = null) {
  const parts = [prefix];
  if (userId) parts.push(`user:${userId}`);
  parts.push(identifier);
  return parts.join(':');
}

// Get from cache
async function get(key) {
  try {
    if (redisClient && redisClient.isReady) {
      const value = await redisClient.get(key);
      if (value) {
        logInfo(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
    } else {
      // Fallback to memory cache
      const value = memoryCache.get(key);
      if (value && value.expiresAt > Date.now()) {
        logInfo(`Memory cache HIT: ${key}`);
        return value.data;
      } else if (value) {
        memoryCache.delete(key);
      }
    }
    
    logInfo(`Cache MISS: ${key}`);
    return null;
  } catch (error) {
    logError('Cache get error', error);
    return null;
  }
}

// Set cache
async function set(key, value, ttl = 300) {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      logInfo(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        data: value,
        expiresAt: Date.now() + (ttl * 1000)
      });
      logInfo(`Memory cache SET: ${key} (TTL: ${ttl}s)`);
    }
    return true;
  } catch (error) {
    logError('Cache set error', error);
    return false;
  }
}

// Delete from cache
async function del(key) {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.del(key);
    } else {
      memoryCache.delete(key);
    }
    logInfo(`Cache DEL: ${key}`);
    return true;
  } catch (error) {
    logError('Cache delete error', error);
    return false;
  }
}

// Clear user-specific cache
async function clearUserCache(userId) {
  try {
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys(`*:user:${userId}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logInfo(`Cleared ${keys.length} cache entries for user ${userId}`);
      }
    } else {
      // Clear from memory cache
      let cleared = 0;
      for (const [key] of memoryCache) {
        if (key.includes(`user:${userId}`)) {
          memoryCache.delete(key);
          cleared++;
        }
      }
      logInfo(`Cleared ${cleared} memory cache entries for user ${userId}`);
    }
    return true;
  } catch (error) {
    logError('Clear user cache error', error);
    return false;
  }
}

// Cache middleware for API responses
function cacheMiddleware(prefix, ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Skip caching for chat and personalized content
    if (req.path.includes('/chat') || req.path.includes('/personalized')) {
      return next();
    }

    const userId = req.user?.id;
    const cacheKey = keyGenerator 
      ? keyGenerator(req, userId)
      : generateCacheKey(prefix, req.originalUrl, userId);

    try {
      const cachedData = await get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data) {
        // Don't cache error responses
        if (res.statusCode < 400) {
          set(cacheKey, data, ttl);
        }
        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logError('Cache middleware error', error);
      next();
    }
  };
}

// Product data caching
async function cacheProductData(productId, data) {
  const key = generateCacheKey('product', productId);
  return await set(key, data, CACHE_CONFIG.PRODUCT_DATA.ttl);
}

async function getCachedProductData(productId) {
  const key = generateCacheKey('product', productId);
  return await get(key);
}

// User profile caching
async function cacheUserProfile(userId, data) {
  const key = generateCacheKey('profile', userId, userId);
  return await set(key, data, CACHE_CONFIG.USER_PROFILE.ttl);
}

async function getCachedUserProfile(userId) {
  const key = generateCacheKey('profile', userId, userId);
  return await get(key);
}

// Style guidelines caching
async function cacheStyleGuidelines(category, data) {
  const key = generateCacheKey('style', category);
  return await set(key, data, CACHE_CONFIG.STYLE_GUIDELINES.ttl);
}

async function getCachedStyleGuidelines(category) {
  const key = generateCacheKey('style', category);
  return await get(key);
}

// API response caching
async function cacheApiResponse(endpoint, params, data) {
  const key = generateCacheKey('api', `${endpoint}:${JSON.stringify(params)}`);
  return await set(key, data, CACHE_CONFIG.API_RESPONSES.ttl);
}

async function getCachedApiResponse(endpoint, params) {
  const key = generateCacheKey('api', `${endpoint}:${JSON.stringify(params)}`);
  return await get(key);
}

// Cache statistics
async function getCacheStats() {
  try {
    if (redisClient && redisClient.isReady) {
      const info = await redisClient.info();
      const memoryCacheSize = memoryCache.size;
      
      return {
        redis: {
          connected: true,
          info: info
        },
        memory: {
          size: memoryCacheSize
        }
      };
    } else {
      return {
        redis: {
          connected: false
        },
        memory: {
          size: memoryCache.size
        }
      };
    }
  } catch (error) {
    logError('Get cache stats error', error);
    return {
      redis: { connected: false },
      memory: { size: memoryCache.size }
    };
  }
}

// Close cache connection
async function closeCache() {
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.quit();
      logInfo('Redis connection closed');
    }
  } catch (error) {
    logError('Close cache error', error);
  }
}

module.exports = {
  initializeCache,
  get,
  set,
  del,
  clearUserCache,
  cacheMiddleware,
  cacheProductData,
  getCachedProductData,
  cacheUserProfile,
  getCachedUserProfile,
  cacheStyleGuidelines,
  getCachedStyleGuidelines,
  cacheApiResponse,
  getCachedApiResponse,
  getCacheStats,
  closeCache,
  CACHE_CONFIG
}; 