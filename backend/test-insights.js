require('dotenv').config();
const mongoose = require('mongoose');
const insightsService = require('./services/insightsService');

async function testInsights() {
  try {
    console.log('🧪 Testing Weekly Insights Generation...\n');
    
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Test community insights
    console.log('📊 Generating Community Insights...');
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const communityInsights = await insightsService.generateCommunityInsights(oneWeekAgo, now);
    console.log('Community Insights:', JSON.stringify(communityInsights, null, 2));
    
    // Test user insights
    console.log('\n👥 Generating User Insights...');
    const userInsights = await insightsService.generateWeeklyInsights();
    console.log(`Generated insights for ${userInsights.length} users`);
    
    if (userInsights.length > 0) {
      console.log('\n📝 Sample User Insight:');
      console.log(JSON.stringify(userInsights[0], null, 2));
      
      console.log('\n📧 Formatted Email Content:');
      const emailContent = insightsService.formatInsightForEmail(userInsights[0]);
      console.log(emailContent);
    }
    
    // Test weekly report format
    console.log('\n📈 Weekly Report Email Format:');
    const insightsController = require('./controllers/insightsController');
    const weeklyReport = insightsController.formatWeeklyReportEmail(userInsights, communityInsights);
    console.log(weeklyReport);
    
    console.log('\n✅ Insights generation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
  
  process.exit(0);
}

testInsights();
