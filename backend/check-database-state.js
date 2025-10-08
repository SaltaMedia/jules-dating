require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const UserSession = require('./models/UserSession');
const ChatSession = require('./models/ChatSession');
const Conversation = require('./models/Conversation');

async function checkDatabaseState() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== DATABASE STATE CHECK ===');
    
    // Check all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 Collections in database:');
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });

    // Check user count
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users: ${userCount}`);

    // Check analytics events
    const analyticsCount = await AnalyticsEvent.countDocuments();
    console.log(`📈 Total analytics events: ${analyticsCount}`);

    // Check user sessions
    const sessionCount = await UserSession.countDocuments();
    console.log(`🔐 Total user sessions: ${sessionCount}`);

    // Check chat sessions
    const chatSessionCount = await ChatSession.countDocuments();
    console.log(`💬 Total chat sessions: ${chatSessionCount}`);

    // Check conversations
    const conversationCount = await Conversation.countDocuments();
    console.log(`🗣️ Total conversations: ${conversationCount}`);

    // Get all users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    // Check for any users with braxden in email
    console.log('\n🔍 Searching for braxden users...');
    const braxdenUsers = await User.find({ 
      email: { $regex: /braxden/i } 
    });
    console.log(`Found ${braxdenUsers.length} users with 'braxden' in email`);
    braxdenUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    // Check analytics events for braxden
    console.log('\n🔍 Searching analytics events for braxden...');
    const braxdenAnalytics = await AnalyticsEvent.find({
      $or: [
        { userId: { $regex: /braxden/i } },
        { 'properties.email': { $regex: /braxden/i } },
        { 'properties.userEmail': { $regex: /braxden/i } }
      ]
    }).limit(10);
    
    console.log(`Found ${braxdenAnalytics.length} analytics events for braxden`);
    braxdenAnalytics.forEach(event => {
      console.log(`- ${event.eventType} at ${event.timestamp} (userId: ${event.userId})`);
    });

    // Check user sessions for braxden
    console.log('\n🔍 Searching user sessions for braxden...');
    const braxdenSessions = await UserSession.find({
      $or: [
        { userId: { $regex: /braxden/i } },
        { 'properties.email': { $regex: /braxden/i } }
      ]
    }).limit(10);
    
    console.log(`Found ${braxdenSessions.length} user sessions for braxden`);
    braxdenSessions.forEach(session => {
      console.log(`- Session ${session.sessionId} at ${session.startTime} (userId: ${session.userId})`);
    });

    // Check if there are any recent analytics events
    console.log('\n📊 Recent analytics events (last 10):');
    const recentEvents = await AnalyticsEvent.find({})
      .sort({ timestamp: -1 })
      .limit(10);
    
    recentEvents.forEach(event => {
      console.log(`- ${event.eventType} by ${event.userId} at ${event.timestamp}`);
    });

    // Check if there are any recent user sessions
    console.log('\n🔐 Recent user sessions (last 10):');
    const recentSessions = await UserSession.find({})
      .sort({ startTime: -1 })
      .limit(10);
    
    recentSessions.forEach(session => {
      console.log(`- Session ${session.sessionId} by ${session.userId} at ${session.startTime}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDatabaseState();
