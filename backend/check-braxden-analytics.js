require('dotenv').config();
const mongoose = require('mongoose');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const UserSession = require('./models/UserSession');
const ChatAnalytics = require('./models/ChatAnalytics');

async function checkBraxdenAnalytics() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CHECKING ANALYTICS DATA FOR BRAXDEN ===');
    
    // Check analytics events
    console.log('\n🔍 Checking AnalyticsEvent collection...');
    
    const analyticsEvents = await AnalyticsEvent.find({
      $or: [
        { userId: { $regex: /braxden/i } },
        { 'properties.email': { $regex: /braxden/i } },
        { 'properties.userEmail': { $regex: /braxden/i } }
      ]
    }).sort({ timestamp: -1 });
    
    console.log(`📊 Analytics events for braxden: ${analyticsEvents.length}`);
    if (analyticsEvents.length > 0) {
      analyticsEvents.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.eventType} - User ID: ${event.userId} - Created: ${event.timestamp}`);
        if (event.properties) {
          console.log(`     Properties: ${JSON.stringify(event.properties)}`);
        }
      });
    }
    
    // Check user sessions
    console.log('\n🔍 Checking UserSession collection...');
    
    const userSessions = await UserSession.find({
      $or: [
        { userId: { $regex: /braxden/i } },
        { 'properties.email': { $regex: /braxden/i } }
      ]
    }).sort({ startTime: -1 });
    
    console.log(`🔐 User sessions for braxden: ${userSessions.length}`);
    if (userSessions.length > 0) {
      userSessions.forEach((session, i) => {
        console.log(`  ${i+1}. Session ID: ${session.sessionId} - User ID: ${session.userId} - Started: ${session.startTime}`);
      });
    }
    
    // Check chat analytics
    console.log('\n🔍 Checking ChatAnalytics collection...');
    
    const chatAnalytics = await ChatAnalytics.find({
      $or: [
        { userId: { $regex: /braxden/i } },
        { 'properties.email': { $regex: /braxden/i } }
      ]
    }).sort({ startTime: -1 });
    
    console.log(`💬 Chat analytics for braxden: ${chatAnalytics.length}`);
    if (chatAnalytics.length > 0) {
      chatAnalytics.forEach((analytics, i) => {
        console.log(`  ${i+1}. Conversation ID: ${analytics.conversationId} - User ID: ${analytics.userId} - Started: ${analytics.startTime}`);
      });
    }
    
    // Check for any data that might have been created on Oct 1, 2025
    console.log('\n🔍 Checking for data created on Oct 1, 2025...');
    
    const oct1Start = new Date('2025-10-01T00:00:00.000Z');
    const oct1End = new Date('2025-10-02T00:00:00.000Z');
    
    const oct1Analytics = await AnalyticsEvent.find({
      timestamp: { $gte: oct1Start, $lt: oct1End }
    }).sort({ timestamp: -1 }).limit(20);
    
    console.log(`📊 Analytics events on Oct 1, 2025: ${oct1Analytics.length}`);
    if (oct1Analytics.length > 0) {
      console.log('Recent analytics events on Oct 1:');
      oct1Analytics.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.eventType} - User ID: ${event.userId} - Created: ${event.timestamp}`);
      });
    }
    
    const oct1Sessions = await UserSession.find({
      startTime: { $gte: oct1Start, $lt: oct1End }
    }).sort({ startTime: -1 }).limit(20);
    
    console.log(`🔐 User sessions on Oct 1, 2025: ${oct1Sessions.length}`);
    if (oct1Sessions.length > 0) {
      console.log('Recent user sessions on Oct 1:');
      oct1Sessions.forEach((session, i) => {
        console.log(`  ${i+1}. Session ID: ${session.sessionId} - User ID: ${session.userId} - Started: ${session.startTime}`);
      });
    }
    
    // Check for any data that might reference the user ID we created
    console.log('\n🔍 Checking for data with the recovered user ID...');
    
    const recoveredUserId = '68dff181cdf10e6be814954b'; // braxdenm@gmail.com user ID
    
    const userIdAnalytics = await AnalyticsEvent.find({
      userId: recoveredUserId
    }).sort({ timestamp: -1 });
    
    console.log(`📊 Analytics events for recovered user ID: ${userIdAnalytics.length}`);
    if (userIdAnalytics.length > 0) {
      userIdAnalytics.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.eventType} - Created: ${event.timestamp}`);
      });
    }
    
    const userIdSessions = await UserSession.find({
      userId: recoveredUserId
    }).sort({ startTime: -1 });
    
    console.log(`🔐 User sessions for recovered user ID: ${userIdSessions.length}`);
    if (userIdSessions.length > 0) {
      userIdSessions.forEach((session, i) => {
        console.log(`  ${i+1}. Session ID: ${session.sessionId} - Started: ${session.startTime}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkBraxdenAnalytics();
