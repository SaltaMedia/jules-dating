const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const UserSession = require('../models/UserSession');
const ProfilePicReview = require('../models/ProfilePicReview');
const FitCheck = require('../models/FitCheck');
const Conversation = require('../models/Conversation');
const { logInfo, logError } = require('../utils/logger');

class InsightsService {
  constructor() {
    this.insightTemplates = {
      profilePic: {
        low: "Your profile pic could use a little more lighting! 📸 Try taking photos near a window or in bright, natural light to make your eyes pop.",
        medium: "Your profile pic looks good! 💫 Consider adding a genuine smile - it's one of the most attractive features in dating profiles.",
        high: "Wow! Your profile pic is absolutely stunning! 🔥 You're definitely ready to make a great first impression."
      },
      fitCheck: {
        low: "Great start with your outfit! 💪 Try adding some accessories or experimenting with colors to take it to the next level.",
        medium: "Nice style! ✨ Consider mixing textures or adding a statement piece to really make your look stand out.",
        high: "You've got incredible style! 🌟 This outfit perfectly showcases your personality and confidence."
      },
      engagement: {
        low: "We noticed you haven't been very active this week. 💭 Dating is about putting yourself out there - try uploading a new pic or starting a conversation!",
        medium: "You're doing great staying engaged! 🎯 Keep the momentum going by trying our daily tips or chatting with Jules.",
        high: "You're absolutely crushing it! 🚀 Your engagement shows you're serious about finding the right connection."
      }
    };
  }

  /**
   * Generate weekly insights for all users
   */
  async generateWeeklyInsights() {
    try {
      logInfo('Starting weekly insights generation');
      
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      
      // Get all users who have been active in the past week
      const activeUsers = await this.getActiveUsers(oneWeekAgo, now);
      
      const insights = [];
      
      for (const user of activeUsers) {
        try {
          const userInsight = await this.generateUserInsight(user, oneWeekAgo, now);
          if (userInsight) {
            insights.push(userInsight);
          }
        } catch (error) {
          logError('Error generating insight for user', error, { userId: user._id });
        }
      }
      
      logInfo(`Generated insights for ${insights.length} users`);
      return insights;
      
    } catch (error) {
      logError('Failed to generate weekly insights', error);
      throw error;
    }
  }

  /**
   * Get users who have been active in the time range
   */
  async getActiveUsers(startDate, endDate) {
    try {
      const User = require('../models/User');
      
      // Get users who have analytics events in the time range
      const activeUserIds = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: startDate, $lte: endDate },
        userId: { $ne: 'anonymous', $exists: true, $ne: null }
      });
      
      // Get user details
      const users = await User.find({
        _id: { $in: activeUserIds }
      }).select('_id email name createdAt lastLoginAt');
      
      return users;
    } catch (error) {
      logError('Failed to get active users', error);
      return [];
    }
  }

  /**
   * Generate personalized insight for a specific user
   */
  async generateUserInsight(user, startDate, endDate) {
    try {
      const userId = user._id.toString();
      
      // Get user's activity data
      const activityData = await this.getUserActivityData(userId, startDate, endDate);
      
      if (!activityData.hasActivity) {
        return null; // Skip users with no activity
      }
      
      // Generate insights based on activity
      const insights = [];
      
      // Profile pic review insight
      if (activityData.profilePicReviews.length > 0) {
        const avgRating = activityData.profilePicReviews.reduce((sum, review) => sum + review.rating, 0) / activityData.profilePicReviews.length;
        const insight = this.generateProfilePicInsight(avgRating, activityData.profilePicReviews.length);
        insights.push(insight);
      }
      
      // Fit check insight
      if (activityData.fitChecks.length > 0) {
        const avgRating = activityData.fitChecks.reduce((sum, check) => sum + check.rating, 0) / activityData.fitChecks.length;
        const insight = this.generateFitCheckInsight(avgRating, activityData.fitChecks.length);
        insights.push(insight);
      }
      
      // Engagement insight
      const engagementInsight = this.generateEngagementInsight(activityData);
      insights.push(engagementInsight);
      
      // Weekly tip
      const weeklyTip = this.generateWeeklyTip(activityData);
      
      return {
        userId: userId,
        userEmail: user.email,
        userName: user.name || 'there',
        weekOf: startDate.toISOString().split('T')[0],
        insights: insights,
        weeklyTip: weeklyTip,
        stats: {
          profilePicReviews: activityData.profilePicReviews.length,
          fitChecks: activityData.fitChecks.length,
          chatMessages: activityData.chatMessages,
          sessions: activityData.sessions
        }
      };
      
    } catch (error) {
      logError('Failed to generate user insight', error, { userId: user._id });
      return null;
    }
  }

  /**
   * Get user's activity data for the week
   */
  async getUserActivityData(userId, startDate, endDate) {
    try {
      // Get profile pic reviews
      const profilePicReviews = await ProfilePicReview.find({
        userId: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();
      
      // Get fit checks
      const fitChecks = await FitCheck.find({
        userId: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();
      
      // Get chat messages
      const chatMessages = await AnalyticsEvent.countDocuments({
        userId: userId,
        eventType: 'chat_message',
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      // Get sessions
      const sessions = await UserSession.countDocuments({
        userId: userId,
        startTime: { $gte: startDate, $lte: endDate }
      });
      
      return {
        profilePicReviews,
        fitChecks,
        chatMessages,
        sessions,
        hasActivity: profilePicReviews.length > 0 || fitChecks.length > 0 || chatMessages > 0 || sessions > 0
      };
    } catch (error) {
      logError('Failed to get user activity data', error, { userId });
      return {
        profilePicReviews: [],
        fitChecks: [],
        chatMessages: 0,
        sessions: 0,
        hasActivity: false
      };
    }
  }

  /**
   * Generate profile pic review insight
   */
  generateProfilePicInsight(avgRating, reviewCount) {
    let level = 'medium';
    if (avgRating < 6) level = 'low';
    else if (avgRating >= 8) level = 'high';
    
    return {
      type: 'profile_pic',
      level: level,
      message: this.insightTemplates.profilePic[level],
      rating: avgRating.toFixed(1),
      count: reviewCount
    };
  }

  /**
   * Generate fit check insight
   */
  generateFitCheckInsight(avgRating, checkCount) {
    let level = 'medium';
    if (avgRating < 6) level = 'low';
    else if (avgRating >= 8) level = 'high';
    
    return {
      type: 'fit_check',
      level: level,
      message: this.insightTemplates.fitCheck[level],
      rating: avgRating.toFixed(1),
      count: checkCount
    };
  }

  /**
   * Generate engagement insight
   */
  generateEngagementInsight(activityData) {
    const totalActivities = activityData.profilePicReviews.length + 
                           activityData.fitChecks.length + 
                           activityData.chatMessages + 
                           activityData.sessions;
    
    let level = 'medium';
    if (totalActivities < 3) level = 'low';
    else if (totalActivities >= 8) level = 'high';
    
    return {
      type: 'engagement',
      level: level,
      message: this.insightTemplates.engagement[level],
      activityCount: totalActivities
    };
  }

  /**
   * Generate weekly tip
   */
  generateWeeklyTip(activityData) {
    const tips = [
      "💡 Pro tip: Your first photo gets 3x more views than any other photo in your profile!",
      "🌟 Did you know? Profiles with 3+ photos get 40% more matches than those with just one.",
      "📸 Lighting tip: Golden hour (1 hour after sunrise or before sunset) creates the most flattering photos.",
      "😊 Smile fact: Genuine smiles in photos increase your chances of getting matches by 25%.",
      "🎯 Conversation starter: Ask about their interests or compliment something specific in their photos.",
      "⏰ Best time to swipe: Sunday evenings between 6-9 PM see the highest engagement rates.",
      "👕 Style tip: Wear solid colors in your photos - they photograph better than busy patterns.",
      "🗣️ Message tip: Reference something from their profile to show you actually read it!",
      "📱 Photo quality: Use natural light and avoid heavy filters for the most authentic look.",
      "💪 Confidence boost: Remember, you're not just looking for anyone - you're looking for the right someone!"
    ];
    
    // Return a tip based on user's activity patterns
    const tipIndex = activityData.profilePicReviews.length + activityData.fitChecks.length;
    return tips[tipIndex % tips.length];
  }

  /**
   * Generate community insights (aggregate data)
   */
  async generateCommunityInsights(startDate, endDate) {
    try {
      // Get community-wide stats
      const User = require('../models/User');
      const totalUsers = await User.countDocuments();
      const activeUsers = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: startDate, $lte: endDate },
        userId: { $ne: 'anonymous', $exists: true, $ne: null }
      });
      
      const totalProfilePicReviews = await ProfilePicReview.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const totalFitChecks = await FitCheck.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate }
      });
      
      const totalChatMessages = await AnalyticsEvent.countDocuments({
        eventType: 'chat_message',
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      // Calculate average ratings
      const profilePicRatingData = await ProfilePicReview.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            rating: { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' }
          }
        }
      ]);
      
      const fitCheckRatingData = await FitCheck.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            rating: { $exists: true, $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' }
          }
        }
      ]);
      
      return {
        weekOf: startDate.toISOString().split('T')[0],
        totalUsers,
        activeUsers: activeUsers.length,
        engagementRate: totalUsers > 0 ? ((activeUsers.length / totalUsers) * 100).toFixed(1) : '0.0',
        totalProfilePicReviews,
        totalFitChecks,
        totalChatMessages,
        averageProfilePicRating: profilePicRatingData.length > 0 ? profilePicRatingData[0].averageRating.toFixed(1) : 'N/A',
        averageFitCheckRating: fitCheckRatingData.length > 0 ? fitCheckRatingData[0].averageRating.toFixed(1) : 'N/A'
      };
    } catch (error) {
      logError('Failed to generate community insights', error);
      throw error;
    }
  }

  /**
   * Format insight for email
   */
  formatInsightForEmail(userInsight) {
    const { userName, weekOf, insights, weeklyTip, stats } = userInsight;
    
    let emailContent = `
Hi ${userName}! 👋

Here's your weekly Jules Dating insight for the week of ${weekOf}:

📊 YOUR WEEK IN NUMBERS:
• Profile pic reviews: ${stats.profilePicReviews}
• Fit checks completed: ${stats.fitChecks}
• Chat messages: ${stats.chatMessages}
• Active sessions: ${stats.sessions}

💡 YOUR PERSONALIZED INSIGHTS:
`;
    
    insights.forEach(insight => {
      emailContent += `\n${insight.message}`;
    });
    
    emailContent += `

🌟 WEEKLY TIP:
${weeklyTip}

Keep up the great work, and remember - every step you take brings you closer to finding that special connection! 💕

Love,
The Jules Team
    `;
    
    return emailContent.trim();
  }
}

module.exports = new InsightsService();
