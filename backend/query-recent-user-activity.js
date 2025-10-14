const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const Conversation = require('./models/Conversation');
const FitCheck = require('./models/FitCheck');
const ProfilePicReview = require('./models/ProfilePicReview');
const ClosetItem = require('./models/ClosetItem');
const UserSession = require('./models/UserSession');

async function getRecentUserActivity() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log(`📅 Analyzing activity from: ${thirtyDaysAgo.toLocaleString()} to ${new Date().toLocaleString()}\n`);
    console.log('=' .repeat(80));

    // Get all users who had any activity in the past 30 days
    const activeUserIds = new Set();

    // 1. Check Analytics Events
    const analyticsEvents = await AnalyticsEvent.find({
      timestamp: { $gte: thirtyDaysAgo },
      userId: { $ne: 'anonymous' }
    }).sort({ timestamp: -1 });

    analyticsEvents.forEach(event => {
      if (event.userId && event.userId !== 'anonymous') {
        activeUserIds.add(event.userId);
      }
    });

    // 2. Check Conversations (messages)
    const recentConversations = await Conversation.find({
      updatedAt: { $gte: thirtyDaysAgo },
      userId: { $ne: 'anonymous' }
    });

    recentConversations.forEach(conv => {
      if (conv.userId && conv.userId !== 'anonymous') {
        // Could be ObjectId or string, handle both
        activeUserIds.add(conv.userId.toString());
      }
    });

    // 3. Check FitChecks
    const recentFitChecks = await FitCheck.find({
      createdAt: { $gte: thirtyDaysAgo },
      userId: { $exists: true, $ne: null }
    }).populate('userId', 'email name');

    recentFitChecks.forEach(fitCheck => {
      if (fitCheck.userId) {
        activeUserIds.add(fitCheck.userId._id.toString());
      }
    });

    // 4. Check Profile Pic Reviews
    const recentProfilePicReviews = await ProfilePicReview.find({
      createdAt: { $gte: thirtyDaysAgo },
      userId: { $exists: true, $ne: null }
    }).populate('userId', 'email name');

    recentProfilePicReviews.forEach(review => {
      if (review.userId) {
        activeUserIds.add(review.userId._id.toString());
      }
    });

    // 5. Check Closet Items
    const recentClosetItems = await ClosetItem.find({
      createdAt: { $gte: thirtyDaysAgo },
      userId: { $exists: true, $ne: null }
    });

    recentClosetItems.forEach(item => {
      if (item.userId) {
        activeUserIds.add(item.userId.toString());
      }
    });

    console.log(`\n🎯 TOTAL ACTIVE USERS (past 30 days): ${activeUserIds.size}\n`);

    if (activeUserIds.size === 0) {
      console.log('No user activity found in the past 30 days.');
      return;
    }

    // Get user details for all active users
    const users = await User.find({
      _id: { $in: Array.from(activeUserIds).map(id => {
        try {
          return mongoose.Types.ObjectId(id);
        } catch (e) {
          return null;
        }
      }).filter(id => id !== null) }
    });

    // Create a map of userId to user info
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      };
    });

    // Now analyze each user's activity
    for (const userId of activeUserIds) {
      const userInfo = userMap[userId];
      
      if (!userInfo) {
        console.log(`\n⚠️  User ID: ${userId} (not found in users collection - might be deleted)`);
        continue;
      }

      console.log('\n' + '='.repeat(80));
      console.log(`\n👤 USER: ${userInfo.name} (${userInfo.email})`);
      console.log(`   Account Created: ${userInfo.createdAt.toLocaleDateString()}`);
      if (userInfo.isAdmin) console.log(`   🔧 ADMIN ACCOUNT`);
      console.log('\n' + '-'.repeat(80));

      // Analyze their activities
      let activityCount = 0;

      // Analytics Events
      const userAnalyticsEvents = analyticsEvents.filter(e => e.userId === userId);
      if (userAnalyticsEvents.length > 0) {
        activityCount += userAnalyticsEvents.length;
        console.log(`\n📊 ANALYTICS EVENTS: ${userAnalyticsEvents.length} events`);
        
        // Group by category and action
        const eventsByCategory = {};
        userAnalyticsEvents.forEach(event => {
          const key = `${event.category} - ${event.action}`;
          if (!eventsByCategory[key]) {
            eventsByCategory[key] = { count: 0, timestamps: [] };
          }
          eventsByCategory[key].count++;
          eventsByCategory[key].timestamps.push(event.timestamp);
        });

        Object.entries(eventsByCategory)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([action, data]) => {
            const latestTime = new Date(Math.max(...data.timestamps.map(t => new Date(t))));
            console.log(`   • ${action}: ${data.count}x (latest: ${latestTime.toLocaleString()})`);
          });
      }

      // Conversations
      const userConversations = recentConversations.filter(c => c.userId.toString() === userId);
      if (userConversations.length > 0) {
        console.log(`\n💬 CHAT CONVERSATIONS: ${userConversations.length} conversation(s)`);
        
        userConversations.forEach((conv, idx) => {
          const messageCount = conv.messages.length;
          const userMessages = conv.messages.filter(m => m.role === 'user').length;
          const assistantMessages = conv.messages.filter(m => m.role === 'assistant').length;
          const lastMessage = conv.messages[conv.messages.length - 1];
          
          activityCount += messageCount;
          
          console.log(`\n   Conversation ${idx + 1}:`);
          console.log(`   • Total messages: ${messageCount} (${userMessages} user, ${assistantMessages} assistant)`);
          console.log(`   • Started: ${conv.createdAt.toLocaleString()}`);
          console.log(`   • Last updated: ${conv.updatedAt.toLocaleString()}`);
          console.log(`   • Last message from: ${lastMessage.role}`);
          
          if (conv.state.lastIntent) {
            console.log(`   • Intent: ${conv.state.lastIntent}`);
          }
          
          // Show recent messages
          const recentMessages = conv.messages.slice(-3);
          console.log(`   • Recent exchange:`);
          recentMessages.forEach(msg => {
            const preview = msg.content.substring(0, 100).replace(/\n/g, ' ');
            const timestamp = msg.timestamp.toLocaleString();
            console.log(`      [${timestamp}] ${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
          });
        });
      }

      // FitChecks
      const userFitChecks = recentFitChecks.filter(fc => fc.userId && fc.userId._id.toString() === userId);
      if (userFitChecks.length > 0) {
        activityCount += userFitChecks.length;
        console.log(`\n👔 FIT CHECKS: ${userFitChecks.length} submission(s)`);
        
        userFitChecks.forEach((fitCheck, idx) => {
          console.log(`\n   Fit Check ${idx + 1}:`);
          console.log(`   • Date: ${fitCheck.createdAt.toLocaleString()}`);
          console.log(`   • Event: ${fitCheck.eventContext}`);
          console.log(`   • Rating: ${fitCheck.rating}/10`);
          if (fitCheck.specificQuestion) {
            console.log(`   • Question: ${fitCheck.specificQuestion}`);
          }
          if (fitCheck.analysis) {
            const feedback = fitCheck.analysis.feedback.substring(0, 150).replace(/\n/g, ' ');
            console.log(`   • Feedback: ${feedback}${fitCheck.analysis.feedback.length > 150 ? '...' : ''}`);
          }
          if (fitCheck.saved) {
            console.log(`   • ⭐ Saved by user`);
          }
        });
      }

      // Profile Pic Reviews
      const userProfilePicReviews = recentProfilePicReviews.filter(pr => pr.userId && pr.userId._id.toString() === userId);
      if (userProfilePicReviews.length > 0) {
        activityCount += userProfilePicReviews.length;
        console.log(`\n📸 PROFILE PIC REVIEWS: ${userProfilePicReviews.length} submission(s)`);
        
        userProfilePicReviews.forEach((review, idx) => {
          console.log(`\n   Review ${idx + 1}:`);
          console.log(`   • Date: ${review.createdAt.toLocaleString()}`);
          console.log(`   • Rating: ${review.rating}/10`);
          if (review.specificQuestion) {
            console.log(`   • Question: ${review.specificQuestion}`);
          }
          if (review.analysis) {
            console.log(`   • Scores:`);
            if (review.analysis.lighting) console.log(`      - Lighting: ${review.analysis.lighting}/10`);
            if (review.analysis.grooming) console.log(`      - Grooming: ${review.analysis.grooming}/10`);
            if (review.analysis.eyeContact) console.log(`      - Eye Contact: ${review.analysis.eyeContact}/10`);
            if (review.analysis.smile) console.log(`      - Smile: ${review.analysis.smile}/10`);
          }
          if (review.saved) {
            console.log(`   • ⭐ Saved by user`);
          }
        });
      }

      // Closet Items
      const userClosetItems = recentClosetItems.filter(item => item.userId && item.userId.toString() === userId);
      if (userClosetItems.length > 0) {
        activityCount += userClosetItems.length;
        console.log(`\n👕 WARDROBE ITEMS ADDED: ${userClosetItems.length} item(s)`);
        
        userClosetItems.forEach((item, idx) => {
          console.log(`   ${idx + 1}. ${item.name || 'Unnamed item'}`);
          console.log(`      • Category: ${item.category || 'N/A'}`);
          console.log(`      • Brand: ${item.brand || 'N/A'}`);
          console.log(`      • Added: ${item.createdAt.toLocaleString()}`);
        });
      }

      // User Sessions
      const userSessions = await UserSession.find({
        userId: userId,
        startTime: { $gte: thirtyDaysAgo }
      }).sort({ startTime: -1 });

      if (userSessions.length > 0) {
        console.log(`\n🔐 SESSIONS: ${userSessions.length} session(s)`);
        userSessions.forEach((session, idx) => {
          const duration = session.duration ? Math.round(session.duration / 1000 / 60) : 0;
          console.log(`   ${idx + 1}. Started: ${session.startTime.toLocaleString()}`);
          if (session.endTime) {
            console.log(`      Ended: ${session.endTime.toLocaleString()} (${duration} min)`);
          }
          console.log(`      Page views: ${session.pageViews}, Chat messages: ${session.chatMessages}`);
          if (session.featuresUsed && session.featuresUsed.length > 0) {
            console.log(`      Features: ${session.featuresUsed.map(f => f.feature).join(', ')}`);
          }
        });
      }

      console.log(`\n📈 TOTAL ACTIVITY SCORE: ${activityCount} interactions`);
    }

    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY STATISTICS\n');
    console.log(`Total Active Users: ${activeUserIds.size}`);
    console.log(`Total Analytics Events: ${analyticsEvents.length}`);
    console.log(`Total Conversations: ${recentConversations.length}`);
    console.log(`Total Chat Messages: ${recentConversations.reduce((sum, c) => sum + c.messages.length, 0)}`);
    console.log(`Total Fit Checks: ${recentFitChecks.length}`);
    console.log(`Total Profile Pic Reviews: ${recentProfilePicReviews.length}`);
    console.log(`Total Wardrobe Items Added: ${recentClosetItems.length}`);

    // Most active features
    console.log('\n🔥 MOST POPULAR FEATURES:\n');
    const featureCounts = {
      'Chat': recentConversations.reduce((sum, c) => sum + c.messages.length, 0),
      'Fit Check': recentFitChecks.length,
      'Profile Pic Review': recentProfilePicReviews.length,
      'Wardrobe Management': recentClosetItems.length,
      'Analytics Events': analyticsEvents.length
    };

    Object.entries(featureCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([feature, count]) => {
        if (count > 0) {
          console.log(`   • ${feature}: ${count}`);
        }
      });

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the analysis
getRecentUserActivity();

