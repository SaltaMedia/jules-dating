require('dotenv').config();
const UserContextCache = require('./utils/userContextCache');

async function testOnboardingAccess() {
  console.log('🔍 Testing Onboarding Data Access...\n');

  try {
    // Test 1: Check if context includes onboarding data
    console.log('📝 Test 1: Check User Context Cache');
    const context = await UserContextCache.getUserContext('test-user-123');
    console.log('Context loaded:', !!context);
    console.log('Context length:', context?.length || 0, 'characters');
    
    if (context) {
      console.log('\nContext content:');
      console.log(context);
      
      // Check for specific onboarding data
      const hasHeight = context.includes('height') || context.includes('5\'10"') || context.includes('5\'10');
      const hasStyle = context.includes('preferred') || context.includes('style');
      const hasBudget = context.includes('budget') || context.includes('$');
      
      console.log('\nOnboarding Data Check:');
      console.log('- Height info:', hasHeight ? '✅ Found' : '❌ Missing');
      console.log('- Style preferences:', hasStyle ? '✅ Found' : '❌ Missing');
      console.log('- Budget info:', hasBudget ? '✅ Found' : '❌ Missing');
    }

    // Test 2: Test with a real user ID (you can change this)
    console.log('\n📝 Test 2: Test with Real User');
    console.log('To test with your actual user data:');
    console.log('1. Find your user ID from the database');
    console.log('2. Update the testUserId variable below');
    console.log('3. Run this test again');
    
    // const testUserId = 'YOUR_ACTUAL_USER_ID_HERE';
    // const realContext = await UserContextCache.getUserContext(testUserId);
    // console.log('Real user context:', realContext);

    console.log('\n🎯 Test Complete!');
    console.log('\n💡 If onboarding data is missing:');
    console.log('- Check if user profile exists in database');
    console.log('- Verify onboarding data was saved correctly');
    console.log('- Ensure UserContextCache is loading the right user');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOnboardingAccess().catch(console.error);
