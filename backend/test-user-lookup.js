require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testUserLookup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== TESTING USER LOOKUP FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    console.log(`   User ID type: ${typeof user._id}`);
    console.log(`   User ID constructor: ${user._id.constructor.name}`);
    
    // Create a JWT token
    const jwtSecret = process.env.JWT_SECRET;
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token created:`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Decode the token
    const decoded = jwt.verify(token, jwtSecret);
    console.log(`\n🔍 Decoded token:`);
    console.log(`   userId: ${decoded.userId}`);
    console.log(`   userId type: ${typeof decoded.userId}`);
    console.log(`   userId constructor: ${decoded.userId.constructor.name}`);
    
    // Test user lookup with different ID formats
    console.log(`\n🔍 Testing user lookup with different ID formats...`);
    
    // Test 1: Direct ObjectId
    try {
      const user1 = await User.findById(user._id).select('-password');
      console.log(`   ✅ Direct ObjectId lookup: ${user1 ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Direct ObjectId lookup failed: ${error.message}`);
    }
    
    // Test 2: String ID
    try {
      const user2 = await User.findById(user._id.toString()).select('-password');
      console.log(`   ✅ String ID lookup: ${user2 ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ String ID lookup failed: ${error.message}`);
    }
    
    // Test 3: Decoded token userId
    try {
      const user3 = await User.findById(decoded.userId).select('-password');
      console.log(`   ✅ Decoded token userId lookup: ${user3 ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Decoded token userId lookup failed: ${error.message}`);
    }
    
    // Test 4: Convert decoded userId to ObjectId
    try {
      const objectId = new mongoose.Types.ObjectId(decoded.userId);
      const user4 = await User.findById(objectId).select('-password');
      console.log(`   ✅ Converted ObjectId lookup: ${user4 ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.log(`   ❌ Converted ObjectId lookup failed: ${error.message}`);
    }
    
    // Test 5: Exact auth middleware logic
    console.log(`\n🔍 Testing exact auth middleware logic...`);
    
    try {
      const userFromAuth = await User.findById(decoded.userId).select('-password');
      
      if (!userFromAuth) {
        console.log(`   ❌ Auth middleware logic: User not found with ID: ${decoded.userId}`);
        console.log(`   ID type: ${typeof decoded.userId}`);
        console.log(`   ID value: ${decoded.userId}`);
      } else {
        console.log(`   ✅ Auth middleware logic: User found: ${userFromAuth.email}`);
      }
    } catch (authError) {
      console.log(`   ❌ Auth middleware logic failed: ${authError.message}`);
    }
    
    // Check if there's a type mismatch
    console.log(`\n🔍 Checking for type mismatches...`);
    console.log(`   Original user._id: ${user._id} (${typeof user._id})`);
    console.log(`   Decoded userId: ${decoded.userId} (${typeof decoded.userId})`);
    console.log(`   Are they equal? ${user._id.toString() === decoded.userId.toString()}`);
    console.log(`   Are they strictly equal? ${user._id === decoded.userId}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testUserLookup();
