require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');

async function findUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find a user with onboarding data
    const user = await User.findOne({ 'onboarding.name': { $exists: true, $ne: '' } });
    
    if (user) {
      console.log('Found user:', {
        id: user._id,
        name: user.onboarding?.name,
        email: user.email,
        hasOnboarding: !!user.onboarding
      });
    } else {
      console.log('No users with onboarding data found');
    }

    // Also check UserProfile
    const profile = await UserProfile.findOne();
    if (profile) {
      console.log('Found UserProfile:', {
        userId: profile.userId,
        name: profile.name,
        hasStyleProfile: !!profile.styleProfile
      });
    } else {
      console.log('No UserProfile found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

findUser();
