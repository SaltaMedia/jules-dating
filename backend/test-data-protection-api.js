const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testDataProtectionViaAPI() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    console.log('\n🛡️ Testing Data Protection System via API...');

    // 1. Create a test user
    const testUser = await User.create({
      email: 'test-protection-api@example.com',
      name: 'Test Protection API User',
      password: 'password123',
    });
    console.log('✅ Created test user: test-protection-api@example.com');

    // 2. Create a test user with a "real" email pattern
    const realEmailTestUser = await User.create({
      email: 'test-real-api@gmail.com',
      name: 'Test Real API User',
      password: 'password123',
    });
    console.log('✅ Created real email test user: test-real-api@gmail.com');

    console.log('\n📋 Test users created. Now trigger deletions via API...');
    console.log('📋 The server middleware should detect these deletions and send alerts.');
    console.log('📋 Check server logs and email for alerts!');

    // Note: We're not deleting here - the user should trigger deletions via API
    // or the server middleware will catch any programmatic deletions

    console.log('\n🎯 Data Protection Test Setup Complete!');
    console.log('📋 Next steps:');
    console.log('   1. Check server logs for any alerts');
    console.log('   2. Trigger deletions via API or admin interface');
    console.log('   3. Check email for alerts');

  } catch (error) {
    console.error('❌ Error during data protection test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDataProtectionViaAPI();
