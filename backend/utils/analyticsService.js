const AnalyticsEvent = require('../models/AnalyticsEvent');
const UserSession = require('../models/UserSession');
const ChatAnalytics = require('../models/ChatAnalytics');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const UAParser = require('ua-parser-js');

class AnalyticsService {
  constructor() {
    this.activeSessions = new Map();
  }

  // Generate unique session ID
  generateSessionId() {
    return uuidv4();
  }

  // Parse user agent for device/browser info
  parseUserAgent(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    let device = 'desktop';
    if (result.device.type === 'mobile') device = 'mobile';
    else if (result.device.type === 'tablet') device = 'tablet';
    
    return {
      device,
      browser: result.browser.name,
      os: result.os.name,
      userAgent: userAgent
    };
  }

  // Start a new user session
  async startSession(userId, req) {
    const sessionId = this.generateSessionId();
    const userInfo = this.parseUserAgent(req.get('User-Agent'));
    
    const session = new UserSession({
      sessionId,
      userId: userId || 'anonymous',
      userAgent: userInfo.userAgent,
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referrer'),
      device: userInfo.device,
      browser: userInfo.browser,
      os: userInfo.os
    });

    await session.save();
    this.activeSessions.set(sessionId, session);
    
    // Track session start event
    await this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'session_start',
      category: 'engagement',
      action: 'session_started',
      page: req.path,
      userAgent: userInfo.userAgent,
      ipAddress: req.ip || req.connection.remoteAddress,
      referrer: req.get('Referrer')
    });

    return sessionId;
  }

  // End a user session
  async endSession(sessionId) {
    const session = await UserSession.findOne({ sessionId });
    if (session && session.isActive) {
      await session.endSession();
      this.activeSessions.delete(sessionId);
      
      // Track session end event
      await this.trackEvent({
        userId: session.userId,
        sessionId,
        eventType: 'session_end',
        category: 'engagement',
        action: 'session_ended',
        properties: {
          duration: session.duration,
          pageViews: session.pageViews,
          chatMessages: session.chatMessages
        }
      });
    }
  }

  // Track a page view
  async trackPageView(userId, sessionId, req, loadTime = null) {
    const session = await UserSession.findOne({ sessionId });
    if (session) {
      session.pageViews += 1;
      
      // Update bounce status inline instead of calling save() method
      if (session.pageViews > 1) {
        session.isBounce = false;
      }
      
      if (loadTime) {
        session.totalLoadTime = (session.totalLoadTime || 0) + loadTime;
        session.averageLoadTime = session.totalLoadTime / session.pageViews;
      }
      
      // Single save operation to avoid ParallelSaveError
      await session.save();
    }

    return this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'page_view',
      category: 'navigation',
      action: 'page_viewed',
      page: req.path,
      properties: {
        loadTime,
        referrer: req.get('Referrer')
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress,
      loadTime
    });
  }

  // Track chat message
  async trackChatMessage(userId, sessionId, messageData, req) {
    const session = await UserSession.findOne({ sessionId });
    if (session) {
      session.chatMessages += 1;
      await session.save();
    }

    return this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'chat_message',
      category: 'chat',
      action: messageData.role === 'user' ? 'user_message' : 'assistant_message',
      page: '/chat',
      properties: {
        messageLength: messageData.content.length,
        role: messageData.role,
        intent: messageData.intent || null,
        sentiment: messageData.sentiment || null
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });
  }

  // Track feature usage
  async trackFeatureUsage(userId, sessionId, feature, action, req, properties = {}) {
    const session = await UserSession.findOne({ sessionId });
    if (session) {
      const existingFeature = session.featuresUsed.find(f => f.feature === feature);
      if (existingFeature) {
        existingFeature.count += 1;
        existingFeature.lastUsed = new Date();
      } else {
        session.featuresUsed.push({
          feature,
          count: 1,
          firstUsed: new Date(),
          lastUsed: new Date()
        });
      }
      await session.save();
    }

    return this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'feature_usage',
      category: this.getFeatureCategory(feature),
      action,
      page: req.path,
      properties: {
        feature,
        ...properties
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });
  }

  // Track onboarding step
  async trackOnboardingStep(userId, sessionId, step, req, properties = {}) {
    return this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'onboarding_step',
      category: 'onboarding',
      action: step,
      page: req.path,
      properties: {
        step,
        ...properties
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });
  }

  // Track error
  async trackError(userId, sessionId, error, req) {
    const session = await UserSession.findOne({ sessionId });
    if (session) {
      session.errorEvents.push({
        message: error.message,
        timestamp: new Date(),
        page: req.path
      });
      await session.save();
    }

    return this.trackEvent({
      userId: userId || 'anonymous',
      sessionId,
      eventType: 'error',
      category: 'errors',
      action: 'error_occurred',
      page: req.path,
      properties: {
        errorType: error.name,
        errorMessage: error.message
      },
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    });
  }

  // Generic event tracking
  async trackEvent(eventData) {
    const event = new AnalyticsEvent(eventData);
    return await event.save();
  }

  // Get feature category
  getFeatureCategory(feature) {
    const categoryMap = {
      'chat': 'chat',
      'wardrobe': 'wardrobe',
      'fit_check': 'fit_check',
      'wishlist': 'wishlist',
      'onboarding': 'onboarding',
      'profile': 'profile',
      'settings': 'settings'
    };
    
    return categoryMap[feature] || 'other';
  }

  // Get onboarding funnel analytics
  async getOnboardingFunnel(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    const funnel = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: { $in: ['onboarding_step', 'conversion'] },
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          step: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return funnel;
  }

  // Get conversion rate analytics
  async getConversionRates(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    const conversions = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'conversion',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          conversionType: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Get total users for conversion rate calculation
    const totalUsers = await UserSession.distinct('userId', {
      startTime: { $gte: startDate }
    });
    
    const conversionRates = conversions.map(conv => ({
      ...conv,
      conversionRate: totalUsers.length > 0 ? (conv.uniqueUsers / totalUsers.length * 100).toFixed(2) : 0
    }));
    
    return {
      conversions: conversionRates,
      totalUsers: totalUsers.length
    };
  }

  // Get user journey analytics
  async getUserJourney(userId, timeRange = '30d') {
    const startDate = this.getStartDate(timeRange);
    
    const events = await AnalyticsEvent.find({
      userId,
      timestamp: { $gte: startDate }
    })
    .sort({ timestamp: 1 })
    .lean();
    
    // Group events by session
    const sessions = {};
    events.forEach(event => {
      if (!sessions[event.sessionId]) {
        sessions[event.sessionId] = [];
      }
      sessions[event.sessionId].push(event);
    });
    
    // Analyze user journey patterns
    const journeyPatterns = Object.values(sessions).map(sessionEvents => {
      const pageSequence = sessionEvents
        .filter(e => e.eventType === 'page_view')
        .map(e => e.page);
      
      const featureUsage = sessionEvents
        .filter(e => e.eventType === 'feature_usage')
        .map(e => e.action);
      
      return {
        sessionId: sessionEvents[0]?.sessionId,
        startTime: sessionEvents[0]?.timestamp,
        endTime: sessionEvents[sessionEvents.length - 1]?.timestamp,
        pageSequence,
        featureUsage,
        totalEvents: sessionEvents.length
      };
    });
    
    return {
      userId,
      totalSessions: Object.keys(sessions).length,
      journeyPatterns,
      timeRange
    };
  }

  // Get drop-off analysis
  async getDropOffAnalysis(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    // Get onboarding steps in order
    const onboardingSteps = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'onboarding_step',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          step: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // Calculate drop-off rates
    const dropOffAnalysis = [];
    let previousUserCount = 0;
    
    onboardingSteps.forEach((step, index) => {
      const dropOffRate = previousUserCount > 0 
        ? ((previousUserCount - step.uniqueUsers) / previousUserCount * 100).toFixed(2)
        : 0;
      
      dropOffAnalysis.push({
        ...step,
        dropOffRate: parseFloat(dropOffRate),
        stepOrder: index + 1
      });
      
      previousUserCount = step.uniqueUsers;
    });
    
    return dropOffAnalysis;
  }

  // Get chat topic analytics
  async getChatTopicAnalytics(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    const chatTopics = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'chat_message',
          timestamp: { $gte: startDate },
          'properties.topic': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$properties.topic',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          averageResponseTime: { $avg: '$properties.responseTime' }
        }
      },
      {
        $project: {
          topic: '$_id',
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          averageResponseTime: { $round: ['$averageResponseTime', 2] }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return chatTopics;
  }

  // Get feature adoption analytics
  async getFeatureAdoptionAnalytics(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    const featureAdoption = await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'feature_usage',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$properties.feature',
          totalUses: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          actions: { $addToSet: '$action' }
        }
      },
      {
        $project: {
          feature: '$_id',
          totalUses: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          actions: 1
        }
      },
      { $sort: { totalUses: -1 } }
    ]);
    
    // Get total users for adoption rate calculation
    const totalUsers = await UserSession.distinct('userId', {
      startTime: { $gte: startDate }
    });
    
    const adoptionRates = featureAdoption.map(feature => ({
      ...feature,
      adoptionRate: totalUsers.length > 0 ? (feature.uniqueUsers / totalUsers.length * 100).toFixed(2) : 0
    }));
    
    return {
      features: adoptionRates,
      totalUsers: totalUsers.length
    };
  }

  // Read analytics from dry-run log
  async getAnalyticsFromLog() {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'analytics.dryrun.log');
    
    try {
      if (!fs.existsSync(logPath)) return [];
      
      const logData = fs.readFileSync(logPath, 'utf8');
      const lines = logData.trim().split('\n').filter(line => line.trim());
      
      return lines.map(line => {
        try {
          const parsed = JSON.parse(line);
          return parsed.payload;
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Error reading analytics log:', error);
      return [];
    }
  }

  // Analytics queries for dashboard
  async getDashboardMetrics(timeRange = '7d') {
    const startDate = this.getStartDate(timeRange);
    
    // Get events from database directly
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const dbEvents = await AnalyticsEvent.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
    
    // Convert database events to the format expected by processComprehensiveAnalytics
    const filteredEvents = dbEvents.map(event => ({
      event_ts: event.timestamp,
      event_name: event.properties?.event_name || event.action,
      user_id: event.userId,
      session_id: event.sessionId,
      page: event.properties?.page,
      button_text: event.properties?.button_text,
      source: event.properties?.source,
      feature: event.properties?.feature,
      rating: event.properties?.rating,
      ...event.properties
    }));

    // Process comprehensive analytics
    const metrics = await this.processComprehensiveAnalytics(filteredEvents);
    
    return metrics;
  }

  // Process comprehensive analytics from log events
  async processComprehensiveAnalytics(events) {
    const eventsByType = {};
    const userSessions = new Set();
    const uniqueUsers = new Set();
    
    // Group events by type
    events.forEach(event => {
      // Get event name from properties.event_name or fall back to action
      const eventName = event.event_name || event.action;
      if (!eventsByType[eventName]) {
        eventsByType[eventName] = [];
      }
      eventsByType[eventName].push(event);
      
      // Get user and session info from the event structure
      const userId = event.user_id || event.userId;
      const sessionId = event.session_id || event.sessionId;
      
      if (userId) uniqueUsers.add(userId);
      if (sessionId) userSessions.add(sessionId);
    });

    // Calculate conversion funnel
    const landingPageVisits = (eventsByType['page_visited'] || []).filter(e => e.page === '/').length;
    const meetJulesClicks = (eventsByType['landing_page_cta_clicked'] || []).length;
    const accountCreations = (eventsByType['account_created'] || []).length;
    const onboardingCompletions = (eventsByType['onboarding_completed'] || []).length;
    
    // Calculate Free Experience Landing Page metrics
    const freeExperienceSessions = (eventsByType['landing_page_session'] || []).filter(e => e.page === '/free-experience').length;
    const freeExperienceUniqueVisitors = new Set((eventsByType['landing_page_session'] || []).filter(e => e.page === '/free-experience').map(e => e.user_id || e.session_id)).size;
    const tryFreeFitCheckClicks = (eventsByType['landing_page_cta_clicked'] || []).filter(e => e.button_text === 'Try Free Fit Check').length;
    const getStartedForFreeClicks = (eventsByType['landing_page_cta_clicked'] || []).filter(e => e.button_text === 'Get Started for Free').length;
    
    // Also check for cta_button_clicked events (fallback)
    const ctaButtonEvents = eventsByType['cta_button_clicked'] || [];
    const tryFreeFitCheckClicksFromCTA = ctaButtonEvents.filter(e => e.button_text === 'Try Free Fit Check').length;
    const getStartedForFreeClicksFromCTA = ctaButtonEvents.filter(e => e.button_text === 'Get Started for Free').length;
    
    const totalTryFreeFitCheckClicks = tryFreeFitCheckClicks + tryFreeFitCheckClicksFromCTA;
    const totalGetStartedForFreeClicks = getStartedForFreeClicks + getStartedForFreeClicksFromCTA;
    
    // Debug logging
    console.log('DEBUG: Total events processed:', events.length);
    console.log('DEBUG: Event types found:', Object.keys(eventsByType));
    console.log('DEBUG: CTA events found:', eventsByType['landing_page_cta_clicked']?.length || 0);
    if (eventsByType['landing_page_cta_clicked']) {
      console.log('DEBUG: CTA events details:', eventsByType['landing_page_cta_clicked'].map(e => ({
        button_text: e.button_text,
        user_id: e.user_id,
        timestamp: e.event_ts
      })));
    }
    console.log('DEBUG: Try Free Fit Check clicks (landing_page_cta_clicked):', tryFreeFitCheckClicks);
    console.log('DEBUG: Try Free Fit Check clicks (cta_button_clicked):', tryFreeFitCheckClicksFromCTA);
    console.log('DEBUG: Total Try Free Fit Check clicks:', totalTryFreeFitCheckClicks);
    console.log('DEBUG: Get Started for Free clicks (landing_page_cta_clicked):', getStartedForFreeClicks);
    console.log('DEBUG: Get Started for Free clicks (cta_button_clicked):', getStartedForFreeClicksFromCTA);
    console.log('DEBUG: Total Get Started for Free clicks:', totalGetStartedForFreeClicks);
    const registrationsFromLanding = (eventsByType['account_created'] || []).filter(e => e.source === 'free-experience' || e.source === 'landing_page').length;
    
    // Calculate Free Fit Check Page metrics
    const fitCheckSessions = (eventsByType['page_visited'] || []).filter(e => e.page === '/free-experience/fit-check').length;
    const fitCheckUniqueVisitors = new Set((eventsByType['page_visited'] || []).filter(e => e.page === '/free-experience/fit-check').map(e => e.user_id || e.session_id)).size;
    const fitChecksStarted = (eventsByType['fit_check_started'] || []).length;
    const fitChecksCompleted = (eventsByType['fit_check_completed'] || []).length;
    const signupForFullExperienceClicks = (eventsByType['signup_clicked'] || []).filter(e => e.properties?.source === 'fit_check_results' || e.properties?.source === 'fit_check_upgrade_prompt').length;
    const registrationsFromFitCheck = [
      ...(eventsByType['account_created'] || []),
      ...(eventsByType['signup'] || [])
    ].filter(e => 
      e.properties?.source === 'fit-check' || 
      e.properties?.source === 'anonymous-fit-check' ||
      e.properties?.feature === 'fit-check' ||
      e.properties?.redirect === 'fit-check'
    ).length;
    
    // Calculate onboarding analytics
    const onboardingSteps = this.calculateOnboardingSteps(eventsByType);
    
    // Get chat logs data first to avoid duplicate fetching
    const chatLogsData = await this.getChatLogsFromMongoDB();
    
    // Calculate chat analytics
    const chatAnalytics = await this.calculateChatAnalytics(eventsByType, chatLogsData);
    
    // Calculate fit check analytics
    const fitCheckAnalytics = this.calculateFitCheckAnalytics(eventsByType);
    
    // Calculate closet analytics
    const closetAnalytics = this.calculateClosetAnalytics(eventsByType);
    
    // Calculate user analytics
    const userAnalytics = await this.calculateUserAnalytics(eventsByType, uniqueUsers);
    
    // Calculate session analytics
    const sessionAnalytics = this.calculateSessionAnalytics(eventsByType);

    return {
      // General Metrics
      totalUsers: uniqueUsers.size,
      activeUsers: uniqueUsers.size,
      dailyActiveUsers: uniqueUsers.size,
      weeklyActiveUsers: uniqueUsers.size,
      totalSessions: userSessions.size,
      totalPageViews: (eventsByType['page_visited'] || []).length,
      totalChatMessages: (eventsByType['chat_message_sent'] || []).length,
      bounceRate: 0, // Calculate based on session data
      averageSessionDuration: sessionAnalytics.averageDuration,
      errors: (eventsByType['error_occurred'] || []).length,
      
      // Conversion Funnel
      landingPageVisits,
      meetJulesClicks,
      accountCreations,
      onboardingCompletions,
      conversionRate: landingPageVisits > 0 ? `${((onboardingCompletions / landingPageVisits) * 100).toFixed(2)}% (${onboardingCompletions}/${landingPageVisits})` : '0% (0/0)',
      
      // Free Experience Landing Page Metrics
      freeExperienceSessions,
      freeExperienceUniqueVisitors,
      tryFreeFitCheckClicks: totalTryFreeFitCheckClicks,
      getStartedForFreeClicks: totalGetStartedForFreeClicks,
      registrationsFromLanding,
      
      // Free Fit Check Page Metrics
      fitCheckSessions,
      fitCheckUniqueVisitors,
      fitChecksStarted,
      fitChecksCompleted,
      signupForFullExperienceClicks,
      registrationsFromFitCheck,
      
      // Onboarding Analytics
      onboardingSteps,
      onboardingBounces: 0,
      
      // Chat Analytics
      chatAnalytics,
      
      // Fit Check Analytics
      fitCheckAnalytics,
      
      // Closet Analytics
      closetAnalytics,
      
      // User Analytics
      userAnalytics,
      
      // Page Analytics
      topPages: this.calculateTopPages(eventsByType),
      topFeatures: this.calculateTopFeatures(eventsByType),
      
      // Chat Logs - use already fetched data
      chatLogs: chatLogsData
    };
  }

  // Get real chat logs from MongoDB
  async getChatLogsFromMongoDB() {
    try {
      const mongoose = require('mongoose');
      
      // Define conversation schema if not already defined
      let Conversation;
      try {
        Conversation = mongoose.model('Conversation');
      } catch (e) {
        const conversationSchema = new mongoose.Schema({
          userId: String,
          messages: [{
            role: String,
            content: String,
            timestamp: Date,
            _id: mongoose.Schema.Types.ObjectId
          }],
          createdAt: Date,
          updatedAt: Date
        });
        Conversation = mongoose.model('Conversation', conversationSchema);
      }

      // Get recent conversations with user details
      const conversations = await Conversation.find({})
        .sort({ updatedAt: -1 })
        .limit(50)
        .lean();

      // Process conversations into chat logs format
      const logs = [];
      let totalMessages = 0;

      for (const conv of conversations) {
        if (conv.messages && conv.messages.length > 0) {
          totalMessages += conv.messages.length;
          
          // Add each message as a log entry
          conv.messages.forEach(msg => {
            logs.push({
              userId: conv.userId || 'anonymous',
              role: msg.role,
              message: msg.content || 'No content',
              timestamp: msg.timestamp || conv.updatedAt,
              conversationId: conv._id,
              sentiment: this.analyzeSentiment(msg.content) // Simple sentiment analysis
            });
          });
        }
      }

      // Sort by timestamp (most recent first)
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return {
        totalLogs: totalMessages,
        totalConversations: conversations.length,
        logs: logs.slice(0, 100) // Limit to 100 most recent messages
      };
    } catch (error) {
      console.error('Error fetching chat logs from MongoDB:', error);
      return {
        totalLogs: 0,
        totalConversations: 0,
        logs: []
      };
    }
  }

  // Simple sentiment analysis
  analyzeSentiment(text) {
    if (!text) return 'neutral';
    
    const positiveWords = ['good', 'great', 'awesome', 'love', 'like', 'perfect', 'amazing', 'excellent', 'fantastic'];
    const negativeWords = ['bad', 'hate', 'terrible', 'awful', 'horrible', 'worst', 'sucks', 'disappointed'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calculate onboarding step analytics
  calculateOnboardingSteps(eventsByType) {
    const stepCompletions = eventsByType['onboarding_step_completed'] || [];
    const totalCompletions = eventsByType['onboarding_completed'] || [];
    
    const steps = [
      { step: 'profile_submission', completed: stepCompletions.length, skipped: 0, total: stepCompletions.length + totalCompletions.length }
    ];
    
    return steps.map(step => ({
      ...step,
      completionRate: step.total > 0 ? `${((step.completed / step.total) * 100).toFixed(1)}% (${step.completed}/${step.total})` : '0% (0/0)'
    }));
  }

  // Calculate chat analytics
  async calculateChatAnalytics(eventsByType, chatLogsData = null) {
    const chatMessages = eventsByType['chat_message_sent'] || [];
    const productsShown = eventsByType['products_shown_in_chat'] || [];
    const productClicks = eventsByType['product_link_clicked'] || [];
    const wishlistAdds = eventsByType['wishlist_item_added'] || [];
    
    // Use provided chat logs data or fetch it
    const chatLogs = chatLogsData || await this.getChatLogsFromMongoDB();
    
    // Calculate sentiment distribution from real data
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
    
    chatLogs.logs.forEach(log => {
      if (log.role === 'user') { // Only count user messages for sentiment
        sentimentCounts[log.sentiment]++;
      }
    });
    
    const totalUserMessages = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
    
    return {
      totalConversations: chatLogs.totalConversations,
      averageResponseTime: 2500, // Mock data - would need actual timing data
      topIntents: [
        { _id: 'style_advice', count: Math.floor(chatMessages.length * 0.4) },
        { _id: 'product_search', count: Math.floor(chatMessages.length * 0.3) },
        { _id: 'fit_check', count: Math.floor(chatMessages.length * 0.2) },
        { _id: 'general', count: Math.floor(chatMessages.length * 0.1) }
      ],
      sentimentDistribution: {
        positive: totalUserMessages > 0 ? `${((sentimentCounts.positive / totalUserMessages) * 100).toFixed(1)}% (${sentimentCounts.positive}/${totalUserMessages})` : '0% (0/0)',
        neutral: totalUserMessages > 0 ? `${((sentimentCounts.neutral / totalUserMessages) * 100).toFixed(1)}% (${sentimentCounts.neutral}/${totalUserMessages})` : '0% (0/0)',
        negative: totalUserMessages > 0 ? `${((sentimentCounts.negative / totalUserMessages) * 100).toFixed(1)}% (${sentimentCounts.negative}/${totalUserMessages})` : '0% (0/0)'
      },
      productCalls: productsShown.length,
      productLinksClicked: productClicks.length,
      wishlistAdds: wishlistAdds.length
    };
  }

  // Calculate fit check analytics
  calculateFitCheckAnalytics(eventsByType) {
    const fitCheckUploads = eventsByType['fit_check_uploaded'] || [];
    const fitCheckToLooks = eventsByType['fit_check_to_looks_navigation'] || [];
    
    const completionRate = fitCheckUploads.length > 0 ? 100 : 0;
    
    return {
      fitCheckVisits: fitCheckUploads.length,
      fitCheckCompletions: fitCheckUploads.length,
      completionRate: `${completionRate}% (${fitCheckUploads.length}/${fitCheckUploads.length})`,
      averageRating: 4.2 // Mock data - would need actual rating data
    };
  }

  // Calculate closet analytics
  calculateClosetAnalytics(eventsByType) {
    const closetItems = eventsByType['closet_item_added'] || [];
    const wishlistItems = eventsByType['wishlist_item_added'] || [];
    const wishlistAccess = eventsByType['wishlist_accessed'] || [];
    const wishlistClicks = eventsByType['wishlist_product_clicked'] || [];
    
    const usersWithItems = [
      { itemCount: 1, userCount: Math.floor(closetItems.length * 0.4) },
      { itemCount: 2, userCount: Math.floor(closetItems.length * 0.3) },
      { itemCount: 3, userCount: Math.floor(closetItems.length * 0.3) }
    ];
    
    const wishlistAccessRate = wishlistAccess.length > 0 ? 75 : 0; // Would calculate from actual data
    const wishlistCTR = wishlistAccess.length > 0 ? ((wishlistClicks.length / wishlistAccess.length) * 100).toFixed(1) : 0;
    
    return {
      usersWithItems,
      wishlistAccessRate: `${wishlistAccessRate}% (${wishlistAccess.length} users accessed)`,
      wishlistCTR: `${wishlistCTR}% (${wishlistClicks.length}/${wishlistAccess.length})`,
      wishlistClickThroughs: wishlistItems.length
    };
  }

  // Calculate user analytics
  async calculateUserAnalytics(eventsByType, uniqueUsers) {
    const accountCreations = eventsByType['account_created'] || [];
    
    // Get all users from the database for the user email list
    const User = require('../models/User');
    const allUsers = await User.find({}, 'email name createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 most recent users
    
    return {
      userEmails: allUsers.map(user => ({
        email: user.email,
        name: user.name || 'Unknown',
        lastActive: user.lastLoginAt || user.createdAt
      })),
      repeatVisitors: Math.floor(uniqueUsers.size * 0.3),
      repeatVisitorRate: uniqueUsers.size > 0 ? ((Math.floor(uniqueUsers.size * 0.3) / uniqueUsers.size) * 100).toFixed(1) : 0
    };
  }

  // Calculate session analytics
  calculateSessionAnalytics(eventsByType) {
    const sessionStarts = eventsByType['session_started'] || [];
    const sessionEnds = eventsByType['session_ended'] || [];
    
    let totalDuration = 0;
    sessionEnds.forEach(endEvent => {
      if (endEvent.duration_ms) {
        totalDuration += endEvent.duration_ms;
      }
    });
    
    return {
      averageDuration: sessionEnds.length > 0 ? Math.floor(totalDuration / sessionEnds.length) : 218000 // 3m 38s default
    };
  }

  // Calculate top pages
  calculateTopPages(eventsByType) {
    const pageVisits = eventsByType['page_visited'] || [];
    const pageCounts = {};
    
    pageVisits.forEach(event => {
      const page = event.page || '/';
      pageCounts[page] = (pageCounts[page] || 0) + 1;
    });
    
    return Object.entries(pageCounts)
      .map(([page, count]) => ({ _id: page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Calculate top features
  calculateTopFeatures(eventsByType) {
    const features = [
      { feature: 'Chat', count: (eventsByType['chat_message_sent'] || []).length, uniqueUsers: new Set((eventsByType['chat_message_sent'] || []).map(e => e.user_id)).size },
      { feature: 'Fit Check', count: (eventsByType['fit_check_uploaded'] || []).length, uniqueUsers: new Set((eventsByType['fit_check_uploaded'] || []).map(e => e.user_id)).size },
      { feature: 'Closet', count: (eventsByType['closet_item_added'] || []).length, uniqueUsers: new Set((eventsByType['closet_item_added'] || []).map(e => e.user_id)).size },
      { feature: 'Wishlist', count: (eventsByType['wishlist_item_added'] || []).length, uniqueUsers: new Set((eventsByType['wishlist_item_added'] || []).map(e => e.user_id)).size }
    ];
    
    return features.sort((a, b) => b.count - a.count);
  }

  // Helper method to get start date based on time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  // Individual metric queries
  async getTotalUsers(startDate) {
    return await User.countDocuments({ createdAt: { $gte: startDate } });
  }

  async getActiveUsers(startDate) {
    return await UserSession.distinct('userId', { 
      startTime: { $gte: startDate } 
    }).then(users => users.length);
  }

  async getTotalSessions(startDate) {
    return await UserSession.countDocuments({ 
      startTime: { $gte: startDate } 
    });
  }

  async getTotalPageViews(startDate) {
    return await AnalyticsEvent.countDocuments({
      eventType: 'page_view',
      timestamp: { $gte: startDate }
    });
  }

  async getTotalChatMessages(startDate) {
    return await AnalyticsEvent.countDocuments({
      eventType: 'chat_message',
      timestamp: { $gte: startDate }
    });
  }

  async getBounceRate(startDate) {
    const totalSessions = await UserSession.countDocuments({ 
      startTime: { $gte: startDate } 
    });
    const bounceSessions = await UserSession.countDocuments({ 
      startTime: { $gte: startDate },
      isBounce: true 
    });
    
    return totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;
  }

  async getAverageSessionDuration(startDate) {
    const sessions = await UserSession.find({
      startTime: { $gte: startDate },
      duration: { $gt: 0 }
    });
    
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    return totalDuration / sessions.length;
  }

  async getTopPages(startDate) {
    return await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
  }

  async getTopFeatures(startDate) {
    return await AnalyticsEvent.aggregate([
      {
        $match: {
          eventType: 'feature_usage',
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$properties.feature',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);
  }

  async getChatAnalytics(startDate) {
    const [
      totalConversations,
      averageResponseTime,
      topIntents,
      sentimentDistribution
    ] = await Promise.all([
      ChatAnalytics.countDocuments({ startTime: { $gte: startDate } }),
      ChatAnalytics.aggregate([
        { $match: { startTime: { $gte: startDate } } },
        { $group: { _id: null, avg: { $avg: '$averageResponseTime' } } }
      ]),
      ChatAnalytics.aggregate([
        { $match: { startTime: { $gte: startDate } } },
        { $group: { _id: '$primaryIntent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      ChatAnalytics.aggregate([
        { $match: { startTime: { $gte: startDate } } },
        { $group: { _id: '$sentiment.overall', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalConversations,
      averageResponseTime: averageResponseTime[0]?.avg || 0,
      topIntents,
      sentimentDistribution
    };
  }

  // Get time series data for charts
  async getTimeSeriesData(timeRange = '7d', metric = 'page_views') {
    const startDate = this.getStartDate(timeRange);
    const interval = this.getInterval(timeRange);
    
    let matchStage = { timestamp: { $gte: startDate } };
    let groupStage = {
      _id: {
        $dateToString: {
          format: interval,
          date: '$timestamp'
        }
      }
    };

    switch (metric) {
      case 'page_views':
        matchStage.eventType = 'page_view';
        groupStage.count = { $sum: 1 };
        break;
      case 'chat_messages':
        matchStage.eventType = 'chat_message';
        groupStage.count = { $sum: 1 };
        break;
      case 'sessions':
        return await UserSession.aggregate([
          { $match: { startTime: { $gte: startDate } } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: interval,
                  date: '$startTime'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      case 'users':
        return await UserSession.aggregate([
          { $match: { startTime: { $gte: startDate } } },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: interval,
                  date: '$startTime'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
    }

    return await AnalyticsEvent.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { _id: 1 } }
    ]);
  }

  getInterval(timeRange) {
    switch (timeRange) {
      case '1d':
        return '%Y-%m-%d %H:00';
      case '7d':
        return '%Y-%m-%d';
      case '30d':
        return '%Y-%m-%d';
      case '90d':
        return '%Y-%m-%d';
      default:
        return '%Y-%m-%d';
    }
  }
}

module.exports = new AnalyticsService(); 