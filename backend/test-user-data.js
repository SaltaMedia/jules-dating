require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testUserData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with onboarding data
    const users = await User.find({ 'onboarding.name': { $exists: true, $ne: '' } });
    
    console.log(`Found ${users.length} users with onboarding data:`);
    
    users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1} ---`);
      console.log('ID:', user._id);
      console.log('Name:', user.onboarding?.name);
      console.log('Email:', user.email);
      console.log('Preferred Styles:', user.onboarding?.preferredStyles);
      console.log('Colors Love:', user.onboarding?.colorsLove);
      console.log('Budget:', user.onboarding?.monthlyClothingBudget);
      console.log('Fit Preference:', user.onboarding?.fitPreference);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testUserData();
