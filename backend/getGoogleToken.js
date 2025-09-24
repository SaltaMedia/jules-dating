require('dotenv').config();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI;

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

async function getGoogleToken() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'spsalta@gmail.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    // Generate JWT token for Google OAuth user
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      getJWTSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('✅ JWT Token generated for Google OAuth user:');
    console.log('🔑 Token:', token);
    console.log('\nTo use this token in the frontend:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to Application/Storage tab');
    console.log('3. Set localStorage.token = "' + token + '"');
    console.log('4. Refresh the page');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

getGoogleToken();
