#!/usr/bin/env node

/**
 * Weekly Insights Generator for Jules Dating
 * 
 * This script generates weekly insights and sends them to steve@juleslabs.com
 * Run this script weekly to get valuable data insights about user engagement
 * 
 * Usage: node generate-weekly-insights.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const insightsService = require('./services/insightsService');
const insightsController = require('./controllers/insightsController');
const { logInfo, logError } = require('./utils/logger');

async function generateWeeklyInsights() {
  try {
    console.log('🚀 Generating Weekly Jules Dating Insights...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Generate insights for the past week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    console.log(`📅 Analyzing data from ${oneWeekAgo.toDateString()} to ${now.toDateString()}\n`);
    
    // Generate community insights
    console.log('📊 Generating Community Insights...');
    const communityInsights = await insightsService.generateCommunityInsights(oneWeekAgo, now);
    console.log(`✅ Found ${communityInsights.totalUsers} total users, ${communityInsights.activeUsers} active this week\n`);
    
    // Generate user insights
    console.log('👥 Generating User Insights...');
    const userInsights = await insightsService.generateWeeklyInsights();
    console.log(`✅ Generated insights for ${userInsights.length} active users\n`);
    
    // Format the weekly report
    console.log('📝 Formatting Weekly Report...');
    const weeklyReport = insightsController.formatWeeklyReportEmail(userInsights, communityInsights);
    
    // Save report to file
    const fs = require('fs');
    const reportPath = `./weekly-insights-${now.toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(reportPath, weeklyReport);
    console.log(`📄 Report saved to: ${reportPath}\n`);
    
    // Display the report
    console.log('='.repeat(80));
    console.log(weeklyReport);
    console.log('='.repeat(80));
    
    // TODO: Send email to steve@juleslabs.com
    console.log('\n📧 Email functionality would be implemented here to send to steve@juleslabs.com');
    console.log('📋 For now, the report is saved to the file above and displayed in console');
    
    // Generate some actionable insights
    console.log('\n🎯 ACTIONABLE INSIGHTS:');
    
    if (communityInsights.activeUsers === 0) {
      console.log('• 🚨 URGENT: No active users this week - consider re-engagement campaign');
      console.log('• 📱 Send push notifications to inactive users');
      console.log('• 🎁 Consider offering incentives for returning users');
    } else if (communityInsights.activeUsers < communityInsights.totalUsers * 0.1) {
      console.log('• ⚠️  Low engagement - only 10% of users active');
      console.log('• 📧 Send weekly tips email to all users');
      console.log('• 🔄 Promote new features to increase engagement');
    } else {
      console.log('• ✅ Good engagement levels this week');
      console.log('• 📈 Continue current strategies');
    }
    
    if (communityInsights.totalProfilePicReviews === 0) {
      console.log('• 📸 No profile pic reviews - promote this feature heavily');
    }
    
    if (communityInsights.totalChatMessages === 0) {
      console.log('• 💬 No chat activity - consider chat prompts or icebreakers');
    }
    
    console.log('\n✅ Weekly insights generation completed successfully!');
    
  } catch (error) {
    logError('Failed to generate weekly insights', error);
    console.error('❌ Error generating insights:', error.message);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  generateWeeklyInsights()
    .then(() => {
      console.log('\n🎉 Weekly insights generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { generateWeeklyInsights };
