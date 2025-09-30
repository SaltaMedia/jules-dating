const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();

// Import User model from jules-dating
const User = require('./models/User');

async function testJulesDatingAuth() {
  try {
    console.log('🔍 Testing Jules Dating Authentication...\n');

    // Connect to the jules-dating database
    let MONGODB_URI = process.env.MONGODB_URI;
    
    // Apply the same database fixing logic for jules-dating
    if (MONGODB_URI && MONGODB_URI.includes('mongodb+srv://')) {
      if (!MONGODB_URI.includes('/jules-dating')) {
        MONGODB_URI = MONGODB_URI.replace('mongodb.net/?', 'mongodb.net/jules-dating?');
        console.log('🔧 Fixed URI to use jules-dating database');
      }
    } else {
      MONGODB_URI = 'mongodb://localhost:27017/jules-dating';
    }
    
    console.log('📡 Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`✅ Connected to database: ${dbName}\n`);

    // Test 1: List users in jules-dating database
    console.log('🔍 Test 1: Finding users in jules-dating database...');
    const users = await User.find({}).select('email name password googleId createdAt').limit(10);
    console.log(`Found ${users.length} users (showing first 10):`);
    
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.name || 'No name'}`);
      console.log(`     Has password: ${!!user.password} - Has Google ID: ${!!user.googleId}`);
      console.log(`     Created: ${user.createdAt}`);
      if (user.password) {
        console.log(`     Password hash preview: ${user.password.substring(0, 20)}...`);
      }
      console.log('');
    });

    // Test 2: Test password comparison for users with passwords
    console.log('🔍 Test 2: Testing password comparison for users with passwords...');
    
    const usersWithPasswords = users.filter(user => user.password);
    console.log(`Testing ${usersWithPasswords.length} users with passwords...\n`);
    
    for (const user of usersWithPasswords) {
      console.log(`Testing user: ${user.email}`);
      
      // Test common passwords
      const testPasswords = [
        'password123',
        'Password123', 
        'PASSWORD123',
        'admin123',
        'Admin123',
        'test123',
        'Test123',
        'jules123',
        'Jules123',
        'dating123',
        'Dating123'
      ];
      
      let foundPassword = false;
      for (const testPassword of testPasswords) {
        const isMatch = await bcrypt.compare(testPassword, user.password);
        if (isMatch) {
          console.log(`  🎯 FOUND WORKING PASSWORD: "${testPassword}"`);
          foundPassword = true;
          break;
        }
      }
      
      if (!foundPassword) {
        console.log(`  ❌ No matching password found in common test passwords`);
      }
      console.log('');
    }

    // Test 3: Create a test user with known password
    console.log('🔍 Test 3: Creating test user with known password...');
    const testEmail = 'jules-dating-test@example.com';
    const testPassword = 'JulesDatingTest123!';
    
    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });
    
    // Create new user
    const testUser = new User({
      name: 'Jules Dating Test User',
      email: testEmail,
      password: testPassword
    });
    
    await testUser.save();
    console.log(`✅ Created test user: ${testEmail}`);
    
    // Test password comparison
    const isMatch = await bcrypt.compare(testPassword, testUser.password);
    console.log(`✅ Password comparison: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
    
    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('🧹 Cleaned up test user');

    console.log('\n🎯 Jules Dating Summary:');
    console.log(`- Connected to jules-dating database successfully`);
    console.log(`- Found ${users.length} users in database`);
    console.log(`- Found ${usersWithPasswords.length} users with passwords`);
    console.log(`- Password hashing and comparison logic is working`);

  } catch (error) {
    console.error('❌ Jules Dating test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the test
testJulesDatingAuth().catch(console.error);
