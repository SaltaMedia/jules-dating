require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function debugJwtToken() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== DEBUGGING JWT TOKEN FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    
    // Check JWT secret
    const jwtSecret = process.env.JWT_SECRET;
    console.log(`\n🔑 JWT Secret:`);
    console.log(`   Secret exists: ${!!jwtSecret}`);
    console.log(`   Secret length: ${jwtSecret ? jwtSecret.length : 0}`);
    console.log(`   Secret preview: ${jwtSecret ? jwtSecret.substring(0, 10) + '...' : 'undefined'}`);
    
    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      jwtSecret || 'dev-jwt-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token created:`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Decode the token
    const decoded = jwt.decode(token);
    console.log(`   Decoded payload:`, decoded);
    
    // Verify the token
    try {
      const verified = jwt.verify(token, jwtSecret || 'dev-jwt-secret');
      console.log(`   ✅ Token verification successful:`, verified);
    } catch (verifyError) {
      console.log(`   ❌ Token verification failed:`, verifyError.message);
    }
    
    // Check what the auth middleware would do
    console.log(`\n🔍 Simulating auth middleware...`);
    
    // Simulate the exact logic from auth.js
    const tokenFromHeader = token; // This would come from req.header('Authorization')?.replace('Bearer ', '')
    
    if (!tokenFromHeader) {
      console.log(`   ❌ No token found`);
      return;
    }
    
    try {
      const decodedFromAuth = jwt.verify(tokenFromHeader, jwtSecret || 'dev-jwt-secret');
      console.log(`   ✅ Auth middleware verification successful`);
      console.log(`   Decoded userId: ${decodedFromAuth.userId}`);
      console.log(`   Decoded email: ${decodedFromAuth.email}`);
      
      // Try to find the user
      const userFromAuth = await User.findById(decodedFromAuth.userId).select('-password');
      
      if (!userFromAuth) {
        console.log(`   ❌ User not found in database with ID: ${decodedFromAuth.userId}`);
      } else {
        console.log(`   ✅ User found in database: ${userFromAuth.email}`);
        console.log(`   User ID match: ${userFromAuth._id.toString() === decodedFromAuth.userId.toString()}`);
      }
      
    } catch (authError) {
      console.log(`   ❌ Auth middleware verification failed:`, authError.message);
    }
    
    // Check if there's a mismatch in the user ID format
    console.log(`\n🔍 Checking user ID format...`);
    console.log(`   User._id: ${user._id} (type: ${typeof user._id})`);
    console.log(`   User._id.toString(): ${user._id.toString()} (type: ${typeof user._id.toString()})`);
    
    // Test with different ID formats
    const tokenWithStringId = jwt.sign(
      { userId: user._id.toString(), email: user.email, isAdmin: user.isAdmin },
      jwtSecret || 'dev-jwt-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token with string ID:`);
    console.log(`   Token: ${tokenWithStringId.substring(0, 50)}...`);
    
    try {
      const decodedStringId = jwt.verify(tokenWithStringId, jwtSecret || 'dev-jwt-secret');
      console.log(`   ✅ String ID token verification successful`);
      console.log(`   Decoded userId: ${decodedStringId.userId} (type: ${typeof decodedStringId.userId})`);
      
      // Try to find the user with string ID
      const userWithStringId = await User.findById(decodedStringId.userId).select('-password');
      
      if (!userWithStringId) {
        console.log(`   ❌ User not found with string ID: ${decodedStringId.userId}`);
      } else {
        console.log(`   ✅ User found with string ID: ${userWithStringId.email}`);
      }
      
    } catch (stringIdError) {
      console.log(`   ❌ String ID token verification failed:`, stringIdError.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugJwtToken();
