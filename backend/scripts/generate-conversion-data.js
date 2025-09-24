const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const User = require('../models/User');
const ChatLog = require('../models/ChatLog');
require('dotenv').config();

async function generateConversionData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Create some test users first
    const testUsers = [];
    for (let i = 0; i < 50; i++) {
      const user = new User({
        email: `testuser${i}@example.com`,
        name: `Test User ${i}`,
        password: 'password123'
      });
      testUsers.push(await user.save());
    }
    console.log(`Created ${testUsers.length} test users`);

    // Generate sign-up/sign-in click events
    const signupEvents = [];
    for (let i = 0; i < 150; i++) {
      signupEvents.push({
        userId: 'anonymous',
        sessionId: `session_${i}`,
        eventType: 'conversion',
        category: 'engagement',
        action: Math.random() > 0.5 ? 'sign-up' : 'sign-in',
        page: '/',
        properties: {},
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1'
      });
    }

    // Generate onboarding step events
    const onboardingSteps = ['profile', 'preferences', 'wardrobe', 'style_quiz', 'complete'];
    const onboardingEvents = [];
    
    for (let i = 0; i < 100; i++) {
      const step = onboardingSteps[Math.floor(Math.random() * onboardingSteps.length)];
      const completed = step === 'complete' || Math.random() > 0.3; // 70% completion rate
      
      onboardingEvents.push({
        userId: `user_${i}`,
        sessionId: `session_${i}`,
        eventType: 'onboarding_step',
        category: 'onboarding',
        action: step,
        page: `/onboarding/${step}`,
        properties: {
          step: step,
          completed: completed
        },
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1'
      });
    }

    // Generate onboarding completion events
    const completionEvents = [];
    for (let i = 0; i < 70; i++) {
      completionEvents.push({
        userId: `user_${i}`,
        sessionId: `session_${i}`,
        eventType: 'onboarding_step',
        category: 'onboarding',
        action: 'complete',
        page: '/onboarding/complete',
        properties: { step: 'complete', completed: true },
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1'
      });
    }

    // Generate chat logs
    const chatMessages = [
      "How do I build a capsule wardrobe?",
      "What should I wear for a job interview?",
      "Help me find my style",
      "What colors work best for me?",
      "How do I dress for my body type?",
      "What's trending this season?",
      "Help me organize my closet",
      "What should I wear on a first date?",
      "How do I mix and match clothes?",
      "What are the basics I need?"
    ];

    const chatLogs = [];
    for (let i = 0; i < 50; i++) {
      const message = chatMessages[Math.floor(Math.random() * chatMessages.length)];
      const sentiment = ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)];
      const user = testUsers[i % testUsers.length]; // Use real user IDs
      
      chatLogs.push({
        userId: user._id,
        sessionId: `session_${i}`,
        message: message,
        response: `Here's my advice about ${message.toLowerCase()}`,
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        intent: 'style_advice',
        sentiment: sentiment
      });
    }

    // Insert all the data
    await AnalyticsEvent.insertMany([...signupEvents, ...onboardingEvents, ...completionEvents]);
    await ChatLog.insertMany(chatLogs);

    console.log('✅ Generated conversion funnel data:');
    console.log(`- ${signupEvents.length} sign-up/sign-in clicks`);
    console.log(`- ${onboardingEvents.length} onboarding step events`);
    console.log(`- ${completionEvents.length} onboarding completions`);
    console.log(`- ${chatLogs.length} chat logs`);

    // Calculate conversion rate
    const conversionRate = (completionEvents.length / signupEvents.length * 100).toFixed(1);
    console.log(`- Conversion rate: ${conversionRate}%`);

  } catch (error) {
    console.error('❌ Error generating conversion data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

generateConversionData();
