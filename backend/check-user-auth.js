require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({email: 'spsalta@gmail.com'});
    
    if (user) {
      console.log('User found:', user.email);
      console.log('Has password:', !!user.password);
      console.log('Google ID:', user.googleId);
      console.log('Onboarding completed:', user.onboarding?.completed);
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkUserAuth();
