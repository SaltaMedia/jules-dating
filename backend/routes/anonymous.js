const express = require('express');
const router = express.Router();
const { anonymousSession, requireAnonymousSession } = require('../middleware/anonymousSession');
const { getUsageInfo } = require('../middleware/rateLimiter');
const SessionUtils = require('../utils/sessionUtils');
const DataMigrationService = require('../services/dataMigration');
const { logInfo, logWarn, logError } = require('../utils/logger');

// Apply anonymous session middleware to all routes
router.use(anonymousSession);

/**
 * GET /api/anonymous/usage
 * Get current usage information for anonymous session
 */
router.get('/usage', getUsageInfo);

/**
 * GET /api/anonymous/session
 * Get session information
 */
router.get('/session', requireAnonymousSession, async (req, res) => {
  try {
    const session = req.anonymousSession;
    const usageInfo = SessionUtils.getAllUsageLimits(session);
    
    res.json({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      usage: usageInfo,
      headers: SessionUtils.generateSessionHeaders(session)
    });
  } catch (error) {
    logError('Get session info error:', error);
    res.status(500).json({
      error: 'Failed to get session information',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /api/anonymous/session/extend
 * Extend session expiration
 */
router.post('/session/extend', requireAnonymousSession, async (req, res) => {
  try {
    const { hours = 24 } = req.body;
    const sessionId = req.anonymousId;
    
    const extended = await SessionUtils.extendSession(sessionId, hours);
    
    if (extended) {
      res.json({
        message: 'Session extended successfully',
        newExpiration: new Date(Date.now() + hours * 60 * 60 * 1000)
      });
    } else {
      res.status(400).json({
        error: 'Failed to extend session',
        message: 'Session may have expired or been invalid'
      });
    }
  } catch (error) {
    logError('Extend session error:', error);
    res.status(500).json({
      error: 'Failed to extend session',
      message: 'Please try again later'
    });
  }
});

/**
 * GET /api/anonymous/migration/preview
 * Preview data that would be migrated on signup
 */
router.get('/migration/preview', requireAnonymousSession, async (req, res) => {
  try {
    const sessionId = req.anonymousId;
    const preview = await DataMigrationService.previewMigration(sessionId);
    
    res.json({
      message: 'Migration preview generated',
      preview
    });
  } catch (error) {
    logError('Migration preview error:', error);
    res.status(500).json({
      error: 'Failed to generate migration preview',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /api/anonymous/migration/migrate
 * Migrate anonymous data to user account
 * This endpoint should be called after user registration/login
 */
router.post('/migration/migrate', requireAnonymousSession, async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = req.anonymousId;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }
    
    const migrationResult = await DataMigrationService.migrateAnonymousToUser(sessionId, userId);
    
    logInfo(`Data migration completed for user ${userId}`, migrationResult);
    
    res.json({
      message: 'Data migration completed successfully',
      result: migrationResult
    });
  } catch (error) {
    logError('Data migration error:', error);
    res.status(500).json({
      error: 'Failed to migrate data',
      message: 'Please try again later'
    });
  }
});

/**
 * GET /api/anonymous/stats
 * Get anonymous session statistics (admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    // In a real app, you'd check for admin permissions here
    const stats = await SessionUtils.getSessionStats();
    
    res.json({
      message: 'Anonymous session statistics',
      stats
    });
  } catch (error) {
    logError('Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
      message: 'Please try again later'
    });
  }
});

/**
 * POST /api/anonymous/cleanup
 * Clean up expired sessions (admin only)
 */
router.post('/cleanup', async (req, res) => {
  try {
    // In a real app, you'd check for admin permissions here
    const cleanupResult = await DataMigrationService.cleanupExpiredSessions();
    
    logInfo('Manual cleanup completed', cleanupResult);
    
    res.json({
      message: 'Cleanup completed successfully',
      result: cleanupResult
    });
  } catch (error) {
    logError('Cleanup error:', error);
    res.status(500).json({
      error: 'Failed to cleanup expired sessions',
      message: 'Please try again later'
    });
  }
});

/**
 * GET /api/anonymous/health
 * Health check for anonymous session system
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await SessionUtils.getSessionStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        activeSessions: stats.active,
        totalSessions: stats.total,
        expiredSessions: stats.expired
      }
    });
  } catch (error) {
    logError('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router;
