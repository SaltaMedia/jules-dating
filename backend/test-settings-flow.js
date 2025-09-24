require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function testSettingsFlow() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test user ID
    const userId = '689e5f659b23d73cec7dddfd';
    
    // Get user before update
    console.log('\n=== BEFORE UPDATE ===');
    const userBefore = await User.findById(userId).select('-password');
    console.log('Onboarding completed:', userBefore.onboarding?.completed);
    console.log('AboutMe:', userBefore.onboarding?.aboutMe);
    console.log('FavoriteBrands:', userBefore.onboarding?.favoriteBrands);
    
    // Simulate updating settings
    console.log('\n=== UPDATING SETTINGS ===');
    const updateData = {
      aboutMe: 'Updated about me text for testing',
      favoriteBrands: ['Nike', 'Adidas', 'Uniqlo'],
      preferredStyles: ['Casual', 'Athletic'],
      colorsLove: ['Navy', 'Black', 'White'],
      monthlyClothingBudget: '$250 - $500'
    };
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        'onboarding.aboutMe': updateData.aboutMe,
        'onboarding.favoriteBrands': updateData.favoriteBrands,
        'onboarding.preferredStyles': updateData.preferredStyles,
        'onboarding.colorsLove': updateData.colorsLove,
        'onboarding.monthlyClothingBudget': updateData.monthlyClothingBudget
      },
      { new: true }
    ).select('-password');
    
    console.log('Settings updated successfully');
    
    // Get user after update
    console.log('\n=== AFTER UPDATE ===');
    const userAfter = await User.findById(userId).select('-password');
    console.log('Onboarding completed:', userAfter.onboarding?.completed);
    console.log('AboutMe:', userAfter.onboarding?.aboutMe);
    console.log('FavoriteBrands:', userAfter.onboarding?.favoriteBrands);
    console.log('PreferredStyles:', userAfter.onboarding?.preferredStyles);
    console.log('ColorsLove:', userAfter.onboarding?.colorsLove);
    console.log('MonthlyClothingBudget:', userAfter.onboarding?.monthlyClothingBudget);
    
    // Verify the data was saved correctly
    const dataSaved = 
      userAfter.onboarding?.aboutMe === updateData.aboutMe &&
      JSON.stringify(userAfter.onboarding?.favoriteBrands) === JSON.stringify(updateData.favoriteBrands) &&
      JSON.stringify(userAfter.onboarding?.preferredStyles) === JSON.stringify(updateData.preferredStyles) &&
      JSON.stringify(userAfter.onboarding?.colorsLove) === JSON.stringify(updateData.colorsLove) &&
      userAfter.onboarding?.monthlyClothingBudget === updateData.monthlyClothingBudget;
    
    console.log('\n=== VERIFICATION ===');
    console.log('Data saved correctly:', dataSaved ? 'YES' : 'NO');
    
    if (!dataSaved) {
      console.log('Issues found:');
      if (userAfter.onboarding?.aboutMe !== updateData.aboutMe) {
        console.log('- AboutMe mismatch');
      }
      if (JSON.stringify(userAfter.onboarding?.favoriteBrands) !== JSON.stringify(updateData.favoriteBrands)) {
        console.log('- FavoriteBrands mismatch');
      }
      if (JSON.stringify(userAfter.onboarding?.preferredStyles) !== JSON.stringify(updateData.preferredStyles)) {
        console.log('- PreferredStyles mismatch');
      }
      if (JSON.stringify(userAfter.onboarding?.colorsLove) !== JSON.stringify(updateData.colorsLove)) {
        console.log('- ColorsLove mismatch');
      }
      if (userAfter.onboarding?.monthlyClothingBudget !== updateData.monthlyClothingBudget) {
        console.log('- MonthlyClothingBudget mismatch');
      }
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testSettingsFlow();
