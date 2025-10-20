require('dotenv').config();
const segment = require('./utils/segment');

async function testAnalytics() {
  console.log('🧪 Testing Analytics System...\n');
  
  // Test 1: Basic event tracking
  console.log('1. Testing basic event tracking...');
  try {
    await segment.track('test_user_123', 'Test Event', {
      testProperty: 'test_value',
      timestamp: new Date().toISOString(),
      source: 'test_script'
    });
    console.log('✅ Basic event tracking successful');
  } catch (error) {
    console.error('❌ Basic event tracking failed:', error);
  }
  
  // Test 2: Page view tracking
  console.log('\n2. Testing page view tracking...');
  try {
    await segment.page('test_user_123', 'Test Page', {
      url: 'https://jules-dating.com/test',
      referrer: 'https://google.com',
      userAgent: 'Test Browser'
    });
    console.log('✅ Page view tracking successful');
  } catch (error) {
    console.error('❌ Page view tracking failed:', error);
  }
  
  // Test 3: Feature usage tracking
  console.log('\n3. Testing feature usage tracking...');
  try {
    await segment.trackFeatureUsage('test_user_123', 'chat', 'message_sent', {
      messageLength: 25,
      intent: 'style_advice'
    });
    console.log('✅ Feature usage tracking successful');
  } catch (error) {
    console.error('❌ Feature usage tracking failed:', error);
  }
  
  // Test 4: User identification
  console.log('\n4. Testing user identification...');
  try {
    await segment.identify('test_user_123', {
      email: 'test@example.com',
      name: 'Test User',
      signupDate: new Date(),
      plan: 'free'
    });
    console.log('✅ User identification successful');
  } catch (error) {
    console.error('❌ User identification failed:', error);
  }
  
  // Test 5: Conversion tracking
  console.log('\n5. Testing conversion tracking...');
  try {
    await segment.trackConversion('test_user_123', 'signup', {
      method: 'email',
      source: 'landing_page'
    });
    console.log('✅ Conversion tracking successful');
  } catch (error) {
    console.error('❌ Conversion tracking failed:', error);
  }
  
  console.log('\n🎉 Analytics testing complete!');
  console.log('\n📊 Next steps:');
  console.log('1. Check your Segment dashboard for events');
  console.log('2. Verify Mixpanel integration in Segment');
  console.log('3. Check Mixpanel dashboard for data');
  
  // Flush events to ensure they're sent
  console.log('\n🔄 Flushing events...');
  await segment.flush();
  console.log('✅ Events flushed');
  
  process.exit(0);
}

testAnalytics().catch(console.error);
