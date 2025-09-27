#!/usr/bin/env node

/**
 * Query All Users - Jules Dating Database
 * 
 * This script connects to the jules-dating database and retrieves all users
 * with their key information for analysis.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import the User model
const User = require('./models/User');

async function queryAllUsers() {
  try {
    console.log('🔍 Jules Dating - User Database Query');
    console.log('=====================================');
    
    // Connect to database
    let MONGODB_URI = process.env.MONGODB_URI;
    const atlasUri = process.env.MONGODB_URI;
    
    if (atlasUri && atlasUri.includes('mongodb+srv://')) {
      if (!atlasUri.includes('/jules_dating')) {
        MONGODB_URI = atlasUri.replace('mongodb.net/?', 'mongodb.net/jules_dating?');
        console.log('🔧 Fixed Atlas URI with database name:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      } else {
        MONGODB_URI = atlasUri;
        console.log('✅ Atlas URI already has database name:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
      }
    } else {
      MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating';
      console.log('🔧 Using local MongoDB URI:', MONGODB_URI);
    }
    
    console.log('📡 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to database: ${dbName}`);
    console.log('');
    
    // Query all users
    console.log('👥 Fetching all users...');
    const users = await User.find({}).sort({ createdAt: -1 });
    
    console.log(`📊 Total Users Found: ${users.length}`);
    console.log('');
    
    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      return;
    }
    
    // Display user summary
    console.log('📋 USER SUMMARY');
    console.log('===============');
    
    // Basic stats
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.isAdmin).length;
    const googleUsers = users.filter(u => u.googleId).length;
    const emailUsers = users.filter(u => !u.googleId).length;
    const completedOnboarding = users.filter(u => u.onboarding?.completed).length;
    
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Admin Users: ${adminUsers}`);
    console.log(`Google OAuth Users: ${googleUsers}`);
    console.log(`Email/Password Users: ${emailUsers}`);
    console.log(`Completed Onboarding: ${completedOnboarding}`);
    console.log('');
    
    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = users.filter(u => u.createdAt > sevenDaysAgo);
    console.log(`Recent Signups (7 days): ${recentSignups.length}`);
    console.log('');
    
    // Display all users
    console.log('👤 ALL USERS DETAILS');
    console.log('====================');
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()} ${user.createdAt.toLocaleTimeString()}`);
      console.log(`   Last Active: ${user.lastActive ? user.lastActive.toLocaleDateString() : 'Never'}`);
      console.log(`   Auth Method: ${user.googleId ? 'Google OAuth' : 'Email/Password'}`);
      console.log(`   Admin: ${user.isAdmin ? 'Yes' : 'No'}`);
      console.log(`   Onboarding: ${user.onboarding?.completed ? 'Completed' : 'Incomplete'}`);
      
      // Show key onboarding data if available
      if (user.onboarding) {
        if (user.onboarding.zipCode) console.log(`   Location: ${user.onboarding.zipCode}`);
        if (user.onboarding.bodyType) console.log(`   Body Type: ${user.onboarding.bodyType}`);
        if (user.onboarding.relationshipStatus) console.log(`   Status: ${user.onboarding.relationshipStatus}`);
        if (user.onboarding.monthlyClothingBudget) console.log(`   Budget: ${user.onboarding.monthlyClothingBudget}`);
        if (user.onboarding.preferredStyles && user.onboarding.preferredStyles.length > 0) {
          console.log(`   Styles: ${user.onboarding.preferredStyles.join(', ')}`);
        }
      }
      
      // Show consent preferences
      if (user.consentPreferences) {
        const consents = [];
        if (user.consentPreferences.analytics) consents.push('Analytics');
        if (user.consentPreferences.marketing) consents.push('Marketing');
        if (user.consentPreferences.functional) consents.push('Functional');
        if (consents.length > 0) {
          console.log(`   Consents: ${consents.join(', ')}`);
        }
      }
    });
    
    console.log('\n📈 ANALYTICS BREAKDOWN');
    console.log('======================');
    
    // Onboarding completion rate
    const onboardingRate = totalUsers > 0 ? ((completedOnboarding / totalUsers) * 100).toFixed(1) : 0;
    console.log(`Onboarding Completion Rate: ${onboardingRate}%`);
    
    // Auth method distribution
    const googleRate = totalUsers > 0 ? ((googleUsers / totalUsers) * 100).toFixed(1) : 0;
    const emailRate = totalUsers > 0 ? ((emailUsers / totalUsers) * 100).toFixed(1) : 0;
    console.log(`Google OAuth Usage: ${googleRate}%`);
    console.log(`Email/Password Usage: ${emailRate}%`);
    
    // Recent activity
    const recentActivity = users.filter(u => {
      if (!u.lastActive) return false;
      const daysSinceActive = (Date.now() - u.lastActive.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive <= 7;
    }).length;
    const activityRate = totalUsers > 0 ? ((recentActivity / totalUsers) * 100).toFixed(1) : 0;
    console.log(`Active Users (7 days): ${recentActivity} (${activityRate}%)`);
    
    console.log('\n✅ User query completed successfully!');
    
  } catch (error) {
    console.error('❌ Error querying users:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed.');
    }
  }
}

// Run the query
if (require.main === module) {
  queryAllUsers()
    .then(() => {
      console.log('\n🎉 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { queryAllUsers };
