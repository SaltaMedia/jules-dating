const mongoose = require('mongoose');
require('dotenv').config();

const AnalyticsEvent = require('./models/AnalyticsEvent');

async function testAnalyticsFix() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(80));
    console.log('🧪 TESTING ANALYTICS FIX');
    console.log('='.repeat(80));

    // Get counts before (baseline)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const chatEventsBefore = await AnalyticsEvent.countDocuments({
      category: 'chat',
      timestamp: { $gte: oneDayAgo }
    });

    const wardrobeEventsBefore = await AnalyticsEvent.countDocuments({
      category: 'wardrobe',
      timestamp: { $gte: oneDayAgo }
    });

    const fitCheckEventsBefore = await AnalyticsEvent.countDocuments({
      category: 'fit_check',
      timestamp: { $gte: oneDayAgo }
    });

    console.log('\n📊 ANALYTICS EVENTS (Last 24 Hours)\n');
    console.log(`Chat events: ${chatEventsBefore}`);
    console.log(`Wardrobe events: ${wardrobeEventsBefore}`);
    console.log(`Fit check events: ${fitCheckEventsBefore}`);
    console.log(`Total: ${chatEventsBefore + wardrobeEventsBefore + fitCheckEventsBefore}`);

    console.log('\n' + '-'.repeat(80));
    console.log('\n🔍 RECENT EVENTS (Last 10)\n');

    const recentEvents = await AnalyticsEvent.find()
      .sort({ timestamp: -1 })
      .limit(10);

    if (recentEvents.length === 0) {
      console.log('⚠️  No recent analytics events found.');
      console.log('\n💡 This means either:');
      console.log('   1. No user activity since the fix was deployed');
      console.log('   2. The server needs to be restarted');
      console.log('   3. Analytics is not enabled in .env');
      console.log('\n✅ Fix instructions:');
      console.log('   1. Restart the server: pm2 restart jules-backend');
      console.log('   2. Perform some actions (chat, fit check, add wardrobe item)');
      console.log('   3. Run this test again');
    } else {
      recentEvents.forEach((event, idx) => {
        const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000 / 60);
        console.log(`${idx + 1}. [${timeAgo}m ago] ${event.category} - ${event.action}`);
        console.log(`   User: ${event.userId}, Session: ${event.sessionId.substring(0, 20)}...`);
        if (event.properties && Object.keys(event.properties).length > 0) {
          const props = Object.entries(event.properties).slice(0, 3);
          console.log(`   Props: ${props.map(([k, v]) => `${k}=${v}`).join(', ')}`);
        }
        console.log();
      });
    }

    console.log('-'.repeat(80));
    console.log('\n📈 EVENT BREAKDOWN (Last 24 hours)\n');

    const eventsByCategory = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: { category: '$category', action: '$action' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    if (eventsByCategory.length === 0) {
      console.log('No events in the last 24 hours.');
    } else {
      eventsByCategory.forEach(item => {
        console.log(`   ${item._id.category}/${item._id.action}: ${item.count}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ TEST COMPLETE\n');

    // Check if chat tracking is working
    const hasChatEvents = chatEventsBefore > 0;
    const hasWardrobeEvents = wardrobeEventsBefore > 0;

    console.log('🔎 FIX VERIFICATION:\n');
    console.log(`   Chat tracking: ${hasChatEvents ? '✅ WORKING' : '⚠️  No events yet (test after using chat)'}`);
    console.log(`   Wardrobe tracking: ${hasWardrobeEvents ? '✅ WORKING' : '⚠️  No events yet (test after adding items)'}`);
    console.log(`   Fit check tracking: ${fitCheckEventsBefore > 0 ? '✅ WORKING' : '⚠️  No events yet (test after fit check)'}`);

    if (!hasChatEvents || !hasWardrobeEvents) {
      console.log('\n💡 TO TEST THE FIX:');
      console.log('   1. Make sure the server is running with the updated code');
      console.log('   2. Log into the app');
      console.log('   3. Send a chat message');
      console.log('   4. Add a wardrobe item or do a fit check');
      console.log('   5. Run this test again: node test-analytics-fix.js');
      console.log('\n   You should see new chat and wardrobe events appear!');
    }

    console.log('\n' + '='.repeat(80));

    // Show environment config
    console.log('\n⚙️  CONFIGURATION:\n');
    console.log(`   FEATURE_ANALYTICS: ${process.env.FEATURE_ANALYTICS || 'not set'}`);
    console.log(`   ANALYTICS_DRY_RUN: ${process.env.ANALYTICS_DRY_RUN || 'not set'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

    if (process.env.FEATURE_ANALYTICS !== 'true') {
      console.log('\n❌ WARNING: FEATURE_ANALYTICS is not set to "true" in .env');
      console.log('   Analytics will not be tracked!');
      console.log('   Fix: Add "FEATURE_ANALYTICS=true" to backend/.env');
    }

    if (process.env.ANALYTICS_DRY_RUN === 'true') {
      console.log('\n⚠️  WARNING: ANALYTICS_DRY_RUN is set to "true"');
      console.log('   Events will be logged to file but not saved to database!');
      console.log('   Fix: Change to "ANALYTICS_DRY_RUN=false" in backend/.env');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the test
testAnalyticsFix();

