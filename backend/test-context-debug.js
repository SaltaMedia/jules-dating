require('dotenv').config();
const mongoose = require('mongoose');
const UserProfile = require('./models/UserProfile');
const User = require('./models/User');
const UserContextCache = require('./utils/userContextCache');

async function testContextLoading() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test with a real user ID - you'll need to replace this with an actual user ID
    const testUserId = process.argv[2];
    
    if (!testUserId) {
      console.log('Please provide a user ID as an argument');
      console.log('Usage: node test-context-debug.js <userId>');
      return;
    }

    console.log(`Testing context loading for user: ${testUserId}`);

    // Check if user exists in UserProfile
    const profile = await UserProfile.findOne({ userId: testUserId });
    console.log('UserProfile found:', !!profile);
    
    if (profile) {
      console.log('Profile data:', {
        name: profile.name,
        stylePreferences: profile.styleProfile?.preferredStyles,
        budget: profile.lifestyle?.monthlyClothingBudget,
        environments: profile.lifestyle?.primaryEnvironments
      });
    }

    // Check if user exists in User model (legacy)
    const user = await User.findById(testUserId);
    console.log('User (legacy) found:', !!user);
    
    if (user) {
      console.log('User onboarding data:', {
        name: user.onboarding?.name,
        preferredStyles: user.onboarding?.preferredStyles,
        colorsLove: user.onboarding?.colorsLove,
        budget: user.onboarding?.monthlyClothingBudget
      });
    }

    // Test context loading
    console.log('\n--- Testing UserContextCache ---');
    const context = await UserContextCache.getUserContext(testUserId);
    console.log('Context loaded:', !!context);
    console.log('Context length:', context?.length || 0);
    console.log('Context preview:', context?.substring(0, 200) + '...');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testContextLoading();
