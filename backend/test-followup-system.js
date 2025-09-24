require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { sendFollowUpEmail } = require('./utils/emailService');

async function testFollowUpSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating');
    console.log('✅ Connected to MongoDB');

    // Create a test user with follow-up email scheduled for now (immediate)
    const testUser = new User({
      name: 'Test User',
      email: 'steve@saltamediaco.com',
      password: 'testpassword',
      followUpEmailSent: false,
      followUpEmailScheduled: new Date() // Schedule for now
    });

    await testUser.save();
    console.log('✅ Test user created with immediate follow-up email scheduled');

    // Test sending follow-up email
    console.log('📧 Testing follow-up email...');
    const emailSent = await sendFollowUpEmail(testUser.email, testUser.name);
    
    if (emailSent) {
      console.log('✅ Follow-up email sent successfully!');
      
      // Mark as sent
      await User.findByIdAndUpdate(testUser._id, {
        followUpEmailSent: true
      });
      console.log('✅ User marked as follow-up email sent');
    } else {
      console.log('❌ Failed to send follow-up email');
    }

    // Clean up test user
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user cleaned up');

  } catch (error) {
    console.error('❌ Error testing follow-up system:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testFollowUpSystem();
