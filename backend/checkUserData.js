require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUserData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'spsalta@gmail.com' });
    
    if (user) {
      console.log('User found:');
      console.log('- ID:', user._id);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- Has password:', !!user.password);
      console.log('- Google ID:', user.googleId);
      
      console.log('\n=== ONBOARDING DATA ===');
      console.log('- Onboarding completed:', user.onboarding?.completed);
      console.log('- Onboarding object:', JSON.stringify(user.onboarding, null, 2));
      
      console.log('\n=== SETTINGS DATA ===');
      console.log('- Settings object:', JSON.stringify(user.settings, null, 2));
      
      console.log('\n=== BODY INFO ===');
      console.log('- Body info object:', JSON.stringify(user.bodyInfo, null, 2));
      
      console.log('\n=== STYLE PREFERENCES ===');
      console.log('- Style preferences object:', JSON.stringify(user.stylePreferences, null, 2));
      
      console.log('\n=== PREFERENCES ===');
      console.log('- Preferences object:', JSON.stringify(user.preferences, null, 2));
      
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkUserData();
