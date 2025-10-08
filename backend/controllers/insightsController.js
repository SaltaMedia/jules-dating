const insightsService = require('../services/insightsService');
const { logInfo, logError } = require('../utils/logger');

class InsightsController {
  /**
   * Generate and send weekly insights to admin
   */
  async generateWeeklyInsights(req, res) {
    try {
      logInfo('Generating weekly insights', { userId: req.user?.id });
      
      // Generate insights for all active users
      const userInsights = await insightsService.generateWeeklyInsights();
      
      // Generate community insights
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      const communityInsights = await insightsService.generateCommunityInsights(oneWeekAgo, now);
      
      // Format the insights for email
      const emailContent = this.formatWeeklyReportEmail(userInsights, communityInsights);
      
      // For now, return the content - you can send this via email
      res.json({
        success: true,
        data: {
          emailContent,
          userInsights: userInsights.length,
          communityInsights,
          sampleUserInsights: userInsights.slice(0, 3) // Show first 3 as examples
        }
      });
      
    } catch (error) {
      logError('Failed to generate weekly insights', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to generate weekly insights'
      });
    }
  }

  /**
   * Get insights for a specific user
   */
  async getUserInsights(req, res) {
    try {
      const { userId } = req.params;
      const { timeRange = '7d' } = req.query;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }
      
      const startDate = insightsService.getStartDate(timeRange);
      const now = new Date();
      
      // Get user data
      const User = require('../models/User');
      const user = await User.findById(userId).select('_id email name');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      const userInsight = await insightsService.generateUserInsight(user, startDate, now);
      
      if (!userInsight) {
        return res.status(404).json({
          success: false,
          error: 'No insights available for this user'
        });
      }
      
      res.json({
        success: true,
        data: userInsight
      });
      
    } catch (error) {
      logError('Failed to get user insights', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to get user insights'
      });
    }
  }

  /**
   * Get community insights
   */
  async getCommunityInsights(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const startDate = insightsService.getStartDate(timeRange);
      const now = new Date();
      
      const communityInsights = await insightsService.generateCommunityInsights(startDate, now);
      
      res.json({
        success: true,
        data: communityInsights
      });
      
    } catch (error) {
      logError('Failed to get community insights', error, { userId: req.user?.id });
      res.status(500).json({
        success: false,
        error: 'Failed to get community insights'
      });
    }
  }

  /**
   * Format weekly report email content
   */
  formatWeeklyReportEmail(userInsights, communityInsights) {
    const { weekOf, totalUsers, activeUsers, engagementRate, totalProfilePicReviews, totalFitChecks, totalChatMessages, averageProfilePicRating, averageFitCheckRating } = communityInsights;
    
    let emailContent = `
📊 JULES DATING WEEKLY INSIGHTS REPORT
Week of: ${weekOf}

🌟 COMMUNITY OVERVIEW:
• Total registered users: ${totalUsers}
• Active users this week: ${activeUsers}
• Engagement rate: ${engagementRate}%
• Profile pic reviews: ${totalProfilePicReviews}
• Fit checks completed: ${totalFitChecks}
• Chat messages sent: ${totalChatMessages}
• Average profile pic rating: ${averageProfilePicRating}/10
• Average fit check rating: ${averageFitCheckRating}/10

💡 KEY INSIGHTS:
`;
    
    // Add insights based on data
    if (activeUsers > 0) {
      emailContent += `• ${activeUsers} users actively engaged with Jules this week\n`;
    }
    
    if (totalProfilePicReviews > 0) {
      emailContent += `• Users uploaded ${totalProfilePicReviews} profile pics for review\n`;
    }
    
    if (totalFitChecks > 0) {
      emailContent += `• ${totalFitChecks} fit checks were completed\n`;
    }
    
    if (totalChatMessages > 0) {
      emailContent += `• ${totalChatMessages} chat messages were exchanged\n`;
    }
    
    // Add user-specific insights (top 3 examples)
    if (userInsights.length > 0) {
      emailContent += `\n👥 USER SPOTLIGHT (${userInsights.length} active users):\n`;
      
      userInsights.slice(0, 3).forEach((insight, index) => {
        emailContent += `\n${index + 1}. ${insight.userName} (${insight.userEmail}):\n`;
        emailContent += `   • Profile pic reviews: ${insight.stats.profilePicReviews}\n`;
        emailContent += `   • Fit checks: ${insight.stats.fitChecks}\n`;
        emailContent += `   • Chat messages: ${insight.stats.chatMessages}\n`;
        
        // Add their top insight
        const topInsight = insight.insights[0];
        if (topInsight) {
          emailContent += `   • Key insight: ${topInsight.message}\n`;
        }
      });
      
      if (userInsights.length > 3) {
        emailContent += `\n... and ${userInsights.length - 3} more active users!\n`;
      }
    }
    
    emailContent += `
📈 RECOMMENDATIONS:
`;
    
    // Add recommendations based on data
    if (parseFloat(engagementRate) < 20) {
      emailContent += `• Consider sending engagement reminders to inactive users\n`;
    }
    
    if (totalProfilePicReviews < 5) {
      emailContent += `• Promote profile pic review feature to increase usage\n`;
    }
    
    if (totalChatMessages < 10) {
      emailContent += `• Encourage more chat interactions with Jules\n`;
    }
    
    if (parseFloat(averageProfilePicRating) < 7) {
      emailContent += `• Consider adding photo tips to help users improve their pics\n`;
    }
    
    emailContent += `
🎯 WEEKLY TIP TO SHARE WITH USERS:
"Your profile pic is your first impression - make it count! Try taking photos in natural light and don't forget to smile genuinely. Jules can help you pick the perfect pic! 📸✨"

---
Generated by Jules Dating Analytics
steve@juleslabs.com
    `;
    
    return emailContent.trim();
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
}

module.exports = new InsightsController();
