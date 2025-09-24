require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function testUserData() {
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
      
      console.log('\n=== TESTING FIELD MAPPING ===');
      
      // Test the field mapping logic
      const onboarding = user.onboarding || {};
      
      console.log('zipCode:', onboarding.zipCode || onboarding.cityOrZipCode);
      console.log('topSize:', onboarding.topSize || onboarding.shirtSize);
      console.log('bottomSize:', onboarding.bottomSize || onboarding.pantSize);
      console.log('weeklyEnvironment:', onboarding.weeklyEnvironment || onboarding.jobType);
      console.log('socialEventFrequency:', onboarding.socialEventFrequency || onboarding.socialLife);
      console.log('preferredStyles:', onboarding.preferredStyles || onboarding.styleVibes);
      console.log('noGoItems:', onboarding.noGoItems || onboarding.itemsYouHate);
      
      console.log('\n=== ORIGINAL DATA ===');
      console.log('cityOrZipCode:', onboarding.cityOrZipCode);
      console.log('shirtSize:', onboarding.shirtSize);
      console.log('pantSize:', onboarding.pantSize);
      console.log('jobType:', onboarding.jobType);
      console.log('socialLife:', onboarding.socialLife);
      console.log('styleVibes:', onboarding.styleVibes);
      console.log('itemsYouHate:', onboarding.itemsYouHate);
      
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testUserData();
