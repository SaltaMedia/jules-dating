require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./utils/emailService');

async function testForgotPasswordDirect() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    console.log('✅ Connected\n');

    const testEmail = `direct-test-${Date.now()}@example.com`;
    
    // Create user
    console.log('Creating test user...');
    const user = new User({
      name: 'Direct Test User',
      email: testEmail,
      password: 'TestPassword123!'
    });
    await user.save();
    console.log(`✅ User created: ${testEmail}\n`);

    // Simulate forgot password logic
    console.log('Simulating forgot password logic...');
    const foundUser = await User.findOne({ email: testEmail });
    console.log(`Found user: ${foundUser ? 'YES' : 'NO'}`);
    console.log(`User ID: ${foundUser._id}`);
    console.log(`User email: ${foundUser.email}\n`);

    // Generate token
    console.log('Generating reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000;
    console.log(`Token: ${resetToken.substring(0, 20)}...`);
    console.log(`Expires: ${new Date(resetTokenExpiry).toLocaleString()}\n`);

    // Save to user
    console.log('Saving token to user...');
    foundUser.resetPasswordToken = resetToken;
    foundUser.resetPasswordExpires = resetTokenExpiry;
    await foundUser.save();
    console.log('✅ Token saved\n');

    // Verify token was saved
    console.log('Verifying token in database...');
    const userWithToken = await User.findOne({ email: testEmail });
    console.log(`Reset Token in DB: ${userWithToken.resetPasswordToken ? 'YES' : 'NO'}`);
    console.log(`Token Value: ${userWithToken.resetPasswordToken?.substring(0, 20)}...`);
    console.log(`Token Expiry: ${userWithToken.resetPasswordExpires}\n`);

    // Try querying like the API does
    console.log('Testing query with expiry check...');
    const userWithValidToken = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    console.log(`Found with query: ${userWithValidToken ? 'YES' : 'NO'}\n`);

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('✅ Test passed - cleanup complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testForgotPasswordDirect();

