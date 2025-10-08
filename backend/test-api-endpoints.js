require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FitCheck = require('./models/FitCheck');
const ChatSession = require('./models/ChatSession');
const jwt = require('jsonwebtoken');

async function testApiEndpoints() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== TESTING API ENDPOINTS FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   ID as String: ${user._id.toString()}`);
    
    // Create a JWT token like the frontend would have
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token created:`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Decode the token to see what userId it contains
    const decoded = jwt.decode(token);
    console.log(`   Decoded userId: ${decoded.userId}`);
    console.log(`   Decoded email: ${decoded.email}`);
    
    // Test the fit check query that the API would use
    console.log(`\n🔍 Testing FitCheck query with JWT userId...`);
    
    const fitChecksWithJwtId = await FitCheck.find({ userId: decoded.userId });
    console.log(`   FitChecks with JWT userId: ${fitChecksWithJwtId.length}`);
    
    const fitChecksWithObjectId = await FitCheck.find({ userId: user._id });
    console.log(`   FitChecks with ObjectId: ${fitChecksWithObjectId.length}`);
    
    const fitChecksWithString = await FitCheck.find({ userId: user._id.toString() });
    console.log(`   FitChecks with String: ${fitChecksWithString.length}`);
    
    // Test the chat session query that the API would use
    console.log(`\n🔍 Testing ChatSession query with JWT userId...`);
    
    const chatSessionsWithJwtId = await ChatSession.find({ userId: decoded.userId });
    console.log(`   ChatSessions with JWT userId: ${chatSessionsWithJwtId.length}`);
    
    const chatSessionsWithObjectId = await ChatSession.find({ userId: user._id });
    console.log(`   ChatSessions with ObjectId: ${chatSessionsWithObjectId.length}`);
    
    const chatSessionsWithString = await ChatSession.find({ userId: user._id.toString() });
    console.log(`   ChatSessions with String: ${chatSessionsWithString.length}`);
    
    // Check if there's a mismatch
    console.log(`\n🔍 Checking for ID format mismatch...`);
    
    if (fitChecksWithJwtId.length === 0 && fitChecksWithObjectId.length > 0) {
      console.log(`   ❌ MISMATCH FOUND: JWT userId doesn't match data userId format`);
      console.log(`   JWT userId type: ${typeof decoded.userId}`);
      console.log(`   Data userId type: ${typeof fitChecksWithObjectId[0].userId}`);
      console.log(`   JWT userId: ${decoded.userId}`);
      console.log(`   Data userId: ${fitChecksWithObjectId[0].userId}`);
    } else {
      console.log(`   ✅ No mismatch found`);
    }
    
    // Test what the auth middleware would extract
    console.log(`\n🔍 Testing auth middleware extraction...`);
    
    // Simulate what happens in the auth middleware
    const authHeader = `Bearer ${token}`;
    const tokenFromHeader = authHeader.split(' ')[1];
    const decodedFromAuth = jwt.verify(tokenFromHeader, process.env.JWT_SECRET || 'dev-jwt-secret');
    
    console.log(`   Auth middleware userId: ${decodedFromAuth.userId}`);
    console.log(`   Auth middleware userId type: ${typeof decodedFromAuth.userId}`);
    
    // Test the exact query the API would use
    console.log(`\n🔍 Testing exact API query...`);
    
    const apiFitChecks = await FitCheck.find({ userId: decodedFromAuth.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`   API query result: ${apiFitChecks.length} fit checks`);
    
    if (apiFitChecks.length === 0) {
      console.log(`   ❌ API query returns no results - this is the problem!`);
      
      // Try to fix by converting the ID
      console.log(`\n🔧 Attempting to fix ID format...`);
      
      let convertedId;
      if (typeof decodedFromAuth.userId === 'string') {
        convertedId = new mongoose.Types.ObjectId(decodedFromAuth.userId);
      } else {
        convertedId = decodedFromAuth.userId.toString();
      }
      
      const fixedFitChecks = await FitCheck.find({ userId: convertedId })
        .sort({ createdAt: -1 })
        .limit(10);
      
      console.log(`   Fixed query result: ${fixedFitChecks.length} fit checks`);
      
      if (fixedFitChecks.length > 0) {
        console.log(`   ✅ Fix successful! The issue is ID format conversion.`);
      }
    } else {
      console.log(`   ✅ API query works correctly`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testApiEndpoints();
