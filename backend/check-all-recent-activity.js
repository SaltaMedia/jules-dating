const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const Conversation = require('./models/Conversation');
const FitCheck = require('./models/FitCheck');
const ProfilePicReview = require('./models/ProfilePicReview');
const ClosetItem = require('./models/ClosetItem');

async function checkRecentActivity() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 Checking for most recent activity in each collection...\n');
    console.log('='.repeat(80));

    // Check each collection for most recent activity
    
    // 1. Analytics Events
    const latestAnalyticsEvent = await AnalyticsEvent.findOne().sort({ timestamp: -1 });
    console.log('\n📊 ANALYTICS EVENTS:');
    if (latestAnalyticsEvent) {
      console.log(`   Most recent: ${latestAnalyticsEvent.timestamp.toLocaleString()}`);
      console.log(`   Action: ${latestAnalyticsEvent.category} - ${latestAnalyticsEvent.action}`);
      console.log(`   User: ${latestAnalyticsEvent.userId}`);
    } else {
      console.log('   No analytics events found');
    }
    const analyticsCount = await AnalyticsEvent.countDocuments();
    console.log(`   Total events: ${analyticsCount}`);

    // 2. Conversations
    const latestConversation = await Conversation.findOne().sort({ updatedAt: -1 });
    console.log('\n💬 CONVERSATIONS:');
    if (latestConversation) {
      console.log(`   Most recent: ${latestConversation.updatedAt.toLocaleString()}`);
      console.log(`   User: ${latestConversation.userId}`);
      console.log(`   Messages: ${latestConversation.messages.length}`);
    } else {
      console.log('   No conversations found');
    }
    const conversationsCount = await Conversation.countDocuments();
    console.log(`   Total conversations: ${conversationsCount}`);

    // 3. Fit Checks
    const latestFitCheck = await FitCheck.findOne().sort({ createdAt: -1 }).populate('userId', 'email name');
    console.log('\n👔 FIT CHECKS:');
    if (latestFitCheck) {
      console.log(`   Most recent: ${latestFitCheck.createdAt.toLocaleString()}`);
      if (latestFitCheck.userId) {
        console.log(`   User: ${latestFitCheck.userId.email} (${latestFitCheck.userId.name})`);
      } else if (latestFitCheck.anonymousId) {
        console.log(`   User: Anonymous (${latestFitCheck.anonymousId})`);
      }
      console.log(`   Event: ${latestFitCheck.eventContext}`);
      console.log(`   Rating: ${latestFitCheck.rating}/10`);
    } else {
      console.log('   No fit checks found');
    }
    const fitChecksCount = await FitCheck.countDocuments();
    console.log(`   Total fit checks: ${fitChecksCount}`);

    // 4. Profile Pic Reviews
    const latestProfilePicReview = await ProfilePicReview.findOne().sort({ createdAt: -1 }).populate('userId', 'email name');
    console.log('\n📸 PROFILE PIC REVIEWS:');
    if (latestProfilePicReview) {
      console.log(`   Most recent: ${latestProfilePicReview.createdAt.toLocaleString()}`);
      if (latestProfilePicReview.userId) {
        console.log(`   User: ${latestProfilePicReview.userId.email} (${latestProfilePicReview.userId.name})`);
      } else if (latestProfilePicReview.sessionId) {
        console.log(`   User: Anonymous (session: ${latestProfilePicReview.sessionId})`);
      }
      console.log(`   Rating: ${latestProfilePicReview.rating}/10`);
    } else {
      console.log('   No profile pic reviews found');
    }
    const profilePicReviewsCount = await ProfilePicReview.countDocuments();
    console.log(`   Total profile pic reviews: ${profilePicReviewsCount}`);

    // 5. Closet Items
    const latestClosetItem = await ClosetItem.findOne().sort({ createdAt: -1 });
    console.log('\n👕 CLOSET ITEMS:');
    if (latestClosetItem) {
      console.log(`   Most recent: ${latestClosetItem.createdAt.toLocaleString()}`);
      console.log(`   User: ${latestClosetItem.userId}`);
      console.log(`   Item: ${latestClosetItem.name || 'Unnamed'}`);
    } else {
      console.log('   No closet items found');
    }
    const closetItemsCount = await ClosetItem.countDocuments();
    console.log(`   Total closet items: ${closetItemsCount}`);

    // 6. Users
    const latestUser = await User.findOne().sort({ createdAt: -1 });
    console.log('\n👤 USERS:');
    if (latestUser) {
      console.log(`   Most recent signup: ${latestUser.createdAt.toLocaleString()}`);
      console.log(`   Email: ${latestUser.email}`);
      console.log(`   Name: ${latestUser.name}`);
      console.log(`   Last active: ${latestUser.lastActive ? latestUser.lastActive.toLocaleString() : 'Never'}`);
    } else {
      console.log('   No users found');
    }
    const usersCount = await User.countDocuments();
    console.log(`   Total users: ${usersCount}`);

    // Now let's check activity over different time periods
    console.log('\n' + '='.repeat(80));
    console.log('\n📅 ACTIVITY BY TIME PERIOD:\n');

    const now = new Date();
    const periods = [
      { name: 'Last 24 hours', days: 1 },
      { name: 'Last 3 days', days: 3 },
      { name: 'Last 7 days', days: 7 },
      { name: 'Last 30 days', days: 30 }
    ];

    for (const period of periods) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - period.days);

      const analyticsEvents = await AnalyticsEvent.countDocuments({
        timestamp: { $gte: startDate },
        userId: { $ne: 'anonymous' }
      });

      const conversations = await Conversation.countDocuments({
        updatedAt: { $gte: startDate },
        userId: { $ne: 'anonymous' }
      });

      const fitChecks = await FitCheck.countDocuments({
        createdAt: { $gte: startDate },
        userId: { $exists: true, $ne: null }
      });

      const profilePicReviews = await ProfilePicReview.countDocuments({
        createdAt: { $gte: startDate },
        userId: { $exists: true, $ne: null }
      });

      const closetItems = await ClosetItem.countDocuments({
        createdAt: { $gte: startDate },
        userId: { $exists: true, $ne: null }
      });

      // Get unique active users
      const activeUserIds = new Set();

      const analyticsUserIds = await AnalyticsEvent.distinct('userId', {
        timestamp: { $gte: startDate },
        userId: { $ne: 'anonymous', $exists: true }
      });
      analyticsUserIds.forEach(id => activeUserIds.add(id));

      const conversationUserIds = await Conversation.distinct('userId', {
        updatedAt: { $gte: startDate },
        userId: { $ne: 'anonymous', $exists: true }
      });
      conversationUserIds.forEach(id => activeUserIds.add(id.toString()));

      const fitCheckUsers = await FitCheck.find({
        createdAt: { $gte: startDate },
        userId: { $exists: true, $ne: null }
      }).distinct('userId');
      fitCheckUsers.forEach(id => activeUserIds.add(id.toString()));

      const profilePicReviewUsers = await ProfilePicReview.find({
        createdAt: { $gte: startDate },
        userId: { $exists: true, $ne: null }
      }).distinct('userId');
      profilePicReviewUsers.forEach(id => activeUserIds.add(id.toString()));

      console.log(`${period.name}:`);
      console.log(`   • Active users: ${activeUserIds.size}`);
      console.log(`   • Analytics events: ${analyticsEvents}`);
      console.log(`   • Conversations: ${conversations}`);
      console.log(`   • Fit checks: ${fitChecks}`);
      console.log(`   • Profile pic reviews: ${profilePicReviews}`);
      console.log(`   • Closet items: ${closetItems}`);
      console.log();
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the check
checkRecentActivity();

