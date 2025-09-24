const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const UserSession = require('../models/UserSession');
const ChatAnalytics = require('../models/ChatAnalytics');
require('dotenv').config();

async function generateTestData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Clear existing test data
    await AnalyticsEvent.deleteMany({});
    await UserSession.deleteMany({});
    await ChatAnalytics.deleteMany({});
    console.log('Cleared existing test data');

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Generate test users
    const testUsers = [
      { id: 'user1', name: 'John Doe' },
      { id: 'user2', name: 'Jane Smith' },
      { id: 'user3', name: 'Bob Johnson' },
      { id: 'user4', name: 'Alice Brown' },
      { id: 'user5', name: 'Charlie Wilson' }
    ];

    // Generate page view events
    const pages = ['/', '/onboarding', '/chat', '/wardrobe', '/fit-check', '/settings'];
    const pageViewEvents = [];

    for (let i = 0; i < 100; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const page = pages[Math.floor(Math.random() * pages.length)];
      const timestamp = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));

      pageViewEvents.push({
        userId: user.id,
        sessionId: `session_${Math.floor(Math.random() * 20)}`,
        eventType: 'page_view',
        category: 'navigation',
        action: 'page_visited',
        page,
        properties: {
          url: `http://localhost:3001${page}`,
          title: `Jules Style - ${page}`
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }

    // Generate feature usage events
    const features = ['chat', 'wardrobe', 'fit_check', 'onboarding', 'profile'];
    const featureEvents = [];

    for (let i = 0; i < 50; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const feature = features[Math.floor(Math.random() * features.length)];
      const timestamp = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));

      featureEvents.push({
        userId: user.id,
        sessionId: `session_${Math.floor(Math.random() * 20)}`,
        eventType: 'feature_usage',
        category: 'engagement',
        action: 'feature_used',
        properties: {
          feature,
          action: Math.random() > 0.5 ? 'clicked' : 'viewed'
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }

    // Generate onboarding events
    const onboardingSteps = ['step_1_start', 'step_1_complete', 'step_2_start', 'step_2_complete', 'step_3_start', 'step_3_complete'];
    const onboardingEvents = [];

    for (let i = 0; i < 30; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const step = onboardingSteps[Math.floor(Math.random() * onboardingSteps.length)];
      const timestamp = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));

      onboardingEvents.push({
        userId: user.id,
        sessionId: `session_${Math.floor(Math.random() * 20)}`,
        eventType: 'onboarding_step',
        category: 'onboarding',
        action: step,
        properties: {
          stepNumber: parseInt(step.split('_')[1]),
          totalSteps: 3
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }

    // Generate chat events
    const chatTopics = ['style_advice', 'dating_tips', 'wardrobe_help', 'fit_questions', 'general_chat'];
    const chatEvents = [];

    for (let i = 0; i < 80; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const topic = chatTopics[Math.floor(Math.random() * chatTopics.length)];
      const timestamp = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));

      chatEvents.push({
        userId: user.id,
        sessionId: `session_${Math.floor(Math.random() * 20)}`,
        eventType: 'chat_message',
        category: 'chat',
        action: 'message_sent',
        properties: {
          topic,
          messageLength: Math.floor(Math.random() * 100) + 10,
          responseTime: Math.floor(Math.random() * 5000) + 500
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }

    // Generate conversion events
    const conversionEvents = [];

    for (let i = 0; i < 15; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const timestamp = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));

      conversionEvents.push({
        userId: user.id,
        sessionId: `session_${Math.floor(Math.random() * 20)}`,
        eventType: 'conversion',
        category: 'engagement',
        action: 'signup',
        properties: {
          method: Math.random() > 0.5 ? 'email' : 'google',
          source: 'landing_page'
        },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: '127.0.0.1',
        timestamp
      });
    }

    // Combine all events
    const allEvents = [...pageViewEvents, ...featureEvents, ...onboardingEvents, ...chatEvents, ...conversionEvents];

    // Insert events
    await AnalyticsEvent.insertMany(allEvents);
    console.log(`✅ Generated ${allEvents.length} analytics events`);

    // Generate user sessions
    const sessions = [];
    for (let i = 0; i < 20; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const startTime = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
      const duration = Math.floor(Math.random() * 300000) + 60000; // 1-6 minutes
      const endTime = new Date(startTime.getTime() + duration);

      sessions.push({
        userId: user.id,
        sessionId: `session_${i}`,
        startTime,
        endTime,
        duration,
        pageViews: Math.floor(Math.random() * 10) + 1,
        chatMessages: Math.floor(Math.random() * 20) + 1,
        device: Math.random() > 0.5 ? 'desktop' : 'mobile',
        browser: Math.random() > 0.5 ? 'Chrome' : 'Safari',
        isActive: false
      });
    }

    await UserSession.insertMany(sessions);
    console.log(`✅ Generated ${sessions.length} user sessions`);

    // Generate chat analytics
    const chatAnalyticsData = [];
    for (let i = 0; i < 10; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const startTime = new Date(oneWeekAgo.getTime() + Math.random() * (now.getTime() - oneWeekAgo.getTime()));
      const duration = Math.floor(Math.random() * 600000) + 120000; // 2-12 minutes

      chatAnalyticsData.push({
        userId: user.id,
        sessionId: `session_${i}`,
        conversationId: `conv_${i}`,
        startTime,
        duration,
        messageCount: {
          user: Math.floor(Math.random() * 10) + 1,
          assistant: Math.floor(Math.random() * 10) + 1
        },
        averageResponseTime: Math.floor(Math.random() * 3000) + 1000,
        sentiment: {
          overall: Math.random() > 0.7 ? 'positive' : Math.random() > 0.3 ? 'neutral' : 'negative'
        }
      });
    }

    await ChatAnalytics.insertMany(chatAnalyticsData);
    console.log(`✅ Generated ${chatAnalyticsData.length} chat analytics records`);

    console.log('\n🎉 Test data generation complete!');
    console.log('📊 You can now view the analytics dashboard at: http://localhost:3001/admin/analytics');
    console.log('📈 The dashboard should now show sample data for testing');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
generateTestData();
