const AnonymousSession = require('../models/AnonymousSession');
const { logInfo, logWarn, logError } = require('../utils/logger');

/**
 * Session utility functions for anonymous user management
 */
class SessionUtils {
  /**
   * Create a new anonymous session
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Object} Created session
   */
  static async createSession(ipAddress = null, userAgent = null) {
    try {
      const session = await AnonymousSession.createSession(null, ipAddress, userAgent);
      logInfo(`Created new anonymous session: ${session.sessionId}`);
      return session;
    } catch (error) {
      logError('Error creating anonymous session:', error);
      throw error;
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object or null
   */
  static async getSession(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }
      
      const session = await AnonymousSession.getSession(sessionId);
      if (session && session.expiresAt > new Date()) {
        return session;
      }
      
      return null;
    } catch (error) {
      logError('Error getting anonymous session:', error);
      return null;
    }
  }

  /**
   * Check if session is valid and not expired
   * @param {string} sessionId - Session ID
   * @returns {boolean} True if valid, false otherwise
   */
  static async isValidSession(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      return session !== null;
    } catch (error) {
      logError('Error validating session:', error);
      return false;
    }
  }

  /**
   * Extend session expiration
   * @param {string} sessionId - Session ID
   * @param {number} hours - Hours to extend (default: 24)
   * @returns {boolean} True if extended, false otherwise
   */
  static async extendSession(sessionId, hours = 24) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const newExpiration = new Date(Date.now() + hours * 60 * 60 * 1000);
      session.expiresAt = newExpiration;
      await session.save();
      
      logInfo(`Extended session ${sessionId} until ${newExpiration}`);
      return true;
    } catch (error) {
      logError('Error extending session:', error);
      return false;
    }
  }

  /**
   * Get session usage information
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Usage information or null
   */
  static async getSessionUsage(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      return {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        usageCounts: session.usageCounts,
        fitChecks: session.fitChecks.length,
        chatMessages: session.chatMessages.length
      };
    } catch (error) {
      logError('Error getting session usage:', error);
      return null;
    }
  }

  /**
   * Clean up expired sessions
   * @returns {Object} Cleanup result
   */
  static async cleanupExpiredSessions() {
    try {
      const result = await AnonymousSession.cleanupExpired();
      logInfo(`Cleaned up ${result.deletedCount} expired sessions`);
      return result;
    } catch (error) {
      logError('Error cleaning up expired sessions:', error);
      throw error;
    }
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  static async getSessionStats() {
    try {
      const now = new Date();
      
      const stats = {
        total: await AnonymousSession.countDocuments(),
        active: await AnonymousSession.countDocuments({
          expiresAt: { $gt: now }
        }),
        expired: await AnonymousSession.countDocuments({
          expiresAt: { $lt: now }
        }),
        expiringSoon: await AnonymousSession.countDocuments({
          expiresAt: { 
            $gt: now,
            $lt: new Date(now.getTime() + 60 * 60 * 1000) // Next hour
          }
        })
      };

      return stats;
    } catch (error) {
      logError('Error getting session stats:', error);
      throw error;
    }
  }

  /**
   * Validate session and return error response if invalid
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @returns {void}
   */
  static validateSessionMiddleware(req, res, next) {
    if (!req.anonymousSession) {
      return res.status(400).json({
        error: 'Invalid session',
        message: 'Please refresh the page to start a new session',
        code: 'INVALID_SESSION'
      });
    }

    if (req.anonymousSession.expiresAt < new Date()) {
      return res.status(400).json({
        error: 'Session expired',
        message: 'Your session has expired. Please refresh the page to start a new session.',
        code: 'SESSION_EXPIRED'
      });
    }

    next();
  }

  /**
   * Generate session response headers
   * @param {Object} session - Anonymous session object
   * @returns {Object} Headers object
   */
  static generateSessionHeaders(session) {
    return {
      'X-Anonymous-Session-ID': session.sessionId,
      'X-Session-Expires': session.expiresAt.toISOString(),
      'X-Session-Created': session.createdAt.toISOString()
    };
  }

  /**
   * Check if session has reached usage limit
   * @param {Object} session - Anonymous session object
   * @param {string} type - Usage type (fitChecks, chatMessages)
   * @param {number} limit - Usage limit
   * @returns {Object} Usage check result
   */
  static checkUsageLimit(session, type, limit) {
    const currentUsage = session.usageCounts[type] || 0;
    const isLimitReached = currentUsage >= limit;
    const remaining = Math.max(0, limit - currentUsage);

    return {
      type,
      current: currentUsage,
      limit,
      remaining,
      isLimitReached,
      canProceed: !isLimitReached
    };
  }

  /**
   * Get all usage limits for a session
   * @param {Object} session - Anonymous session object
   * @returns {Object} All usage limits
   */
  static getAllUsageLimits(session) {
    const limits = {
      fitChecks: { limit: 1, current: session.usageCounts.fitChecks || 0 },
      chatMessages: { limit: 5, current: session.usageCounts.chatMessages || 0 }
    };

    // Calculate remaining for each
    Object.keys(limits).forEach(type => {
      const limit = limits[type];
      limit.remaining = Math.max(0, limit.limit - limit.current);
      limit.isLimitReached = limit.current >= limit.limit;
    });

    return limits;
  }
}

module.exports = SessionUtils;


