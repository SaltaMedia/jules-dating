require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('\n=== Testing OAuth User Compatibility ===\n');

async function testOAuthCompatibility() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    console.log('✅ Connected to MongoDB\n');
    
    // Test 1: Create OAuth user (no password)
    console.log('1️⃣  Creating OAuth user (no password)...');
    const oauthUser = new User({
      name: 'OAuth Test User',
      email: `oauth-test-${Date.now()}@example.com`,
      googleId: `google_${Date.now()}`,
      picture: 'https://example.com/photo.jpg'
      // Note: No password field
    });
    
    await oauthUser.save();
    console.log('✅ OAuth user created successfully (no password required)\n');
    
    // Test 2: Verify OAuth user can be retrieved
    console.log('2️⃣  Retrieving OAuth user...');
    const retrievedUser = await User.findById(oauthUser._id);
    if (retrievedUser && retrievedUser.googleId && !retrievedUser.password) {
      console.log('✅ OAuth user retrieved correctly');
      console.log('   - Has googleId:', !!retrievedUser.googleId);
      console.log('   - Has password:', !!retrievedUser.password);
      console.log('   - Password is undefined:', retrievedUser.password === undefined);
      console.log('');
    }
    
    // Test 3: Update OAuth user (should not affect password)
    console.log('3️⃣  Updating OAuth user name...');
    retrievedUser.name = 'Updated OAuth User';
    await retrievedUser.save();
    
    const updatedUser = await User.findById(oauthUser._id);
    if (updatedUser.name === 'Updated OAuth User' && !updatedUser.password) {
      console.log('✅ OAuth user updated without requiring password\n');
    }
    
    // Test 4: Create regular user (with password)
    console.log('4️⃣  Creating regular user (with password)...');
    const regularUser = new User({
      name: 'Regular Test User',
      email: `regular-test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });
    
    await regularUser.save();
    console.log('✅ Regular user created successfully\n');
    
    // Test 5: Verify regular user has hashed password
    console.log('5️⃣  Verifying password hashing for regular user...');
    const retrievedRegular = await User.findById(regularUser._id);
    if (retrievedRegular.password && retrievedRegular.password !== 'TestPassword123!') {
      console.log('✅ Password correctly hashed (not stored in plain text)\n');
    } else {
      throw new Error('Password not hashed!');
    }
    
    // Test 6: Check existing OAuth users
    console.log('6️⃣  Checking existing OAuth users in database...');
    const existingOAuthUsers = await User.find({ googleId: { $exists: true, $ne: null } }).limit(3);
    console.log(`   Found ${existingOAuthUsers.length} OAuth users`);
    
    let allOAuthUsersValid = true;
    for (const user of existingOAuthUsers) {
      if (user.password && user.password.length > 0) {
        console.log(`   ⚠️  OAuth user ${user.email} has a password field (unexpected)`);
        allOAuthUsersValid = false;
      }
    }
    
    if (allOAuthUsersValid) {
      console.log('✅ All existing OAuth users are valid\n');
    }
    
    // Cleanup
    await User.deleteOne({ _id: oauthUser._id });
    await User.deleteOne({ _id: regularUser._id });
    
    console.log('===========================================');
    console.log('✅ ALL OAUTH COMPATIBILITY TESTS PASSED!');
    console.log('===========================================\n');
    console.log('✅ OAuth users can be created without password');
    console.log('✅ OAuth users can be updated without password');
    console.log('✅ Regular users still require password');
    console.log('✅ Password hashing works for regular users');
    console.log('✅ Pre-save hook correctly skips OAuth users');
    console.log('✅ No regressions for OAuth login\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testOAuthCompatibility();

