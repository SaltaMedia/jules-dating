const express = require('express');
const router = express.Router();
const { 
  performHealthCheck, 
  simpleHealthCheck, 
  getMetrics,
  updateMetrics 
} = require('../utils/healthCheck');
const { getCacheStats } = require('../utils/cache');
const { getQueryStats } = require('../utils/databaseOptimizer');
const { getProductionStatus, generateDeploymentGuide } = require('../utils/productionChecklist');
const { asyncHandler } = require('../utils/errorHandler');

// Simple health check for load balancers
router.get('/healthz', asyncHandler(async (req, res) => {
  const isHealthy = await simpleHealthCheck();
  const statusCode = isHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'error',
    service: 'jules-dating-backend',
    timestamp: new Date().toISOString()
  });
}));

// Comprehensive health check
router.get('/health', asyncHandler(async (req, res) => {
  const healthData = await performHealthCheck();
  const statusCode = healthData.overall === 'healthy' ? 200 : 
                    healthData.overall === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthData);
}));

// System metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = getMetrics();
  res.json(metrics);
}));

// System information
router.get('/info', asyncHandler(async (req, res) => {
  const info = {
    service: 'jules-dating-backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
  
  res.json(info);
}));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(async (req, res) => {
  const isHealthy = await simpleHealthCheck();
  const statusCode = isHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    ready: isHealthy,
    timestamp: new Date().toISOString()
  });
}));

// Liveness probe (for Kubernetes)
router.get('/live', asyncHandler(async (req, res) => {
  // Liveness check - just verify the process is running
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
}));

// Performance test endpoint
router.get('/perf', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Simulate some work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const responseTime = Date.now() - startTime;
  updateMetrics(responseTime, false);
  
  res.json({
    message: 'Performance test completed',
    responseTime,
    timestamp: new Date().toISOString()
  });
}));

// Cache statistics endpoint
router.get('/cache', asyncHandler(async (req, res) => {
  const cacheStats = await getCacheStats();
  res.json({
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
}));

// Database statistics endpoint
router.get('/database', asyncHandler(async (req, res) => {
  const queryStats = getQueryStats();
  res.json({
    database: queryStats,
    timestamp: new Date().toISOString()
  });
}));

// Production readiness check endpoint
router.get('/production', asyncHandler(async (req, res) => {
  const status = await getProductionStatus();
  res.json(status);
}));

// Production deployment guide endpoint
router.get('/deployment-guide', asyncHandler(async (req, res) => {
  const guide = generateDeploymentGuide();
  res.json(guide);
}));

module.exports = router; 