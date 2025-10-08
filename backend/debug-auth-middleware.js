require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function debugAuthMiddleware() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== DEBUGGING AUTH MIDDLEWARE FOR: ${email} ===`);
    
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
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token created:`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Simulate the exact auth middleware logic
    console.log(`\n🔍 Simulating auth middleware step by step...`);
    
    // Step 1: Extract token from header
    const authHeader = `Bearer ${token}`;
    const tokenFromHeader = authHeader.replace('Bearer ', '');
    console.log(`   Step 1 - Token extracted: ${tokenFromHeader.substring(0, 50)}...`);
    
    if (!tokenFromHeader) {
      console.log(`   ❌ No token found`);
      return;
    }
    
    // Step 2: Verify token
    try {
      const decoded = jwt.verify(tokenFromHeader, jwtSecret);
      console.log(`   Step 2 - Token verification successful`);
      console.log(`   Decoded userId: ${decoded.userId}`);
      console.log(`   Decoded email: ${decoded.email}`);
      console.log(`   Decoded isAdmin: ${decoded.isAdmin}`);
    } catch (verifyError) {
      console.log(`   ❌ Step 2 - Token verification failed: ${verifyError.message}`);
      return;
    }
    
    // Step 3: Find user in database
    try {
      const decoded = jwt.verify(tokenFromHeader, jwtSecret);
      const userFromAuth = await User.findById(decoded.userId).select('-password');
      
      if (!userFromAuth) {
        console.log(`   ❌ Step 3 - User not found in database with ID: ${decoded.userId}`);
        return;
      }
      
      console.log(`   ✅ Step 3 - User found in database: ${userFromAuth.email}`);
      console.log(`   User ID match: ${userFromAuth._id.toString() === decoded.userId.toString()}`);
      
      // Step 4: Set req.user
      const reqUser = {
        id: decoded.userId,
        email: decoded.email,
        isAdmin: userFromAuth.isAdmin
      };
      
      console.log(`   ✅ Step 4 - req.user set:`, reqUser);
      
    } catch (userError) {
      console.log(`   ❌ Step 3 - User lookup failed: ${userError.message}`);
    }
    
    // Test with different JWT secret formats
    console.log(`\n🔍 Testing with different JWT secret formats...`);
    
    // Test with fallback secret
    const fallbackSecret = 'dev-jwt-secret-only-for-development';
    const tokenWithFallback = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      fallbackSecret,
      { expiresIn: '7d' }
    );
    
    console.log(`   Token with fallback secret: ${tokenWithFallback.substring(0, 50)}...`);
    
    try {
      const decodedFallback = jwt.verify(tokenWithFallback, fallbackSecret);
      console.log(`   ✅ Fallback secret verification successful`);
    } catch (fallbackError) {
      console.log(`   ❌ Fallback secret verification failed: ${fallbackError.message}`);
    }
    
    // Test what happens if we use the wrong secret
    try {
      const decodedWrong = jwt.verify(token, 'wrong-secret');
      console.log(`   ❌ Wrong secret verification should have failed but didn't`);
    } catch (wrongError) {
      console.log(`   ✅ Wrong secret verification failed as expected: ${wrongError.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugAuthMiddleware();
