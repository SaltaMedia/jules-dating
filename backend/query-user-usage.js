require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const UserSession = require('./models/UserSession');
const ChatSession = require('./models/ChatSession');
const Conversation = require('./models/Conversation');
const ChatLog = require('./models/ChatLog');
const ChatAnalytics = require('./models/ChatAnalytics');

async function queryUserUsage() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'braxdenm@gmail.com';
    console.log(`\n=== SEARCHING FOR USER: ${email} ===`);

    // Find the user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`- ID: ${user._id}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Created: ${user.createdAt}`);
    console.log(`- Last Active: ${user.lastActive}`);
    console.log(`- Onboarding Completed: ${user.onboarding?.completed || false}`);

    const userId = user._id.toString();

    // Query Analytics Events
    console.log('\n=== ANALYTICS EVENTS ===');
    const analyticsEvents = await AnalyticsEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    console.log(`Total analytics events: ${analyticsEvents.length}`);
    
    if (analyticsEvents.length > 0) {
      // Group by date
      const eventsByDate = {};
      const eventsByType = {};
      const eventsByCategory = {};
      
      analyticsEvents.forEach(event => {
        const date = event.timestamp.toISOString().split('T')[0];
        if (!eventsByDate[date]) eventsByDate[date] = [];
        eventsByDate[date].push(event);
        
        eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      });

      console.log('\n📅 Usage by Date:');
      Object.keys(eventsByDate).sort().forEach(date => {
        console.log(`  ${date}: ${eventsByDate[date].length} events`);
      });

      console.log('\n📊 Events by Type:');
      Object.entries(eventsByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\n📂 Events by Category:');
      Object.entries(eventsByCategory).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    }

    // Query User Sessions
    console.log('\n=== USER SESSIONS ===');
    const userSessions = await UserSession.find({ userId })
      .sort({ startTime: -1 })
      .limit(50);

    console.log(`Total sessions: ${userSessions.length}`);
    
    if (userSessions.length > 0) {
      const sessionsByDate = {};
      let totalPageViews = 0;
      let totalChatMessages = 0;
      let totalDuration = 0;

      userSessions.forEach(session => {
        const date = session.startTime.toISOString().split('T')[0];
        if (!sessionsByDate[date]) sessionsByDate[date] = [];
        sessionsByDate[date].push(session);
        
        totalPageViews += session.pageViews || 0;
        totalChatMessages += session.chatMessages || 0;
        totalDuration += session.duration || 0;
      });

      console.log('\n📅 Sessions by Date:');
      Object.keys(sessionsByDate).sort().forEach(date => {
        const sessions = sessionsByDate[date];
        console.log(`  ${date}: ${sessions.length} sessions`);
      });

      console.log(`\n📈 Session Summary:`);
      console.log(`  Total Page Views: ${totalPageViews}`);
      console.log(`  Total Chat Messages: ${totalChatMessages}`);
      console.log(`  Total Duration: ${Math.round(totalDuration / 1000 / 60)} minutes`);
      console.log(`  Average Session Duration: ${Math.round(totalDuration / userSessions.length / 1000 / 60)} minutes`);
    }

    // Query Chat Sessions
    console.log('\n=== CHAT SESSIONS ===');
    const chatSessions = await ChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Total chat sessions: ${chatSessions.length}`);
    
    if (chatSessions.length > 0) {
      const chatByDate = {};
      let totalMessages = 0;

      chatSessions.forEach(session => {
        const date = session.createdAt.toISOString().split('T')[0];
        if (!chatByDate[date]) chatByDate[date] = [];
        chatByDate[date].push(session);
        
        totalMessages += session.messages.length;
      });

      console.log('\n📅 Chat Sessions by Date:');
      Object.keys(chatByDate).sort().forEach(date => {
        const sessions = chatByDate[date];
        console.log(`  ${date}: ${sessions.length} sessions, ${sessions.reduce((sum, s) => sum + s.messages.length, 0)} messages`);
      });

      console.log(`\n💬 Chat Summary:`);
      console.log(`  Total Messages: ${totalMessages}`);
      console.log(`  Average Messages per Session: ${Math.round(totalMessages / chatSessions.length)}`);

      // Show recent chat previews
      console.log('\n💬 Recent Chat Previews:');
      chatSessions.slice(0, 5).forEach((session, index) => {
        console.log(`  ${index + 1}. ${session.title} (${session.messages.length} messages)`);
        if (session.preview) {
          console.log(`     Preview: ${session.preview.substring(0, 100)}...`);
        }
      });
    }

    // Query Conversations (alternative chat model)
    console.log('\n=== CONVERSATIONS ===');
    const conversations = await Conversation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Total conversations: ${conversations.length}`);
    
    if (conversations.length > 0) {
      const convByDate = {};
      let totalConvMessages = 0;

      conversations.forEach(conv => {
        const date = conv.createdAt.toISOString().split('T')[0];
        if (!convByDate[date]) convByDate[date] = [];
        convByDate[date].push(conv);
        
        totalConvMessages += conv.messages.length;
      });

      console.log('\n📅 Conversations by Date:');
      Object.keys(convByDate).sort().forEach(date => {
        const convs = convByDate[date];
        console.log(`  ${date}: ${convs.length} conversations, ${convs.reduce((sum, c) => sum + c.messages.length, 0)} messages`);
      });

      console.log(`\n💬 Conversation Summary:`);
      console.log(`  Total Messages: ${totalConvMessages}`);
      console.log(`  Average Messages per Conversation: ${Math.round(totalConvMessages / conversations.length)}`);
    }

    // Query Chat Logs
    console.log('\n=== CHAT LOGS ===');
    const chatLogs = await ChatLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50);

    console.log(`Total chat logs: ${chatLogs.length}`);
    
    if (chatLogs.length > 0) {
      const logsByDate = {};
      const intents = {};
      const sentiments = {};

      chatLogs.forEach(log => {
        const date = log.timestamp.toISOString().split('T')[0];
        if (!logsByDate[date]) logsByDate[date] = [];
        logsByDate[date].push(log);
        
        intents[log.intent] = (intents[log.intent] || 0) + 1;
        sentiments[log.sentiment] = (sentiments[log.sentiment] || 0) + 1;
      });

      console.log('\n📅 Chat Logs by Date:');
      Object.keys(logsByDate).sort().forEach(date => {
        console.log(`  ${date}: ${logsByDate[date].length} logs`);
      });

      console.log('\n🎯 Intent Analysis:');
      Object.entries(intents).forEach(([intent, count]) => {
        console.log(`  ${intent}: ${count}`);
      });

      console.log('\n😊 Sentiment Analysis:');
      Object.entries(sentiments).forEach(([sentiment, count]) => {
        console.log(`  ${sentiment}: ${count}`);
      });
    }

    // Query Chat Analytics
    console.log('\n=== CHAT ANALYTICS ===');
    const chatAnalytics = await ChatAnalytics.find({ userId })
      .sort({ startTime: -1 })
      .limit(50);

    console.log(`Total chat analytics: ${chatAnalytics.length}`);
    
    if (chatAnalytics.length > 0) {
      const analyticsByDate = {};
      const primaryIntents = {};
      let totalUserMessages = 0;
      let totalAssistantMessages = 0;

      chatAnalytics.forEach(analytics => {
        const date = analytics.startTime.toISOString().split('T')[0];
        if (!analyticsByDate[date]) analyticsByDate[date] = [];
        analyticsByDate[date].push(analytics);
        
        primaryIntents[analytics.primaryIntent] = (primaryIntents[analytics.primaryIntent] || 0) + 1;
        totalUserMessages += analytics.messageCount.user || 0;
        totalAssistantMessages += analytics.messageCount.assistant || 0;
      });

      console.log('\n📅 Chat Analytics by Date:');
      Object.keys(analyticsByDate).sort().forEach(date => {
        console.log(`  ${date}: ${analyticsByDate[date].length} analytics records`);
      });

      console.log('\n🎯 Primary Intent Analysis:');
      Object.entries(primaryIntents).forEach(([intent, count]) => {
        console.log(`  ${intent}: ${count}`);
      });

      console.log(`\n💬 Message Count Summary:`);
      console.log(`  User Messages: ${totalUserMessages}`);
      console.log(`  Assistant Messages: ${totalAssistantMessages}`);
      console.log(`  Total Messages: ${totalUserMessages + totalAssistantMessages}`);
    }

    // Summary
    console.log('\n=== USAGE SUMMARY ===');
    const allDates = new Set();
    
    // Collect all dates from different sources
    analyticsEvents.forEach(event => allDates.add(event.timestamp.toISOString().split('T')[0]));
    userSessions.forEach(session => allDates.add(session.startTime.toISOString().split('T')[0]));
    chatSessions.forEach(session => allDates.add(session.createdAt.toISOString().split('T')[0]));
    conversations.forEach(conv => allDates.add(conv.createdAt.toISOString().split('T')[0]));
    chatLogs.forEach(log => allDates.add(log.timestamp.toISOString().split('T')[0]));
    chatAnalytics.forEach(analytics => allDates.add(analytics.startTime.toISOString().split('T')[0]));

    const sortedDates = Array.from(allDates).sort();
    
    console.log(`\n📅 Active Days: ${sortedDates.length}`);
    console.log('Active dates:', sortedDates.join(', '));
    
    console.log(`\n📊 Total Activity:`);
    console.log(`  Analytics Events: ${analyticsEvents.length}`);
    console.log(`  User Sessions: ${userSessions.length}`);
    console.log(`  Chat Sessions: ${chatSessions.length}`);
    console.log(`  Conversations: ${conversations.length}`);
    console.log(`  Chat Logs: ${chatLogs.length}`);
    console.log(`  Chat Analytics: ${chatAnalytics.length}`);

    const totalChatMessages = totalMessages + totalConvMessages + totalUserMessages + totalAssistantMessages;
    console.log(`\n💬 Total Chat Activity: ${totalChatMessages} messages`);

    if (totalChatMessages > 0) {
      console.log('✅ User has chatted with Jules');
    } else {
      console.log('❌ No chat activity found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

queryUserUsage();
