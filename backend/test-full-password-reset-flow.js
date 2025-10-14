require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Test with a real user email that you can receive
const TEST_EMAIL = process.argv[2] || 'steve@juleslabs.com';
const API_URL = process.env.API_URL || 'http://localhost:4002';

console.log(`
==============================================
🔒 COMPLETE PASSWORD RESET FLOW TEST
==============================================

Email: ${TEST_EMAIL}
API URL: ${API_URL}

`);

async function runTest() {
  try {
    // 1. Connect to MongoDB
    console.log('1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    console.log('✅ Connected\n');

    // 2. Check if user exists
    console.log('2️⃣  Checking if user exists...');
    let user = await User.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log(`❌ User not found: ${TEST_EMAIL}`);
      console.log('Creating test user...');
      user = new User({
        name: 'Test User',
        email: TEST_EMAIL,
        password: 'OldPassword123!'
      });
      await user.save();
      console.log('✅ Test user created\n');
    } else {
      console.log(`✅ User found: ${user.name} (${user.email})\n`);
    }

    // 3. Call forgot-password API
    console.log('3️⃣  Calling forgot-password API...');
    console.log(`POST ${API_URL}/api/auth/forgot-password`);
    
    const forgotResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    console.log(`✅ Response: ${forgotResponse.data.message}`);
    if (forgotResponse.data.resetUrl) {
      console.log(`📧 Reset URL: ${forgotResponse.data.resetUrl}\n`);
    } else {
      console.log('📧 Check your email for the reset link\n');
    }

    // 4. Wait a moment then check database
    console.log('4️⃣  Checking database for reset token...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userWithToken = await User.findOne({ email: TEST_EMAIL });
    console.log(`User ID: ${userWithToken._id}`);
    console.log(`Has reset token: ${userWithToken.resetPasswordToken ? 'YES' : 'NO'}`);
    
    if (userWithToken.resetPasswordToken) {
      console.log(`Token: ${userWithToken.resetPasswordToken.substring(0, 20)}...`);
      console.log(`Expires: ${new Date(userWithToken.resetPasswordExpires).toLocaleString()}`);
      
      const resetToken = userWithToken.resetPasswordToken;
      
      console.log('\n5️⃣  Testing reset-password API...');
      const newPassword = 'NewTestPassword456!';
      
      const resetResponse = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token: resetToken,
        password: newPassword
      });
      
      console.log(`✅ ${resetResponse.data.message}`);
      
      console.log('\n6️⃣  Testing login with new password...');
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: TEST_EMAIL,
        password: newPassword
      });
      
      if (loginResponse.data.token) {
        console.log('✅ Login successful with new password!');
        console.log(`JWT Token: ${loginResponse.data.token.substring(0, 30)}...\n`);
      }
      
      console.log('\n==============================================');
      console.log('✅ ALL TESTS PASSED!');
      console.log('==============================================\n');
      
      console.log('✅ Password reset email sent');
      console.log('✅ Reset token created');
      console.log('✅ Password updated successfully');
      console.log('✅ Login works with new password\n');
      
    } else {
      console.log('❌ NO RESET TOKEN FOUND!');
      console.log('\nThis means the forgotPassword controller is not creating the token.');
      console.log('Possible issues:');
      console.log('- User lookup failing');
      console.log('- Save operation failing');
      console.log('- Logic error in controller\n');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

runTest();

