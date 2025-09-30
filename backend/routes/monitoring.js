const express = require('express');
const router = express.Router();
const { performHealthCheck, getMetrics, getSystemInfo } = require('../utils/healthCheck');
const { getCacheStats } = require('../utils/cache');
const { getQueryStats } = require('../utils/databaseOptimizer');
const { logInfo, logError } = require('../utils/logger');

// Health check endpoint (for load balancers)
router.get('/health', async (req, res) => {
  try {
    const health = await performHealthCheck();
    const statusCode = health.overall === 'healthy' ? 200 : 
                      health.overall === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    logError('Health check failed', error);
    res.status(503).json({
      overall: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Simple health check (for basic monitoring)
router.get('/healthz', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const isHealthy = mongoose.connection.readyState === 1;
    
    if (isHealthy) {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(503).json({ status: 'error', error: error.message });
  }
});

// Detailed metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    const metrics = getMetrics();
    const cacheStats = await getCacheStats();
    const queryStats = getQueryStats();
    
    res.json({
      timestamp: new Date().toISOString(),
      system: metrics.system,
      performance: {
        requestCount: metrics.requestCount,
        errorCount: metrics.errorCount,
        averageResponseTime: metrics.averageResponseTime,
        errorRate: metrics.requestCount > 0 ? (metrics.errorCount / metrics.requestCount) : 0
      },
      database: {
        connectionState: require('mongoose').connection.readyState,
        queryStats: queryStats
      },
      cache: cacheStats,
      uptime: metrics.uptime
    });
  } catch (error) {
    logError('Metrics collection failed', error);
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Database status endpoint
router.get('/database', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connection = mongoose.connection;
    
    // Get database stats
    const stats = await connection.db.stats();
    const queryStats = getQueryStats();
    
    res.json({
      status: connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: connection.readyState,
      database: connection.name,
      host: connection.host,
      port: connection.port,
      stats: {
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize,
        storageSize: stats.storageSize
      },
      queryStats: queryStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Database status check failed', error);
    res.status(500).json({ error: 'Failed to get database status' });
  }
});

// Cache status endpoint
router.get('/cache', async (req, res) => {
  try {
    const cacheStats = await getCacheStats();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...cacheStats
    });
  } catch (error) {
    logError('Cache status check failed', error);
    res.status(500).json({ error: 'Failed to get cache status' });
  }
});

// System info endpoint
router.get('/system', (req, res) => {
  try {
    const systemInfo = getSystemInfo();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...systemInfo
    });
  } catch (error) {
    logError('System info check failed', error);
    res.status(500).json({ error: 'Failed to get system info' });
  }
});

// Production readiness check
router.get('/readiness', async (req, res) => {
  try {
    const { runProductionCheck } = require('../utils/productionChecklist');
    const check = await runProductionCheck();
    
    const statusCode = check.overall === 'ready' ? 200 : 
                      check.overall === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(check);
  } catch (error) {
    logError('Readiness check failed', error);
    res.status(500).json({ error: 'Failed to run readiness check' });
  }
});

// Monitoring dashboard (HTML)
router.get('/dashboard', (req, res) => {
  const dashboardHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Jules Dating - Monitoring Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; }
        .healthy { background: #28a745; }
        .degraded { background: #ffc107; color: black; }
        .unhealthy { background: #dc3545; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { font-weight: bold; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .loading { text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Jules Dating - Monitoring Dashboard</h1>
        <button class="refresh-btn" onclick="refreshAll()">🔄 Refresh All</button>
        
        <div class="grid">
            <div class="card">
                <h3>🏥 Health Status</h3>
                <div id="health-status" class="loading">Loading...</div>
            </div>
            
            <div class="card">
                <h3>📊 Performance Metrics</h3>
                <div id="performance-metrics" class="loading">Loading...</div>
            </div>
            
            <div class="card">
                <h3>🗄️ Database Status</h3>
                <div id="database-status" class="loading">Loading...</div>
            </div>
            
            <div class="card">
                <h3>💾 Cache Status</h3>
                <div id="cache-status" class="loading">Loading...</div>
            </div>
            
            <div class="card">
                <h3>💻 System Info</h3>
                <div id="system-info" class="loading">Loading...</div>
            </div>
            
            <div class="card">
                <h3>✅ Production Readiness</h3>
                <div id="readiness-status" class="loading">Loading...</div>
            </div>
        </div>
    </div>

    <script>
        async function fetchData(endpoint, elementId) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                document.getElementById(elementId).innerHTML = formatData(data, endpoint);
            } catch (error) {
                document.getElementById(elementId).innerHTML = \`<div class="status unhealthy">Error: \${error.message}</div>\`;
            }
        }

        function formatData(data, endpoint) {
            if (endpoint.includes('/health')) {
                return \`<div class="status \${data.overall}">\${data.overall.toUpperCase()}</div>
                        <div class="metric"><span>Response Time:</span><span class="metric-value">\${data.responseTime}ms</span></div>\`;
            }
            
            if (endpoint.includes('/metrics')) {
                return \`<div class="metric"><span>Requests:</span><span class="metric-value">\${data.performance.requestCount}</span></div>
                        <div class="metric"><span>Errors:</span><span class="metric-value">\${data.performance.errorCount}</span></div>
                        <div class="metric"><span>Avg Response:</span><span class="metric-value">\${data.performance.averageResponseTime}ms</span></div>
                        <div class="metric"><span>Error Rate:</span><span class="metric-value">\${(data.performance.errorRate * 100).toFixed(2)}%</span></div>\`;
            }
            
            if (endpoint.includes('/database')) {
                const status = data.status === 'connected' ? 'healthy' : 'unhealthy';
                return \`<div class="status \${status}">\${data.status.toUpperCase()}</div>
                        <div class="metric"><span>Database:</span><span class="metric-value">\${data.database}</span></div>
                        <div class="metric"><span>Collections:</span><span class="metric-value">\${data.stats.collections}</span></div>
                        <div class="metric"><span>Data Size:</span><span class="metric-value">\${(data.stats.dataSize / 1024 / 1024).toFixed(2)}MB</span></div>\`;
            }
            
            if (endpoint.includes('/cache')) {
                const status = data.redis.connected ? 'healthy' : 'degraded';
                return \`<div class="status \${status}">\${data.redis.connected ? 'REDIS' : 'MEMORY'}</div>
                        <div class="metric"><span>Memory Cache:</span><span class="metric-value">\${data.memory.size} items</span></div>\`;
            }
            
            if (endpoint.includes('/system')) {
                return \`<div class="metric"><span>Memory Usage:</span><span class="metric-value">\${(data.memory.usage * 100).toFixed(1)}%</span></div>
                        <div class="metric"><span>CPU Cores:</span><span class="metric-value">\${data.cpu.cores}</span></div>
                        <div class="metric"><span>Uptime:</span><span class="metric-value">\${data.uptime.hours}h \${data.uptime.minutes}m</span></div>
                        <div class="metric"><span>Platform:</span><span class="metric-value">\${data.platform.os}</span></div>\`;
            }
            
            if (endpoint.includes('/readiness')) {
                const status = data.overall === 'ready' ? 'healthy' : data.overall === 'warning' ? 'degraded' : 'unhealthy';
                return \`<div class="status \${status}">\${data.overall.toUpperCase()}</div>
                        <div class="metric"><span>Success Rate:</span><span class="metric-value">\${data.summary.successRate}</span></div>
                        <div class="metric"><span>Passed:</span><span class="metric-value">\${data.summary.passed}</span></div>
                        <div class="metric"><span>Failed:</span><span class="metric-value">\${data.summary.failed}</span></div>\`;
            }
            
            return \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
        }

        function refreshAll() {
            fetchData('/api/monitoring/health', 'health-status');
            fetchData('/api/monitoring/metrics', 'performance-metrics');
            fetchData('/api/monitoring/database', 'database-status');
            fetchData('/api/monitoring/cache', 'cache-status');
            fetchData('/api/monitoring/system', 'system-info');
            fetchData('/api/monitoring/readiness', 'readiness-status');
        }

        // Load data on page load
        refreshAll();
        
        // Auto-refresh every 30 seconds
        setInterval(refreshAll, 30000);
    </script>
</body>
</html>`;
  
  res.send(dashboardHTML);
});

module.exports = router;
