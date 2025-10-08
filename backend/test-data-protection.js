require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testDataProtection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n🛡️ Testing Data Protection System...');
    
    // Create a test user to delete
    const testUser = new User({
      email: 'test-protection@example.com',
      name: 'Test Protection User',
      password: 'test123'
    });
    
    await testUser.save();
    console.log('✅ Created test user:', testUser.email);
    
    // Wait a moment for the system to register
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Delete the test user (this should trigger the protection system)
    console.log('\n🗑️ Deleting test user (this should trigger alerts)...');
    const result = await User.deleteOne({ _id: testUser._id });
    
    console.log('✅ Deleted test user:', result.deletedCount, 'users');
    
    // Wait for alerts to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 Check the server logs for data protection alerts!');
    console.log('📊 You should see alerts about the user deletion.');
    
    // Test with a real email pattern (this should trigger a critical alert)
    console.log('\n🚨 Testing with real email pattern...');
    
    const realTestUser = new User({
      email: 'test-real@gmail.com',
      name: 'Real Email Test User',
      password: 'test123'
    });
    
    await realTestUser.save();
    console.log('✅ Created real email test user:', realTestUser.email);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('🗑️ Deleting real email user (this should trigger CRITICAL alert)...');
    const realResult = await User.deleteOne({ _id: realTestUser._id });
    
    console.log('✅ Deleted real email user:', realResult.deletedCount, 'users');
    
    console.log('\n🎯 Data Protection Test Complete!');
    console.log('📋 Check the following:');
    console.log('   1. Server logs for deletion alerts');
    console.log('   2. Data protection stats at: http://localhost:4002/api/data-protection/stats');
    console.log('   3. Recent alerts at: http://localhost:4002/api/data-protection/alerts');

  } catch (error) {
    console.error('❌ Error testing data protection:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testDataProtection();
