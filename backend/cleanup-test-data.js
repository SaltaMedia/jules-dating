const mongoose = require('mongoose');
const User = require('./models/User');
const UserSession = require('./models/UserSession');
const AnalyticsEvent = require('./models/AnalyticsEvent');
const ChatAnalytics = require('./models/ChatAnalytics');

require('dotenv').config();

async function cleanupTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Define test email patterns to remove - BE VERY CAREFUL WITH THESE PATTERNS
    const testEmailPatterns = [
      /^testuser\d+@example\.com$/,
      /^test@example\.com$/,
      /^test@test\.com$/,
      /^test@jules\.com$/,
      /^demo@example\.com$/,
      /^valid@example\.com$/,
      /^onboarding-test@example\.com$/,
      /^onbaording-test@example\.com$/,
      /^test\d+@example\.com$/,
      /^newuser@example\.com$/,
      // REMOVED: /^admin@example\.com$/ - This was too broad and could match real users
      /^test.*@juleslabs\.com$/,  // Only test users at juleslabs.com
      /^mock-test@juleslabs\.com$/,
      /^welcome-test@juleslabs\.com$/,
      /^testerstevetester@juleslabs\.com$/
    ];

    // Find all users
    const allUsers = await User.find({});
    console.log(`Total users in database: ${allUsers.length}`);

    // Identify test users
    const testUsers = allUsers.filter(user => {
      return testEmailPatterns.some(pattern => pattern.test(user.email));
    });

    const realUsers = allUsers.filter(user => {
      return !testEmailPatterns.some(pattern => pattern.test(user.email));
    });

    console.log(`\nTest users to remove: ${testUsers.length}`);
    console.log(`Real users to keep: ${realUsers.length}`);

    // Show real users
    console.log('\nReal users to keep:');
    realUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'}) - Admin: ${user.isAdmin}`);
    });

    // Show test users that will be removed
    console.log('\nTest users to remove:');
    testUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'})`);
    });

    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete test data!');
    console.log('⚠️  CRITICAL: Review the users above carefully before proceeding!');
    console.log('⚠️  Make sure NO real users are in the "Test users to remove" list!');
    console.log('\nType "YES" to confirm deletion:');
    
    // For safety, let's not auto-delete anymore
    console.log('\n🛑 SAFETY CHECK: This script will NOT auto-delete users.');
    console.log('🛑 Please manually review the lists above and run deletion manually if needed.');
    console.log('🛑 To actually delete, uncomment the deletion code below.');
    
    return; // Exit early for safety
    
    // Delete test data (commented out for safety)
    console.log('\n🗑️  DELETING TEST DATA...');
    
    if (testUsers.length > 0) {
      const testUserIds = testUsers.map(user => user._id);
      
      // Delete test users
      await User.deleteMany({ _id: { $in: testUserIds } });
      console.log(`✅ Deleted ${testUsers.length} test users`);
      
      // Delete associated analytics data
      await UserSession.deleteMany({ userId: { $in: testUserIds } });
      console.log('✅ Deleted associated user sessions');
      
      await AnalyticsEvent.deleteMany({ userId: { $in: testUserIds } });
      console.log('✅ Deleted associated analytics events');
      
      await ChatAnalytics.deleteMany({ userId: { $in: testUserIds } });
      console.log('✅ Deleted associated chat analytics');
    }

    // Show final count
    const remainingUsers = await User.find({});
    console.log(`\n📊 Final user count: ${remainingUsers.length}`);
    
    console.log('\nReal users remaining:');
    remainingUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name || 'No name'}) - Admin: ${user.isAdmin}`);
    });

  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupTestData();
