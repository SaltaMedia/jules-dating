const AnonymousSession = require('../models/AnonymousSession');
const FitCheck = require('../models/FitCheck');
const Conversation = require('../models/Conversation');
const { logInfo, logWarn, logError } = require('../utils/logger');

class DataMigrationService {
  /**
   * Migrate anonymous session data to a new user account
   * @param {string} anonymousId - The anonymous session ID
   * @param {string} userId - The new user ID
   * @returns {Object} Migration result with counts
   */
  static async migrateAnonymousToUser(anonymousId, userId) {
    const migrationResult = {
      fitChecks: 0,
      conversations: 0,
      errors: []
    };

    try {
      logInfo(`Starting data migration from anonymous session ${anonymousId} to user ${userId}`);

      // Get the anonymous session
      const anonymousSession = await AnonymousSession.getSession(anonymousId);
      if (!anonymousSession) {
        throw new Error(`Anonymous session ${anonymousId} not found`);
      }

      // Start a database transaction for atomic migration
      const session = await AnonymousSession.db.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Migrate fit checks
          if (anonymousSession.fitChecks && anonymousSession.fitChecks.length > 0) {
            const fitCheckResult = await FitCheck.updateMany(
              { anonymousId },
              { 
                $set: { 
                  userId,
                  anonymousId: null,
                  migratedAt: new Date()
                }
              },
              { session }
            );
            migrationResult.fitChecks = fitCheckResult.modifiedCount;
            logInfo(`Migrated ${migrationResult.fitChecks} fit checks`);
          }

          // Migrate conversations (which contain chat messages)
          const conversationResult = await Conversation.updateMany(
            { userId: anonymousId },
            { 
              $set: { 
                userId,
                migratedAt: new Date()
              }
            },
            { session }
          );
          migrationResult.conversations = conversationResult.modifiedCount;
          logInfo(`Migrated ${migrationResult.conversations} conversations`);

          // Clean up the anonymous session
          await AnonymousSession.deleteOne({ sessionId: anonymousId }, { session });
          logInfo(`Cleaned up anonymous session ${anonymousId}`);
        });

        logInfo(`Data migration completed successfully for user ${userId}`, migrationResult);
        return migrationResult;

      } catch (transactionError) {
        logError('Transaction failed during data migration:', transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }

    } catch (error) {
      logError('Data migration error:', error);
      migrationResult.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Get anonymous session data for preview before migration
   * @param {string} anonymousId - The anonymous session ID
   * @returns {Object} Preview of data to be migrated
   */
  static async previewMigration(anonymousId) {
    try {
      const anonymousSession = await AnonymousSession.getSession(anonymousId);
      if (!anonymousSession) {
        throw new Error(`Anonymous session ${anonymousId} not found`);
      }

      const preview = {
        sessionId: anonymousId,
        createdAt: anonymousSession.createdAt,
        lastActivityAt: anonymousSession.lastActivityAt,
        usageCounts: anonymousSession.usageCounts,
        fitChecks: [],
        conversations: []
      };

      // Get fit check details
      if (anonymousSession.fitChecks && anonymousSession.fitChecks.length > 0) {
        const fitChecks = await FitCheck.find({ anonymousId })
          .select('eventContext createdAt analysis.overallRating')
          .sort({ createdAt: -1 });
        preview.fitChecks = fitChecks;
      }

      // Get conversation details (which contain chat messages)
      const conversations = await Conversation.find({ userId: anonymousId })
        .select('messages createdAt')
        .sort({ createdAt: -1 });
      preview.conversations = conversations;

      return preview;
    } catch (error) {
      logError('Preview migration error:', error);
      throw error;
    }
  }

  /**
   * Rollback migration (move data back to anonymous session)
   * @param {string} userId - The user ID to rollback
   * @param {string} anonymousId - The anonymous session ID to restore to
   * @returns {Object} Rollback result
   */
  static async rollbackMigration(userId, anonymousId) {
    const rollbackResult = {
      fitChecks: 0,
      conversations: 0,
      errors: []
    };

    try {
      logInfo(`Starting rollback migration from user ${userId} to anonymous session ${anonymousId}`);

      const session = await AnonymousSession.db.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Rollback fit checks
          const fitCheckResult = await FitCheck.updateMany(
            { userId, migratedAt: { $exists: true } },
            { 
              $set: { 
                anonymousId,
                userId: null
              },
              $unset: { migratedAt: 1 }
            },
            { session }
          );
          rollbackResult.fitChecks = fitCheckResult.modifiedCount;

          // Rollback conversations
          const conversationResult = await Conversation.updateMany(
            { userId, migratedAt: { $exists: true } },
            { 
              $set: { 
                userId: anonymousId
              },
              $unset: { migratedAt: 1 }
            },
            { session }
          );
          rollbackResult.conversations = conversationResult.modifiedCount;
        });

        logInfo(`Rollback migration completed for user ${userId}`, rollbackResult);
        return rollbackResult;

      } catch (transactionError) {
        logError('Transaction failed during rollback migration:', transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }

    } catch (error) {
      logError('Rollback migration error:', error);
      rollbackResult.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Clean up expired anonymous sessions and their data
   * @returns {Object} Cleanup result
   */
  static async cleanupExpiredSessions() {
    try {
      logInfo('Starting cleanup of expired anonymous sessions');

      const cleanupResult = {
        sessionsDeleted: 0,
        fitChecksDeleted: 0,
        conversationsDeleted: 0
      };

      // Find expired sessions
      const expiredSessions = await AnonymousSession.find({
        expiresAt: { $lt: new Date() }
      });

      for (const expiredSession of expiredSessions) {
        // Delete associated data
        const fitCheckResult = await FitCheck.deleteMany({ 
          anonymousId: expiredSession.sessionId 
        });
        cleanupResult.fitChecksDeleted += fitCheckResult.deletedCount;

        const conversationResult = await Conversation.deleteMany({ 
          userId: expiredSession.sessionId 
        });
        cleanupResult.conversationsDeleted += conversationResult.deletedCount;

        // Delete the session
        await AnonymousSession.deleteOne({ _id: expiredSession._id });
        cleanupResult.sessionsDeleted += 1;
      }

      logInfo('Cleanup of expired anonymous sessions completed', cleanupResult);
      return cleanupResult;

    } catch (error) {
      logError('Cleanup expired sessions error:', error);
      throw error;
    }
  }

  /**
   * Get migration statistics
   * @returns {Object} Migration statistics
   */
  static async getMigrationStats() {
    try {
      const stats = {
        activeAnonymousSessions: 0,
        totalFitChecks: 0,
        totalConversations: 0,
        expiredSessions: 0
      };

      // Count active anonymous sessions
      stats.activeAnonymousSessions = await AnonymousSession.countDocuments({
        expiresAt: { $gt: new Date() }
      });

      // Count expired sessions
      stats.expiredSessions = await AnonymousSession.countDocuments({
        expiresAt: { $lt: new Date() }
      });

      // Count anonymous data
      stats.totalFitChecks = await FitCheck.countDocuments({ 
        anonymousId: { $exists: true, $ne: null } 
      });
      
      stats.totalConversations = await Conversation.countDocuments({ 
        userId: { $regex: /^[a-f0-9]{64}$/ } // Anonymous sessions are 64-char hex strings
      });

      return stats;
    } catch (error) {
      logError('Get migration stats error:', error);
      throw error;
    }
  }
}

module.exports = DataMigrationService;
