require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function checkUser() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'spsalta@gmail.com' });
    
    if (user) {
      console.log('User found:');
      console.log('- ID:', user._id);
      console.log('- Email:', user.email);
      console.log('- Has password:', !!user.password);
      console.log('- Google ID:', user.googleId);
      console.log('- Name:', user.name);
    } else {
      console.log('User not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkUser();
