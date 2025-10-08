const { logInfo, logError } = require('../utils/logger');
const User = require('../models/User');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Conversation = require('../models/Conversation');
const ProfilePicReview = require('../models/ProfilePicReview');
const FitCheck = require('../models/FitCheck');

class AnalyticsControllerV2 {
  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);
      
      logInfo('Fetching dashboard metrics', { timeRange, startDate });

      // Fetch all metrics in parallel
      const [
        coreMetrics,
        landingPageMetrics,
        onboardingMetrics,
        chatMetrics,
        profilePicMetrics,
        fitCheckMetrics,
        userQualityMetrics
      ] = await Promise.all([
        this.getCoreMetrics(startDate),
        this.getLandingPageMetrics(startDate),
        this.getOnboardingMetrics(startDate),
        this.getChatMetrics(startDate),
        this.getProfilePicMetrics(startDate),
        this.getFitCheckMetrics(startDate),
        this.getUserQualityMetrics(startDate)
      ]);

      const metrics = {
        ...coreMetrics,
        landingPage: landingPageMetrics,
        onboarding: onboardingMetrics,
        chatAnalytics: chatMetrics,
        profilePicReview: profilePicMetrics,
        fitCheck: fitCheckMetrics,
        userQuality: userQualityMetrics
      };

      res.json(metrics);
    } catch (error) {
      logError('Failed to get dashboard metrics', error);
      res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
    }
  }

  /**
   * Get core metrics (users, sessions, etc.)
   */
  async getCoreMetrics(startDate) {
    try {
      // Total users
      const totalUsers = await User.countDocuments();

      // Daily active users (users with activity in last 24 hours)
      const dailyActiveUsers = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      // Weekly active users
      const weeklyActiveUsers = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      // Monthly active users
      const monthlyActiveUsers = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      // Average session duration
      const sessionEvents = await AnalyticsEvent.find({
        eventType: { $in: ['session_start', 'session_end'] },
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });

      let totalDuration = 0;
      let sessionCount = 0;
      const sessionMap = new Map();
      const maxValidDuration = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      sessionEvents.forEach(event => {
        if (event.eventType === 'session_start') {
          sessionMap.set(event.sessionId, event.timestamp);
        } else if (event.eventType === 'session_end' && sessionMap.has(event.sessionId)) {
          const startTime = sessionMap.get(event.sessionId);
          const duration = event.timestamp.getTime() - startTime.getTime();
          
          // Filter out extreme outliers (sessions longer than 2 hours)
          if (duration > 0 && duration <= maxValidDuration) {
            totalDuration += duration;
            sessionCount++;
          }
          
          sessionMap.delete(event.sessionId);
        }
      });

      const averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 218000; // 3m 38s default

      return {
        totalUsers,
        dailyActiveUsers: dailyActiveUsers.length,
        weeklyActiveUsers: weeklyActiveUsers.length,
        monthlyActiveUsers: monthlyActiveUsers.length,
        averageSessionDuration
      };
    } catch (error) {
      logError('Failed to get core metrics', error);
      return {
        totalUsers: 0,
        dailyActiveUsers: 0,
        weeklyActiveUsers: 0,
        monthlyActiveUsers: 0,
        averageSessionDuration: 0
      };
    }
  }

  /**
   * Get landing page metrics
   */
  async getLandingPageMetrics(startDate) {
    try {
      // Landing page sessions
      const landingPageEvents = await AnalyticsEvent.find({
        page: { $in: ['/', '/landing-new', '/free-experience'] },
        timestamp: { $gte: startDate }
      });

      const sessions = await AnalyticsEvent.distinct('sessionId', {
        page: { $in: ['/', '/landing-new', '/free-experience'] },
        timestamp: { $gte: startDate }
      });

      const uniqueVisitors = await AnalyticsEvent.distinct('userId', {
        page: { $in: ['/', '/landing-new', '/free-experience'] },
        timestamp: { $gte: startDate }
      });

      // CTA clicks
      const getFreePicReviewClicks = await AnalyticsEvent.countDocuments({
        action: 'get_free_profile_pic_review_click',
        timestamp: { $gte: startDate }
      });

      const getStartedClicks = await AnalyticsEvent.countDocuments({
        action: 'get_started_for_free_click',
        timestamp: { $gte: startDate }
      });

      // Calculate bounce rate (sessions with only 1 page view)
      const sessionPageCounts = await AnalyticsEvent.aggregate([
        {
          $match: {
            page: { $in: ['/', '/landing-new', '/free-experience'] },
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$sessionId',
            pageCount: { $sum: 1 }
          }
        }
      ]);

      const bouncedSessions = sessionPageCounts.filter(s => s.pageCount === 1).length;
      const bounceRate = sessions.length > 0 ? (bouncedSessions / sessions.length) * 100 : 0;

      // Average time on page
      const pageViewEvents = await AnalyticsEvent.find({
        eventType: 'page_view',
        page: { $in: ['/', '/landing-new', '/free-experience'] },
        timestamp: { $gte: startDate }
      }).sort({ timestamp: 1 });

      let totalTimeOnPage = 0;
      let timeCalculations = 0;
      const pageViewMap = new Map();

      pageViewEvents.forEach(event => {
        if (pageViewMap.has(event.sessionId)) {
          const previousTime = pageViewMap.get(event.sessionId);
          totalTimeOnPage += event.timestamp.getTime() - previousTime;
          timeCalculations++;
        }
        pageViewMap.set(event.sessionId, event.timestamp.getTime());
      });

      const avgTimeOnPage = timeCalculations > 0 ? totalTimeOnPage / timeCalculations : 0;

      // Conversion rate (clicks to signups)
      const signups = await AnalyticsEvent.countDocuments({
        eventType: 'onboarding_step',
        'properties.step': 'signup_completed',
        timestamp: { $gte: startDate }
      });

      const totalClicks = getFreePicReviewClicks + getStartedClicks;
      const conversionRate = totalClicks > 0 ? (signups / totalClicks) * 100 : 0;

      return {
        sessions: sessions.length,
        uniqueVisitors: uniqueVisitors.length,
        bounceRate,
        avgTimeOnPage,
        getFreePicReviewClicks,
        getStartedClicks,
        conversionRate
      };
    } catch (error) {
      logError('Failed to get landing page metrics', error);
      return {
        sessions: 0,
        uniqueVisitors: 0,
        bounceRate: 0,
        avgTimeOnPage: 0,
        getFreePicReviewClicks: 0,
        getStartedClicks: 0,
        conversionRate: 0
      };
    }
  }

  /**
   * Get onboarding funnel metrics
   */
  async getOnboardingMetrics(startDate) {
    try {
      // Sign-up funnel steps
      const signupClicks = await AnalyticsEvent.countDocuments({
        action: 'signup_click',
        timestamp: { $gte: startDate }
      });

      const signupStarted = await AnalyticsEvent.countDocuments({
        eventType: 'onboarding_step',
        'properties.step': 'signup_started',
        timestamp: { $gte: startDate }
      });

      const signupCompleted = await AnalyticsEvent.countDocuments({
        eventType: 'onboarding_step',
        'properties.step': 'signup_completed',
        timestamp: { $gte: startDate }
      });

      const firstLogin = await AnalyticsEvent.countDocuments({
        eventType: 'session_start',
        'properties.isFirstLogin': true,
        timestamp: { $gte: startDate }
      });

      // Calculate conversion rates
      const clickToStarted = signupClicks > 0 ? (signupStarted / signupClicks) * 100 : 0;
      const startedToCompleted = signupStarted > 0 ? (signupCompleted / signupStarted) * 100 : 0;
      const completedToLogin = signupCompleted > 0 ? (firstLogin / signupCompleted) * 100 : 0;
      const overall = signupClicks > 0 ? (firstLogin / signupClicks) * 100 : 0;

      return {
        signupClicks,
        signupStarted,
        signupCompleted,
        firstLogin,
        conversionRates: {
          clickToStarted,
          startedToCompleted,
          completedToLogin,
          overall
        }
      };
    } catch (error) {
      logError('Failed to get onboarding metrics', error);
      return {
        signupClicks: 0,
        signupStarted: 0,
        signupCompleted: 0,
        firstLogin: 0,
        conversionRates: {
          clickToStarted: 0,
          startedToCompleted: 0,
          completedToLogin: 0,
          overall: 0
        }
      };
    }
  }

  /**
   * Get chat analytics
   */
  async getChatMetrics(startDate) {
    try {
      // Active users with chat activity
      const activeUsers = await AnalyticsEvent.distinct('userId', {
        eventType: 'chat_message',
        timestamp: { $gte: startDate }
      });

      // Total conversations
      const totalConversations = await Conversation.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Sessions with chat
      const sessionsWithChat = await AnalyticsEvent.distinct('sessionId', {
        eventType: 'chat_message',
        timestamp: { $gte: startDate }
      });

      // Messages per session
      const totalMessages = await AnalyticsEvent.countDocuments({
        eventType: 'chat_message',
        timestamp: { $gte: startDate }
      });

      const messagesPerSession = sessionsWithChat.length > 0 ? totalMessages / sessionsWithChat.length : 0;

      return {
        activeUsers: activeUsers.length,
        totalConversations,
        sessionsWithChat: sessionsWithChat.length,
        messagesPerSession
      };
    } catch (error) {
      logError('Failed to get chat metrics', error);
      return {
        activeUsers: 0,
        totalConversations: 0,
        sessionsWithChat: 0,
        messagesPerSession: 0
      };
    }
  }

  /**
   * Get profile pic review metrics
   */
  async getProfilePicMetrics(startDate) {
    try {
      // Active users with profile pic review activity
      const activeUsers = await AnalyticsEvent.distinct('userId', {
        eventType: 'profile_pic_review',
        timestamp: { $gte: startDate }
      });

      // Total reviews
      const totalReviews = await ProfilePicReview.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Average rating
      const ratingData = await ProfilePicReview.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            rating: { $exists: true, $ne: null, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);

      const averageRating = ratingData.length > 0 && ratingData[0].count > 0 
        ? ratingData[0].averageRating.toFixed(1) 
        : 'N/A';

      // Users with multiple reviews
      const usersWithMultipleReviews = await ProfilePicReview.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            reviewCount: { $sum: 1 }
          }
        },
        {
          $match: {
            reviewCount: { $gte: 2 }
          }
        }
      ]);

      return {
        activeUsers: activeUsers.length,
        totalReviews,
        averageRating,
        usersWithMultipleReviews: usersWithMultipleReviews.length
      };
    } catch (error) {
      logError('Failed to get profile pic metrics', error);
      return {
        activeUsers: 0,
        totalReviews: 0,
        averageRating: 0,
        usersWithMultipleReviews: 0
      };
    }
  }

  /**
   * Get fit check metrics
   */
  async getFitCheckMetrics(startDate) {
    try {
      // Active users with fit check activity
      const activeUsers = await AnalyticsEvent.distinct('userId', {
        eventType: 'fit_check',
        timestamp: { $gte: startDate }
      });

      // Total completions
      const totalCompletions = await FitCheck.countDocuments({
        createdAt: { $gte: startDate }
      });

      // Average rating
      const ratingData = await FitCheck.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            rating: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);

      const averageRating = ratingData.length > 0 ? ratingData[0].averageRating : 0;

      // Users with multiple fit checks
      const usersWithMultipleChecks = await FitCheck.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            checkCount: { $sum: 1 }
          }
        },
        {
          $match: {
            checkCount: { $gte: 2 }
          }
        }
      ]);

      return {
        activeUsers: activeUsers.length,
        totalCompletions,
        averageRating,
        usersWithMultipleChecks: usersWithMultipleChecks.length
      };
    } catch (error) {
      logError('Failed to get fit check metrics', error);
      return {
        activeUsers: 0,
        totalCompletions: 0,
        averageRating: 0,
        usersWithMultipleChecks: 0
      };
    }
  }

  /**
   * Get user quality metrics
   */
  async getUserQualityMetrics(startDate) {
    try {
      // Total registered users
      const totalRegistered = await User.countDocuments();

      // Verified emails (users with email verification)
      const verifiedEmails = await User.countDocuments({
        emailVerified: true
      });

      // Engaged users (users with 2+ meaningful actions)
      const engagedUsers = await AnalyticsEvent.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            eventType: { $in: ['chat_message', 'profile_pic_review', 'fit_check'] }
          }
        },
        {
          $group: {
            _id: '$userId',
            actionCount: { $sum: 1 }
          }
        },
        {
          $match: {
            actionCount: { $gte: 2 }
          }
        }
      ]);

      // Return user analysis
      const returnUsers = await this.getReturnUserAnalysis(startDate);

      return {
        totalRegistered,
        verifiedEmails,
        engagedUsers: engagedUsers.length,
        returnUsers
      };
    } catch (error) {
      logError('Failed to get user quality metrics', error);
      return {
        totalRegistered: 0,
        verifiedEmails: 0,
        engagedUsers: 0,
        returnUsers: {
          day1: 0,
          day7: 0,
          day30: 0
        }
      };
    }
  }

  /**
   * Get return user analysis
   */
  async getReturnUserAnalysis(startDate) {
    try {
      const now = new Date();
      const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filter out anonymous users for retention analysis
      const filterNonAnonymous = { 
        userId: { $ne: 'anonymous', $exists: true, $ne: null }
      };

      // Users who returned after 1 day
      const day1Users = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: day1, $lt: now },
        ...filterNonAnonymous
      });

      // Users who returned after 7 days
      const day7Users = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: day7, $lt: now },
        ...filterNonAnonymous
      });

      // Users who returned after 30 days
      const day30Users = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: day30, $lt: now },
        ...filterNonAnonymous
      });

      // Get total registered users for retention rate calculation
      const totalRegisteredUsers = await User.countDocuments();

      return {
        day1: day1Users.length,
        day7: day7Users.length,
        day30: day30Users.length,
        retentionRates: {
          day1: totalRegisteredUsers > 0 ? ((day1Users.length / totalRegisteredUsers) * 100).toFixed(1) : '0.0',
          day7: totalRegisteredUsers > 0 ? ((day7Users.length / totalRegisteredUsers) * 100).toFixed(1) : '0.0',
          day30: totalRegisteredUsers > 0 ? ((day30Users.length / totalRegisteredUsers) * 100).toFixed(1) : '0.0'
        },
        totalRegisteredUsers
      };
    } catch (error) {
      logError('Failed to get return user analysis', error);
      return {
        day1: 0,
        day7: 0,
        day30: 0,
        retentionRates: {
          day1: '0.0',
          day7: '0.0',
          day30: '0.0'
        },
        totalRegisteredUsers: 0
      };
    }
  }

  /**
   * Export dashboard data to CSV
   */
  async exportDashboard(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);

      // Get all metrics
      const metrics = await this.getDashboardMetrics(req, res);
      
      // Convert to CSV format
      const csvData = this.convertMetricsToCSV(metrics);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jules-dating-dashboard-${timeRange}.csv"`);
      res.send(csvData);
    } catch (error) {
      logError('Failed to export dashboard', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * Export users to CSV
   */
  async exportUsers(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);

      const users = await User.find({
        createdAt: { $gte: startDate }
      }).select('email name createdAt lastActive isAdmin');

      // Convert to CSV
      const csvData = this.convertUsersToCSV(users);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jules-dating-users-${timeRange}.csv"`);
      res.send(csvData);
    } catch (error) {
      logError('Failed to export users', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * Export chat data to CSV
   */
  async exportChat(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);

      const conversations = await Conversation.find({
        createdAt: { $gte: startDate }
      }).populate('userId', 'email name');

      // Convert to CSV
      const csvData = this.convertConversationsToCSV(conversations);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jules-dating-chat-${timeRange}.csv"`);
      res.send(csvData);
    } catch (error) {
      logError('Failed to export chat data', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * Export profile pic review data to CSV
   */
  async exportProfilePic(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);

      const reviews = await ProfilePicReview.find({
        createdAt: { $gte: startDate }
      }).populate('userId', 'email name');

      // Convert to CSV
      const csvData = this.convertProfilePicReviewsToCSV(reviews);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jules-dating-profile-pic-${timeRange}.csv"`);
      res.send(csvData);
    } catch (error) {
      logError('Failed to export profile pic data', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * Export fit check data to CSV
   */
  async exportFitCheck(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = this.getStartDate(timeRange);

      const fitChecks = await FitCheck.find({
        createdAt: { $gte: startDate }
      }).populate('userId', 'email name');

      // Convert to CSV
      const csvData = this.convertFitChecksToCSV(fitChecks);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="jules-dating-fit-check-${timeRange}.csv"`);
      res.send(csvData);
    } catch (error) {
      logError('Failed to export fit check data', error);
      res.status(500).json({ error: 'Export failed' });
    }
  }

  /**
   * Helper method to get start date based on time range
   */
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

  /**
   * Convert metrics to CSV format
   */
  convertMetricsToCSV(metrics) {
    const rows = [
      ['Metric', 'Value'],
      ['Total Users', metrics.totalUsers],
      ['Daily Active Users', metrics.dailyActiveUsers],
      ['Weekly Active Users', metrics.weeklyActiveUsers],
      ['Monthly Active Users', metrics.monthlyActiveUsers],
      ['Average Session Duration (ms)', metrics.averageSessionDuration],
      ['Landing Page Sessions', metrics.landingPage.sessions],
      ['Landing Page Unique Visitors', metrics.landingPage.uniqueVisitors],
      ['Landing Page Bounce Rate', metrics.landingPage.bounceRate],
      ['Landing Page Avg Time on Page', metrics.landingPage.avgTimeOnPage],
      ['Get Free Pic Review Clicks', metrics.landingPage.getFreePicReviewClicks],
      ['Get Started Clicks', metrics.landingPage.getStartedClicks],
      ['Landing Page Conversion Rate', metrics.landingPage.conversionRate],
      ['Signup Clicks', metrics.onboarding.signupClicks],
      ['Signup Started', metrics.onboarding.signupStarted],
      ['Signup Completed', metrics.onboarding.signupCompleted],
      ['First Login', metrics.onboarding.firstLogin],
      ['Chat Active Users', metrics.chatAnalytics.activeUsers],
      ['Total Conversations', metrics.chatAnalytics.totalConversations],
      ['Sessions with Chat', metrics.chatAnalytics.sessionsWithChat],
      ['Messages per Session', metrics.chatAnalytics.messagesPerSession],
      ['Profile Pic Review Active Users', metrics.profilePicReview.activeUsers],
      ['Total Profile Pic Reviews', metrics.profilePicReview.totalReviews],
      ['Profile Pic Review Average Rating', metrics.profilePicReview.averageRating],
      ['Users with Multiple Profile Pic Reviews', metrics.profilePicReview.usersWithMultipleReviews],
      ['Fit Check Active Users', metrics.fitCheck.activeUsers],
      ['Total Fit Check Completions', metrics.fitCheck.totalCompletions],
      ['Fit Check Average Rating', metrics.fitCheck.averageRating],
      ['Users with Multiple Fit Checks', metrics.fitCheck.usersWithMultipleChecks],
      ['Total Registered Users', metrics.userQuality.totalRegistered],
      ['Verified Emails', metrics.userQuality.verifiedEmails],
      ['Engaged Users', metrics.userQuality.engagedUsers],
      ['Return Users (1 day)', metrics.userQuality.returnUsers.day1],
      ['Return Users (7 days)', metrics.userQuality.returnUsers.day7],
      ['Return Users (30 days)', metrics.userQuality.returnUsers.day30]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert users to CSV format
   */
  convertUsersToCSV(users) {
    const rows = [
      ['Email', 'Name', 'Created At', 'Last Active', 'Is Admin']
    ];

    users.forEach(user => {
      rows.push([
        user.email,
        user.name || '',
        user.createdAt.toISOString(),
        user.lastActive ? user.lastActive.toISOString() : '',
        user.isAdmin ? 'Yes' : 'No'
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert conversations to CSV format
   */
  convertConversationsToCSV(conversations) {
    const rows = [
      ['User Email', 'User Name', 'Message Count', 'Created At', 'Last Updated']
    ];

    conversations.forEach(conversation => {
      rows.push([
        conversation.userId?.email || '',
        conversation.userId?.name || '',
        conversation.messages?.length || 0,
        conversation.createdAt.toISOString(),
        conversation.updatedAt.toISOString()
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert profile pic reviews to CSV format
   */
  convertProfilePicReviewsToCSV(reviews) {
    const rows = [
      ['User Email', 'User Name', 'Rating', 'Feedback', 'Created At']
    ];

    reviews.forEach(review => {
      rows.push([
        review.userId?.email || '',
        review.userId?.name || '',
        review.rating || '',
        review.feedback || '',
        review.createdAt.toISOString()
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert fit checks to CSV format
   */
  convertFitChecksToCSV(fitChecks) {
    const rows = [
      ['User Email', 'User Name', 'Rating', 'Feedback', 'Created At']
    ];

    fitChecks.forEach(fitCheck => {
      rows.push([
        fitCheck.userId?.email || '',
        fitCheck.userId?.name || '',
        fitCheck.rating || '',
        fitCheck.feedback || '',
        fitCheck.createdAt.toISOString()
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }
}

module.exports = new AnalyticsControllerV2();
