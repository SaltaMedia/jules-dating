const mongoose = require('mongoose');
const analyticsService = require('../utils/analyticsService');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const UserSession = require('../models/UserSession');
const ChatAnalytics = require('../models/ChatAnalytics');
const User = require('../models/User');
const { logError, logInfo } = require('../utils/logger');
const { track } = require('../analytics/wrapper');

class AnalyticsController {
  // Get dashboard overview metrics
  async getDashboardMetrics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const metrics = await analyticsService.getDashboardMetrics(timeRange);
      
      logInfo('Dashboard metrics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date()
      });
    } catch (error) {
      logError('Failed to get dashboard metrics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard metrics'
      });
    }
  }

  // Get time series data for charts
  async getTimeSeriesData(req, res) {
    try {
      const { timeRange = '7d', metric = 'page_views' } = req.query;
      
      const data = await analyticsService.getTimeSeriesData(timeRange, metric);
      
      logInfo('Time series data retrieved', { timeRange, metric, userId: req.user?.id });
      
      res.json({
        success: true,
        data,
        timeRange,
        metric
      });
    } catch (error) {
      logError('Failed to get time series data', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve time series data'
      });
    }
  }

  // Get user analytics
  async getUserAnalytics(req, res) {
    try {
      const { timeRange = '7d', limit = 50 } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const users = await UserSession.aggregate([
        { $match: { startTime: { $gte: startDate } } },
        {
          $group: {
            _id: '$userId',
            totalSessions: { $sum: 1 },
            totalPageViews: { $sum: '$pageViews' },
            totalChatMessages: { $sum: '$chatMessages' },
            averageSessionDuration: { $avg: '$duration' },
            lastActive: { $max: '$startTime' },
            deviceTypes: { $addToSet: '$device' },
            browsers: { $addToSet: '$browser' }
          }
        },
        { $sort: { totalSessions: -1 } },
        { $limit: parseInt(limit) }
      ]);
      
      // Get user details for non-anonymous users with valid ObjectIds
      const userIds = users.filter(u => u._id !== 'anonymous' && mongoose.Types.ObjectId.isValid(u._id)).map(u => u._id);
      const userDetails = userIds.length > 0 ? await User.find({ _id: { $in: userIds } }).select('name email createdAt') : [];
      
      const userMap = {};
      userDetails.forEach(user => {
        userMap[user._id] = user;
      });
      
      const enrichedUsers = users.map(user => ({
        ...user,
        userDetails: userMap[user._id] || null
      }));
      
      logInfo('User analytics retrieved', { timeRange, limit, userId: req.user?.id });
      
      res.json({
        success: true,
        data: enrichedUsers,
        timeRange
      });
    } catch (error) {
      logError('Failed to get user analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user analytics'
      });
    }
  }

  // Get chat analytics
  async getChatAnalytics(req, res) {
    try {
      const { timeRange = '7d', limit = 100 } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const conversations = await ChatAnalytics.find({
        startTime: { $gte: startDate }
      })
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email');
      
      // Get aggregated chat metrics
      const metrics = await ChatAnalytics.aggregate([
        { $match: { startTime: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            averageDuration: { $avg: '$duration' },
            averageResponseTime: { $avg: '$averageResponseTime' },
            totalMessages: { $sum: { $add: ['$messageCount.user', '$messageCount.assistant'] } },
            sentimentDistribution: {
              $push: '$sentiment.overall'
            }
          }
        }
      ]);
      
      // Calculate sentiment distribution
      const sentimentCounts = {};
      if (metrics[0]?.sentimentDistribution) {
        metrics[0].sentimentDistribution.forEach(sentiment => {
          sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
        });
      }
      
      logInfo('Chat analytics retrieved', { timeRange, limit, userId: req.user?.id });
      
      res.json({
        success: true,
        data: {
          conversations,
          metrics: {
            ...metrics[0],
            sentimentDistribution: sentimentCounts
          }
        },
        timeRange
      });
    } catch (error) {
      logError('Failed to get chat analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat analytics'
      });
    }
  }

  // Get feature usage analytics
  async getFeatureUsageAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const featureUsage = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: 'feature_usage',
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$properties.feature',
            count: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' },
            actions: { $addToSet: '$action' }
          }
        },
        {
          $project: {
            feature: '$_id',
            count: 1,
            uniqueUsers: { $size: '$uniqueUsers' },
            actions: 1
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      logInfo('Feature usage analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: featureUsage,
        timeRange
      });
    } catch (error) {
      logError('Failed to get feature usage analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve feature usage analytics'
      });
    }
  }

  // Get error analytics
  async getErrorAnalytics(req, res) {
    try {
      const { timeRange = '7d', limit = 100 } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const errors = await AnalyticsEvent.find({
        eventType: 'error',
        timestamp: { $gte: startDate }
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
      
      // Get error summary
      const errorSummary = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: 'error',
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$error.message',
            count: { $sum: 1 },
            pages: { $addToSet: '$page' },
            users: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            errorMessage: '$_id',
            count: 1,
            pages: 1,
            uniqueUsers: { $size: '$users' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      logInfo('Error analytics retrieved', { timeRange, limit, userId: req.user?.id });
      
      res.json({
        success: true,
        data: {
          errors,
          summary: errorSummary
        },
        timeRange
      });
    } catch (error) {
      logError('Failed to get error analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve error analytics'
      });
    }
  }

  // Export analytics data
  async exportAnalyticsData(req, res) {
    try {
      const { timeRange = '7d', format = 'json' } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const [events, sessions, chatAnalytics] = await Promise.all([
        AnalyticsEvent.find({ timestamp: { $gte: startDate } }).lean(),
        UserSession.find({ startTime: { $gte: startDate } }).lean(),
        ChatAnalytics.find({ startTime: { $gte: startDate } }).lean()
      ]);
      
      const exportData = {
        timeRange,
        exportDate: new Date(),
        events: events.length,
        sessions: sessions.length,
        chatAnalytics: chatAnalytics.length,
        data: {
          events,
          sessions,
          chatAnalytics
        }
      };
      
      logInfo('Analytics data exported', { timeRange, format, userId: req.user?.id });
      
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="jules-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      } else {
        res.json({
          success: true,
          data: exportData
        });
      }
    } catch (error) {
      logError('Failed to export analytics data', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data'
      });
    }
  }

  // Convert analytics data to CSV format
  convertToCSV(data) {
    const { events, sessions, chatAnalytics } = data.data;
    
    let csvContent = 'Event Type,Category,Action,Page,User ID,Session ID,Timestamp,Properties\n';
    
    // Add events data
    events.forEach(event => {
      const properties = JSON.stringify(event.properties || {}).replace(/"/g, '""');
      const row = [
        event.eventType || '',
        event.category || '',
        event.action || '',
        event.page || '',
        event.userId || '',
        event.sessionId || '',
        event.timestamp || '',
        `"${properties}"`
      ].join(',');
      csvContent += row + '\n';
    });
    
    // Add sessions data
    csvContent += '\nSession Data\n';
    csvContent += 'User ID,Session ID,Start Time,End Time,Duration,Page Views,Chat Messages,Device,Browser\n';
    sessions.forEach(session => {
      const row = [
        session.userId || '',
        session.sessionId || '',
        session.startTime || '',
        session.endTime || '',
        session.duration || '',
        session.pageViews || '',
        session.chatMessages || '',
        session.device || '',
        session.browser || ''
      ].join(',');
      csvContent += row + '\n';
    });
    
    // Add chat analytics data
    if (chatAnalytics.length > 0) {
      csvContent += '\nChat Analytics Data\n';
      csvContent += 'User ID,Start Time,Duration,Message Count,Average Response Time,Sentiment\n';
      chatAnalytics.forEach(chat => {
        const row = [
          chat.userId || '',
          chat.startTime || '',
          chat.duration || '',
          chat.messageCount?.user + chat.messageCount?.assistant || '',
          chat.averageResponseTime || '',
          chat.sentiment?.overall || ''
        ].join(',');
        csvContent += row + '\n';
      });
    }
    
    return csvContent;
  }

  // Get real-time analytics
  async getRealTimeAnalytics(req, res) {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const [
        activeSessions,
        recentEvents,
        recentChatMessages
      ] = await Promise.all([
        UserSession.countDocuments({ 
          isActive: true,
          startTime: { $gte: oneHourAgo }
        }),
        AnalyticsEvent.countDocuments({ 
          timestamp: { $gte: oneHourAgo }
        }),
        AnalyticsEvent.countDocuments({
          eventType: 'chat_message',
          timestamp: { $gte: oneHourAgo }
        })
      ]);
      
      logInfo('Real-time analytics retrieved', { userId: req.user?.id });
      
      res.json({
        success: true,
        data: {
          activeSessions,
          recentEvents,
          recentChatMessages,
          timestamp: now
        }
      });
    } catch (error) {
      logError('Failed to get real-time analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve real-time analytics'
      });
    }
  }

  // Get page performance analytics
  async getPagePerformanceAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);
      
      const pagePerformance = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: 'page_view',
            timestamp: { $gte: startDate },
            loadTime: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$page',
            count: { $sum: 1 },
            averageLoadTime: { $avg: '$loadTime' },
            minLoadTime: { $min: '$loadTime' },
            maxLoadTime: { $max: '$loadTime' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      logInfo('Page performance analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: pagePerformance,
        timeRange
      });
    } catch (error) {
      logError('Failed to get page performance analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve page performance analytics'
      });
    }
  }

  // Get onboarding funnel analytics
  async getOnboardingFunnel(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const funnel = await analyticsService.getOnboardingFunnel(timeRange);
      
      logInfo('Onboarding funnel analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: funnel,
        timeRange
      });
    } catch (error) {
      logError('Failed to get onboarding funnel analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve onboarding funnel analytics'
      });
    }
  }

  // Get conversion rate analytics
  async getConversionRates(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const conversionData = await analyticsService.getConversionRates(timeRange);
      
      logInfo('Conversion rate analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: conversionData,
        timeRange
      });
    } catch (error) {
      logError('Failed to get conversion rate analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversion rate analytics'
      });
    }
  }

  // Get drop-off analysis
  async getDropOffAnalysis(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const dropOffData = await analyticsService.getDropOffAnalysis(timeRange);
      
      logInfo('Drop-off analysis retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: dropOffData,
        timeRange
      });
    } catch (error) {
      logError('Failed to get drop-off analysis', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve drop-off analysis'
      });
    }
  }

  // Get chat topic analytics
  async getChatTopicAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const chatTopics = await analyticsService.getChatTopicAnalytics(timeRange);
      
      logInfo('Chat topic analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: chatTopics,
        timeRange
      });
    } catch (error) {
      logError('Failed to get chat topic analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve chat topic analytics'
      });
    }
  }

  // Get feature adoption analytics
  async getFeatureAdoptionAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      
      const featureAdoption = await analyticsService.getFeatureAdoptionAnalytics(timeRange);
      
      logInfo('Feature adoption analytics retrieved', { timeRange, userId: req.user?.id });
      
      res.json({
        success: true,
        data: featureAdoption,
        timeRange
      });
    } catch (error) {
      logError('Failed to get feature adoption analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve feature adoption analytics'
      });
    }
  }

  // Get user journey analytics
  async getUserJourney(req, res) {
    try {
      const { userId, timeRange = '30d' } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const userJourney = await analyticsService.getUserJourney(userId, timeRange);
      
      logInfo('User journey analytics retrieved', { userId, timeRange, adminId: req.user?.id });
      
      res.json({
        success: true,
        data: userJourney
      });
    } catch (error) {
      logError('Failed to get user journey analytics', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user journey analytics'
      });
    }
  }

  // Get conversion funnel analytics
  async getConversionFunnel(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);

      // Get sign-in/sign-up clicks
      const signupClicks = await AnalyticsEvent.aggregate([
        { $match: { 
          eventType: 'click', 
          action: { $in: ['sign-in', 'sign-up'] },
          timestamp: { $gte: startDate }
        }},
        { $group: { _id: null, count: { $sum: 1 } }}
      ]);

      // Get onboarding completions
      const onboardingCompletions = await AnalyticsEvent.aggregate([
        { $match: { 
          eventType: 'onboarding_complete',
          timestamp: { $gte: startDate }
        }},
        { $group: { _id: null, count: { $sum: 1 } }}
      ]);

      // Get onboarding drop-offs by step
      const onboardingDropoffs = await AnalyticsEvent.aggregate([
        { $match: { 
          eventType: 'onboarding_step',
          timestamp: { $gte: startDate }
        }},
        { $group: { 
          _id: '$properties.step', 
          count: { $sum: 1 },
          completions: { $sum: { $cond: ['$properties.completed', 1, 0] }},
          dropoffs: { $sum: { $cond: ['$properties.completed', 0, 1] }}
        }},
        { $sort: { '_id': 1 }}
      ]);

      const totalSignupClicks = signupClicks[0]?.count || 0;
      const totalCompletions = onboardingCompletions[0]?.count || 0;
      const conversionRate = totalSignupClicks > 0 ? (totalCompletions / totalSignupClicks) * 100 : 0;

      res.json({
        success: true,
        data: {
          signupClicks: totalSignupClicks,
          onboardingCompletions: totalCompletions,
          conversionRate: conversionRate.toFixed(1),
          dropoffByStep: onboardingDropoffs
        }
      });
    } catch (error) {
      logError('Failed to get conversion funnel', error, { userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to get conversion funnel' });
    }
  }

  // Get user list for email marketing
  async getUserList(req, res) {
    try {
      logInfo('Fetching user list for admin panel', { 
        userId: req.user?.id,
        isAdmin: req.user?.isAdmin 
      });

      const users = await User.find({}, 'email name createdAt lastLoginAt isAdmin')
        .sort({ createdAt: -1 });

      logInfo(`Found ${users.length} users in database`, { 
        userId: req.user?.id,
        userCount: users.length 
      });

      const userList = users.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name || 'Unknown',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isAdmin: user.isAdmin || false
      }));

      logInfo('User list prepared for admin panel', { 
        userId: req.user?.id,
        userListCount: userList.length,
        sampleEmails: userList.slice(0, 3).map(u => u.email)
      });

      res.json({
        success: true,
        data: {
          totalUsers: userList.length,
          users: userList
        }
      });
    } catch (error) {
      logError('Failed to get user list', error, { userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to get user list' });
    }
  }

  // Get chat logs
  async getChatLogs(req, res) {
    try {
      const { timeRange = '7d', limit = 50 } = req.query;
      const startDate = analyticsService.getStartDate(timeRange);

      const ChatLog = require('../models/ChatLog');
      const chatLogs = await ChatLog.find({
        timestamp: { $gte: startDate }
      })
      .populate('userId', 'email name')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

      const formattedLogs = chatLogs.map(log => ({
        id: log._id,
        userId: log.userId ? {
          id: log.userId._id,
          email: log.userId.email,
          name: log.userId.name
        } : null,
        message: log.message,
        response: log.response,
        timestamp: log.timestamp,
        sessionId: log.sessionId,
        intent: log.intent,
        sentiment: log.sentiment
      }));

      res.json({
        success: true,
        data: {
          totalLogs: formattedLogs.length,
          logs: formattedLogs
        }
      });
    } catch (error) {
      logError('Failed to get chat logs', error, { userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to get chat logs' });
    }
  }

  // Get daily and weekly active users
  async getActiveUsers(req, res) {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Daily Active Users
      const dailyActiveUsers = await AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } }},
        { $group: { _id: '$userId' }},
        { $count: 'count' }
      ]);

      // Weekly Active Users
      const weeklyActiveUsers = await AnalyticsEvent.aggregate([
        { $match: { timestamp: { $gte: oneWeekAgo } }},
        { $group: { _id: '$userId' }},
        { $count: 'count' }
      ]);

      // Total users
      const totalUsers = await User.countDocuments();

      res.json({
        success: true,
        data: {
          totalUsers,
          dailyActiveUsers: dailyActiveUsers[0]?.count || 0,
          weeklyActiveUsers: weeklyActiveUsers[0]?.count || 0
        }
      });
    } catch (error) {
      logError('Failed to get active users', error, { userId: req.user?.id });
      res.status(500).json({ success: false, error: 'Failed to get active users' });
    }
  }

  // Track analytics events from frontend
  async trackEvent(req, res) {
    try {
      const { event, properties = {}, context = {} } = req.body || {};
      if (!event) return res.status(400).json({ ok: false, error: 'Missing event' });
      const result = await track(event, properties, context);
      
      // Persist to database if payload exists and analytics is enabled
      if (result.payload && !result.dryRun) {
        try {
          // Convert the payload to the format expected by AnalyticsEvent model
          const eventData = {
            userId: result.payload.user_id || 'anonymous',
            sessionId: result.payload.session_id || 'unknown',
            eventType: AnalyticsController.mapEventNameToType(result.payload.event_name),
            category: AnalyticsController.mapEventNameToCategory(result.payload.event_name),
            action: result.payload.action || result.payload.event_name,
            page: result.payload.page,
            properties: result.payload,
            timestamp: new Date(result.payload.event_ts),
            userAgent: req.get('User-Agent'),
            ipAddress: req.ip || req.connection.remoteAddress,
            referrer: req.get('Referrer')
          };
          
          await AnalyticsEvent.create(eventData);
          logInfo('Analytics event saved to database', { event: result.payload.event_name });
        } catch (dbError) {
          logError('Failed to save analytics event to database', dbError);
          // Don't fail the request if database save fails
        }
      }
      
      return res.json({ ok: true, result });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // Helper method to map event names to event types
  static mapEventNameToType(eventName) {
    const typeMap = {
      'page_visited': 'page_view',
      'landing_page_cta_clicked': 'conversion',
      'signup_clicked': 'conversion',
      'account_created': 'conversion',
      'fit_check_started': 'feature_usage',
      'fit_check_completed': 'feature_usage',
      'landing_page_session': 'session_start',
      'onboarding_section_started': 'onboarding_step',
      'onboarding_section_completed': 'onboarding_step',
      'onboarding_step_completed': 'onboarding_step',
      'onboarding_completed': 'onboarding_completion',
      'chat_message_sent': 'chat_message',
      'chat_response_received': 'chat_message',
      'products_shown_in_chat': 'chat_message',
      'product_link_clicked': 'engagement',
      'wishlist_item_added': 'engagement',
      'error_occurred': 'error',
      'session_started': 'session_start',
      'session_ended': 'session_end'
    };
    return typeMap[eventName] || 'feature_usage';
  }

  // Helper method to map event names to categories
  static mapEventNameToCategory(eventName) {
    const categoryMap = {
      'page_visited': 'navigation',
      'landing_page_cta_clicked': 'engagement',
      'signup_clicked': 'engagement',
      'account_created': 'conversion',
      'fit_check_started': 'fit_check',
      'fit_check_completed': 'fit_check',
      'landing_page_session': 'engagement',
      'onboarding_section_started': 'onboarding',
      'onboarding_section_completed': 'onboarding',
      'onboarding_step_completed': 'onboarding',
      'onboarding_completed': 'onboarding',
      'chat_message_sent': 'chat',
      'chat_response_received': 'chat',
      'products_shown_in_chat': 'chat',
      'product_link_clicked': 'engagement',
      'wishlist_item_added': 'wishlist',
      'error_occurred': 'errors',
      'session_started': 'engagement',
      'session_ended': 'engagement'
    };
    return categoryMap[eventName] || 'engagement';
  }
}

module.exports = new AnalyticsController(); 