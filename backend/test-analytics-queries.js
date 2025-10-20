require('dotenv').config();
const mongoose = require('mongoose');
const analyticsQueries = require('./utils/analyticsQueries');

async function testAnalyticsQueries() {
  // Connect to MongoDB first
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
  console.log('🧪 Testing Analytics Queries...\n');
  
  try {
    // Test 1: Landing page stats
    console.log('1. Testing landing page stats...');
    const landingStats = await analyticsQueries.getLandingPageStats('7d');
    console.log('✅ Landing page stats:', {
      totalSessions: landingStats.totalSessions,
      uniqueUsers: landingStats.uniqueUsers,
      engagedSessions: landingStats.engagedSessions,
      bounceRate: landingStats.bounceRate
    });
    
    // Test 2: User activity by feature
    console.log('\n2. Testing user activity by feature...');
    const userActivity = await analyticsQueries.getUserActivityByFeature('7d');
    console.log('✅ User activity:', {
      chat: userActivity.chat,
      fitCheck: userActivity.fitCheck,
      profilePicReview: userActivity.profilePicReview,
      sessions: userActivity.sessions
    });
    
    // Test 3: Conversion funnel
    console.log('\n3. Testing conversion funnel...');
    const funnel = await analyticsQueries.getConversionFunnel('7d');
    console.log('✅ Conversion funnel:', {
      landingPageVisits: funnel.landingPageVisits,
      engagedUsers: funnel.engagedUsers,
      newSignups: funnel.newSignups,
      conversionRates: funnel.conversionRates
    });
    
    // Test 4: Daily trends
    console.log('\n4. Testing daily trends...');
    const trends = await analyticsQueries.getDailyActivityTrends('7d');
    console.log('✅ Daily trends (last 3 days):', trends.slice(-3));
    
    console.log('\n🎉 Analytics queries testing complete!');
    console.log('\n📊 Your current data:');
    console.log(`- Total landing page sessions: ${landingStats.totalSessions}`);
    console.log(`- Unique users: ${landingStats.uniqueUsers}`);
    console.log(`- Engaged sessions: ${landingStats.engagedSessions}`);
    console.log(`- Bounce rate: ${landingStats.bounceRate}`);
    console.log(`- New signups: ${funnel.newSignups}`);
    console.log(`- Chat users: ${funnel.chatUsers}`);
    console.log(`- Fit check users: ${funnel.fitCheckUsers}`);
    
  } catch (error) {
    console.error('❌ Analytics queries test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
  
  process.exit(0);
}

testAnalyticsQueries().catch(console.error);
