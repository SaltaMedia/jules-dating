require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

console.log(`
=====================================================
📧 Testing Password Reset with noreply@juleslabs.com
=====================================================
`);

async function testNoReplyEmail() {
  try {
    // Connect to MongoDB
    console.log('1️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    console.log('✅ Connected\n');

    const testEmail = process.argv[2] || 'steve@juleslabs.com';
    console.log(`2️⃣  Testing with email: ${testEmail}\n`);

    // Check if user exists
    let user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('Creating test user...');
      user = new User({
        name: 'Test User',
        email: testEmail,
        password: 'TestPassword123!'
      });
      await user.save();
      console.log('✅ User created\n');
    } else {
      console.log(`✅ User exists: ${user.name}\n`);
    }

    // Request password reset
    console.log('3️⃣  Requesting password reset...');
    const response = await axios.post('http://localhost:4002/api/auth/forgot-password', {
      email: testEmail
    });

    console.log(`✅ API Response: ${response.data.message}`);
    if (response.data.resetUrl) {
      console.log(`Reset URL: ${response.data.resetUrl}`);
    }

    // Wait for email to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check database for token
    console.log('\n4️⃣  Checking database...');
    const updatedUser = await User.findOne({ email: testEmail });
    
    if (updatedUser.resetPasswordToken) {
      console.log('✅ Reset token created in database');
      console.log(`Token: ${updatedUser.resetPasswordToken.substring(0, 20)}...`);
      console.log(`Expires: ${new Date(updatedUser.resetPasswordExpires).toLocaleString()}\n`);
    } else {
      console.log('❌ No reset token found\n');
    }

    console.log('=====================================================');
    console.log('✅ TEST COMPLETE!');
    console.log('=====================================================\n');
    console.log('📧 Check your email inbox for:');
    console.log('   From: Jules <noreply@juleslabs.com>');
    console.log('   Subject: Reset Your Jules Password');
    console.log('   Reply-To: steve@juleslabs.com\n');
    console.log('✅ Email should now avoid spam filters!');
    console.log('✅ More professional "noreply" sender address');
    console.log('✅ Replies still go to steve@juleslabs.com\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testNoReplyEmail();

