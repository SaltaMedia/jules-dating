require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');

async function testApiWithToken() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== TESTING API WITH TOKEN FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found: ${user.email} (ID: ${user._id})`);
    
    // Create a JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'dev-jwt-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`\n🔑 JWT Token created:`);
    console.log(`   Token: ${token.substring(0, 50)}...`);
    
    // Test the API endpoint
    console.log(`\n🌐 Testing API endpoint...`);
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    try {
      const response = await fetch('http://localhost:4002/api/fit-check/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Response status: ${response.status}`);
      console.log(`   Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API call successful!`);
        console.log(`   Fit checks returned: ${data.fitChecks ? data.fitChecks.length : 0}`);
        console.log(`   Total count: ${data.pagination ? data.pagination.total : 'N/A'}`);
        
        if (data.fitChecks && data.fitChecks.length > 0) {
          console.log(`\n📸 Sample fit checks from API:`);
          data.fitChecks.slice(0, 3).forEach((fc, i) => {
            console.log(`   ${i+1}. ${fc.eventContext} - Created: ${fc.createdAt}`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ API call failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }
    
    // Test chat sessions endpoint
    console.log(`\n🌐 Testing chat sessions endpoint...`);
    
    try {
      const response = await fetch('http://localhost:4002/api/chat', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Chat sessions API call successful!`);
        console.log(`   Chat sessions returned: ${data.sessions ? data.sessions.length : 0}`);
        
        if (data.sessions && data.sessions.length > 0) {
          console.log(`\n💬 Sample chat sessions from API:`);
          data.sessions.slice(0, 3).forEach((session, i) => {
            console.log(`   ${i+1}. ${session.title} - Messages: ${session.messageCount}`);
          });
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Chat sessions API call failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`   ❌ Network error: ${error.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testApiWithToken();
