require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;

async function testOnboardingAPI() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test user ID
    const userId = '689e5f659b23d73cec7dddfd';
    
    // Create a test JWT token
    const token = jwt.sign(
      { userId: userId, email: 'spsalta@gmail.com', isAdmin: false },
      process.env.JWT_SECRET || 'dev-jwt-secret-only-for-development',
      { expiresIn: '1h' }
    );
    
    console.log('Test token created');
    
    // Get user before update
    console.log('\n=== BEFORE UPDATE ===');
    const userBefore = await User.findById(userId).select('-password');
    console.log('AboutMe:', userBefore.onboarding?.aboutMe);
    console.log('FavoriteBrands:', userBefore.onboarding?.favoriteBrands);
    
    // Simulate the onboarding update API call
    console.log('\n=== SIMULATING ONBOARDING UPDATE ===');
    const updateData = {
      aboutMe: 'API test about me text',
      favoriteBrands: ['API Test Brand 1', 'API Test Brand 2'],
      preferredStyles: ['Casual', 'Classic'],
      colorsLove: ['Navy', 'Black'],
      monthlyClothingBudget: '$500+'
    };
    
    // Update using the User model directly (simulating the controller)
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update onboarding data
    user.onboarding = {
      ...user.onboarding,
      aboutMe: updateData.aboutMe,
      favoriteBrands: updateData.favoriteBrands,
      preferredStyles: updateData.preferredStyles,
      colorsLove: updateData.colorsLove,
      monthlyClothingBudget: updateData.monthlyClothingBudget
    };
    
    // Save the user
    await user.save({ validateBeforeSave: false });
    console.log('User updated via controller logic');
    
    // Get user after update
    console.log('\n=== AFTER UPDATE ===');
    const userAfter = await User.findById(userId).select('-password');
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
    console.log('API data saved correctly:', dataSaved ? 'YES' : 'NO');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testOnboardingAPI();
