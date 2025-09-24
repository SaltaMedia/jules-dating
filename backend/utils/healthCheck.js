const mongoose = require('mongoose');
const os = require('os');
const { logInfo, logError, logWarn } = require('./logger');
const { getCacheStats } = require('./cache');
const { getQueryStats } = require('./databaseOptimizer');

// Health check status constants
const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy'
};

// Performance thresholds
const THRESHOLDS = {
  MEMORY_USAGE: 0.9, // 90% memory usage warning
  CPU_USAGE: 0.8,    // 80% CPU usage warning
  DB_RESPONSE_TIME: 1000, // 1 second database response time
  DISK_USAGE: 0.85   // 85% disk usage warning
};

// System metrics collection
let systemMetrics = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  averageResponseTime: 0,
  lastHealthCheck: null
};

// Update system metrics
function updateMetrics(responseTime, isError = false) {
  systemMetrics.requestCount++;
  if (isError) systemMetrics.errorCount++;
  
  // Calculate rolling average response time
  const currentAvg = systemMetrics.averageResponseTime;
  const newAvg = (currentAvg * (systemMetrics.requestCount - 1) + responseTime) / systemMetrics.requestCount;
  systemMetrics.averageResponseTime = Math.round(newAvg);
}

// Get system information
function getSystemInfo() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = usedMemory / totalMemory;
  
  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total);
  }, 0) / cpus.length;
  
  const uptime = Date.now() - systemMetrics.startTime;
  
  return {
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: memoryUsage,
      status: memoryUsage > THRESHOLDS.MEMORY_USAGE ? 'warning' : 'healthy'
    },
    cpu: {
      cores: cpus.length,
      usage: cpuUsage,
      status: cpuUsage > THRESHOLDS.CPU_USAGE ? 'warning' : 'healthy'
    },
    uptime: {
      milliseconds: uptime,
      seconds: Math.floor(uptime / 1000),
      minutes: Math.floor(uptime / 60000),
      hours: Math.floor(uptime / 3600000),
      days: Math.floor(uptime / 86400000)
    },
    platform: {
      os: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      pid: process.pid
    }
  };
}

// Check database health
async function checkDatabaseHealth() {
  const startTime = Date.now();
  
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return {
        status: HEALTH_STATUS.UNHEALTHY,
        message: 'Database not connected',
        details: {
          readyState: mongoose.connection.readyState,
          responseTime: Date.now() - startTime
        }
      };
    }
    
    // Test database connection with a simple query
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;
    
    // Get query statistics
    const queryStats = getQueryStats();
    
    return {
      status: responseTime > THRESHOLDS.DB_RESPONSE_TIME ? HEALTH_STATUS.DEGRADED : HEALTH_STATUS.HEALTHY,
      message: 'Database connection healthy',
      details: {
        responseTime,
        readyState: mongoose.connection.readyState,
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        queryStats: {
          totalQueries: queryStats.totalQueries,
          slowQueries: queryStats.slowQueries,
          averageQueryTime: queryStats.averageQueryTime,
          slowQueryPercentage: queryStats.totalQueries > 0 ? 
            Math.round((queryStats.slowQueries / queryStats.totalQueries) * 100) : 0
        }
      }
    };
  } catch (error) {
    logError('Database health check failed', error);
    return {
      status: HEALTH_STATUS.UNHEALTHY,
      message: 'Database connection failed',
      details: {
        error: error.message,
        responseTime: Date.now() - startTime
      }
    };
  }
}

// Check external services health
async function checkExternalServices() {
  const services = {};
  
  // Check OpenAI API (if configured)
  if (process.env.OPENAI_API_KEY) {
    try {
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Simple test - list models (lightweight operation)
      await openai.models.list();
      services.openai = {
        status: HEALTH_STATUS.HEALTHY,
        message: 'OpenAI API accessible'
      };
    } catch (error) {
      services.openai = {
        status: HEALTH_STATUS.DEGRADED,
        message: 'OpenAI API not accessible',
        details: { error: error.message }
      };
    }
  }
  
  // Check Cloudinary (if configured)
  if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudinary = require('cloudinary').v2;
      // Test cloudinary configuration
      await cloudinary.api.ping();
      services.cloudinary = {
        status: HEALTH_STATUS.HEALTHY,
        message: 'Cloudinary accessible'
      };
    } catch (error) {
      services.cloudinary = {
        status: HEALTH_STATUS.DEGRADED,
        message: 'Cloudinary not accessible',
        details: { error: error.message }
      };
    }
  }
  
  // Check cache status
  try {
    const cacheStats = await getCacheStats();
    services.cache = {
      status: cacheStats.redis.connected ? HEALTH_STATUS.HEALTHY : HEALTH_STATUS.DEGRADED,
      message: cacheStats.redis.connected ? 'Redis cache accessible' : 'Using memory cache fallback',
      details: {
        redis: cacheStats.redis.connected,
        memoryCacheSize: cacheStats.memory.size
      }
    };
  } catch (error) {
    services.cache = {
      status: HEALTH_STATUS.DEGRADED,
      message: 'Cache not accessible',
      details: { error: error.message }
    };
  }
  
  return services;
}

// Check application health
function checkApplicationHealth() {
  const errorRate = systemMetrics.requestCount > 0 
    ? systemMetrics.errorCount / systemMetrics.requestCount 
    : 0;
  
  const systemInfo = getSystemInfo();
  const overallStatus = 
    systemInfo.memory.status === 'healthy' && 
    systemInfo.cpu.status === 'healthy' && 
    errorRate < 0.1 
      ? HEALTH_STATUS.HEALTHY 
      : HEALTH_STATUS.DEGRADED;
  
  return {
    status: overallStatus,
    message: 'Application running',
    details: {
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: systemMetrics.averageResponseTime,
      requestCount: systemMetrics.requestCount,
      errorCount: systemMetrics.errorCount,
      system: systemInfo
    }
  };
}

// Comprehensive health check
async function performHealthCheck() {
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    overall: HEALTH_STATUS.HEALTHY,
    checks: {}
  };
  
  try {
    // Check database
    results.checks.database = await checkDatabaseHealth();
    
    // Check external services
    results.checks.externalServices = await checkExternalServices();
    
    // Check application
    results.checks.application = checkApplicationHealth();
    
    // Determine overall health
    const allChecks = [
      results.checks.database,
      results.checks.application,
      ...Object.values(results.checks.externalServices)
    ];
    
    if (allChecks.some(check => check.status === HEALTH_STATUS.UNHEALTHY)) {
      results.overall = HEALTH_STATUS.UNHEALTHY;
    } else if (allChecks.some(check => check.status === HEALTH_STATUS.DEGRADED)) {
      results.overall = HEALTH_STATUS.DEGRADED;
    }
    
    results.responseTime = Date.now() - startTime;
    systemMetrics.lastHealthCheck = results;
    
    logInfo('Health check completed', {
      overall: results.overall,
      responseTime: results.responseTime
    });
    
    return results;
  } catch (error) {
    logError('Health check failed', error);
    return {
      timestamp: new Date().toISOString(),
      overall: HEALTH_STATUS.UNHEALTHY,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Simple health check for load balancers
async function simpleHealthCheck() {
  try {
    const dbHealth = await checkDatabaseHealth();
    return dbHealth.status === HEALTH_STATUS.HEALTHY;
  } catch (error) {
    return false;
  }
}

// Get detailed metrics
function getMetrics() {
  return {
    ...systemMetrics,
    system: getSystemInfo(),
    timestamp: new Date().toISOString()
  };
}

// Reset metrics (useful for testing)
function resetMetrics() {
  systemMetrics = {
    startTime: Date.now(),
    requestCount: 0,
    errorCount: 0,
    averageResponseTime: 0,
    lastHealthCheck: null
  };
}

module.exports = {
  HEALTH_STATUS,
  performHealthCheck,
  simpleHealthCheck,
  getMetrics,
  updateMetrics,
  resetMetrics,
  getSystemInfo
}; 