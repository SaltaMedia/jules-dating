const mongoose = require('mongoose');
const UserSession = require('../models/UserSession');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const FitCheck = require('../models/FitCheck');
const ProfilePicReview = require('../models/ProfilePicReview');

class AnalyticsQueries {
  // Get landing page statistics
  async getLandingPageStats(timeRange = '7d') {
    const { startDate, endDate } = this.getDateRange(timeRange);
    
    const sessions = await UserSession.find({
      startTime: { $gte: startDate, $lte: endDate },
      referrer: { 
        $exists: true, 
        $ne: null,
        $not: { $regex: /monitoring|health|uptimerobot/i }
      }
    });

    const totalSessions = sessions.length;
    const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
    const engagedSessions = sessions.filter(s => s.pageViews > 0).length;
    const bounceRate = totalSessions > 0 ? ((totalSessions - engagedSessions) / totalSessions * 100).toFixed(2) : 0;

    // Get referrer breakdown
    const referrerStats = {};
    sessions.forEach(session => {
      const referrer = session.referrer || 'direct';
      referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
    });

    return {
      totalSessions,
      uniqueUsers,
      engagedSessions,
      bounceRate: `${bounceRate}%`,
      referrerBreakdown: referrerStats,
      timeRange: { startDate, endDate }
    };
  }

  // Get user activity by feature
  async getUserActivityByFeature(timeRange = '7d') {
    const { startDate, endDate } = this.getDateRange(timeRange);
    
    const activity = {
      chat: await this.getChatActivity(startDate, endDate),
      fitCheck: await this.getFitCheckActivity(startDate, endDate),
      profilePicReview: await this.getProfilePicReviewActivity(startDate, endDate),
      sessions: await this.getSessionActivity(startDate, endDate)
    };

    return activity;
  }

  // Get chat activity
  async getChatActivity(startDate, endDate) {
    const conversations = await Conversation.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const uniqueUsers = new Set(conversations.map(c => c.userId)).size;
    const avgMessagesPerConversation = totalConversations > 0 ? (totalMessages / totalConversations).toFixed(2) : 0;

    return {
      totalConversations,
      totalMessages,
      uniqueUsers,
      avgMessagesPerConversation
    };
  }

  // Get fit check activity
  async getFitCheckActivity(startDate, endDate) {
    const fitChecks = await FitCheck.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalFitChecks = fitChecks.length;
    const uniqueUsers = new Set(fitChecks.map(f => f.userId || f.anonymousId)).size;
    const avgRating = fitChecks.length > 0 ? 
      (fitChecks.reduce((sum, f) => sum + f.rating, 0) / fitChecks.length).toFixed(2) : 0;

    // Get rating distribution
    const ratingDistribution = {};
    fitChecks.forEach(fc => {
      const rating = Math.floor(fc.rating);
      ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
    });

    return {
      totalFitChecks,
      uniqueUsers,
      avgRating,
      ratingDistribution
    };
  }

  // Get profile pic review activity
  async getProfilePicReviewActivity(startDate, endDate) {
    const reviews = await ProfilePicReview.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    const totalReviews = reviews.length;
    const uniqueUsers = new Set(reviews.map(r => r.userId || r.anonymousId)).size;
    const avgRating = reviews.length > 0 ? 
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(2) : 0;

    return {
      totalReviews,
      uniqueUsers,
      avgRating
    };
  }

  // Get session activity
  async getSessionActivity(startDate, endDate) {
    const sessions = await UserSession.find({
      startTime: { $gte: startDate, $lte: endDate }
    });

    const totalSessions = sessions.length;
    const uniqueUsers = new Set(sessions.map(s => s.userId)).size;
    const avgSessionDuration = sessions.length > 0 ? 
      (sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length / 1000 / 60).toFixed(2) : 0; // in minutes
    const avgPageViews = sessions.length > 0 ? 
      (sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length).toFixed(2) : 0;

    return {
      totalSessions,
      uniqueUsers,
      avgSessionDuration: `${avgSessionDuration} minutes`,
      avgPageViews
    };
  }

  // Get user journey data
  async getUserJourney(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const sessions = await UserSession.find({ userId }).sort({ startTime: 1 });
    const conversations = await Conversation.find({ userId }).sort({ createdAt: 1 });
    const fitChecks = await FitCheck.find({ userId }).sort({ createdAt: 1 });
    const profilePicReviews = await ProfilePicReview.find({ userId }).sort({ createdAt: 1 });

    return {
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      sessions: sessions.length,
      conversations: conversations.length,
      fitChecks: fitChecks.length,
      profilePicReviews: profilePicReviews.length,
      firstActivity: sessions[0]?.startTime,
      lastActivity: sessions[sessions.length - 1]?.lastActivity,
      totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews, 0),
      totalChatMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0)
    };
  }

  // Get conversion funnel data
  async getConversionFunnel(timeRange = '7d') {
    const { startDate, endDate } = this.getDateRange(timeRange);
    
    // Landing page visits
    const landingPageSessions = await UserSession.countDocuments({
      startTime: { $gte: startDate, $lte: endDate },
      referrer: { 
        $exists: true, 
        $ne: null,
        $not: { $regex: /monitoring|health|uptimerobot/i }
      }
    });

    // Users who engaged (pageViews > 0)
    const engagedUsers = await UserSession.countDocuments({
      startTime: { $gte: startDate, $lte: endDate },
      pageViews: { $gt: 0 },
      referrer: { 
        $exists: true, 
        $ne: null,
        $not: { $regex: /monitoring|health|uptimerobot/i }
      }
    });

    // Users who signed up
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Users who used chat
    const chatUsers = await Conversation.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Users who used fit check
    const fitCheckUsers = await FitCheck.distinct('userId', {
      createdAt: { $gte: startDate, $lte: endDate }
    });

    return {
      landingPageVisits: landingPageSessions,
      engagedUsers,
      newSignups: newUsers,
      chatUsers: chatUsers.length,
      fitCheckUsers: fitCheckUsers.length,
      conversionRates: {
        engagement: landingPageSessions > 0 ? ((engagedUsers / landingPageSessions) * 100).toFixed(2) : 0,
        signup: landingPageSessions > 0 ? ((newUsers / landingPageSessions) * 100).toFixed(2) : 0,
        chat: landingPageSessions > 0 ? ((chatUsers.length / landingPageSessions) * 100).toFixed(2) : 0,
        fitCheck: landingPageSessions > 0 ? ((fitCheckUsers.length / landingPageSessions) * 100).toFixed(2) : 0
      }
    };
  }

  // Get daily activity trends
  async getDailyActivityTrends(timeRange = '30d') {
    const { startDate, endDate } = this.getDateRange(timeRange);
    
    const dailyStats = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const sessions = await UserSession.countDocuments({
        startTime: { $gte: dayStart, $lt: dayEnd },
        referrer: { 
          $exists: true, 
          $ne: null,
          $not: { $regex: /monitoring|health|uptimerobot/i }
        }
      });
      
      const conversations = await Conversation.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      const fitChecks = await FitCheck.countDocuments({
        createdAt: { $gte: dayStart, $lt: dayEnd }
      });
      
      dailyStats.push({
        date: currentDate.toISOString().split('T')[0],
        sessions,
        conversations,
        fitChecks
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyStats;
  }

  // Helper method to get date range
  getDateRange(timeRange) {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  }
}

module.exports = new AnalyticsQueries();
