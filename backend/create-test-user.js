const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

require('dotenv').config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    const testEmail = 'test@juleslabs.com';
    const testPassword = 'test123';

    let testUser = await User.findOne({ email: testEmail });

    if (testUser) {
      console.log(`✅ Test user ${testEmail} already exists`);
      console.log(`Email: ${testEmail}`);
      console.log(`Password: ${testPassword}`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);

      testUser = new User({
        email: testEmail,
        password: hashedPassword,
        name: 'Test User',
        isVerified: true,
        onboarding: {
          completed: false,
          name: 'Test User',
          email: testEmail
        }
      });
      await testUser.save();
      console.log(`✅ Created test user: ${testEmail}`);
    }

    console.log('\n🧪 Test User Credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log('\n🔗 Test URLs:');
    console.log(`Login: http://localhost:3000/login`);
    console.log(`Onboarding: http://localhost:3000/onboarding`);
    console.log(`Chat: http://localhost:3000/chat`);
    console.log(`Settings: http://localhost:3000/settings`);
    console.log(`Admin Analytics: http://localhost:3000/admin/analytics`);
    console.log('\n📊 To test analytics:');
    console.log('1. Login with test credentials');
    console.log('2. Go through onboarding steps');
    console.log('3. Use the chat feature');
    console.log('4. Check admin analytics dashboard');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
