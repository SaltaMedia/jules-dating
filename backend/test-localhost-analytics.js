#!/usr/bin/env node

require('dotenv').config();
const segment = require('./utils/segment');

async function testLocalhostAnalytics() {
  console.log('🧪 Testing Localhost Analytics...\n');
  
  const testUserId = 'test_user_localhost_' + Date.now();
  
  try {
    // Test 1: User Registration (Backend)
    console.log('1. Testing User Registration...');
    await segment.track(testUserId, 'Registration Completed', {
      source: 'localhost_test',
      method: 'email',
      has_name: true,
      test_mode: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Registration event sent');
    
    // Test 2: User Login (Backend)
    console.log('\n2. Testing User Login...');
    await segment.track(testUserId, 'User Logged In', {
      source: 'localhost_test',
      method: 'email',
      has_name: true,
      test_mode: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Login event sent');
    
    // Test 3: OAuth Login (Backend)
    console.log('\n3. Testing OAuth Login...');
    await segment.track(testUserId, 'User Logged In', {
      source: 'localhost_test',
      method: 'google_oauth',
      isAdmin: false,
      test_mode: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ OAuth Login event sent');
    
    // Test 4: Feature Usage (Backend)
    console.log('\n4. Testing Feature Usage...');
    await segment.trackFeatureUsage(testUserId, 'chat', 'message_sent', {
      messageLength: 25,
      intent: 'style_advice',
      test_mode: true,
      timestamp: new Date().toISOString()
    });
    console.log('✅ Feature usage event sent');
    
    // Test 5: User Identification (Backend)
    console.log('\n5. Testing User Identification...');
    await segment.identify(testUserId, {
      email: 'test@localhost.com',
      name: 'Test User',
      signupDate: new Date(),
      plan: 'free',
      test_mode: true
    });
    console.log('✅ User identification sent');
    
    // Flush events to ensure they're sent
    console.log('\n🔄 Flushing events...');
    await segment.flush();
    console.log('✅ Events flushed');
    
    console.log('\n🎉 Localhost analytics test complete!');
    console.log('\n📊 Next steps:');
    console.log('1. Check your Segment debugger: https://app.segment.com/');
    console.log('2. Look for events with test_mode: true');
    console.log('3. Verify events appear in Mixpanel');
    console.log(`4. Test user ID: ${testUserId}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLocalhostAnalytics();

