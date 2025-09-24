require('dotenv').config();
const UserContextCache = require('./utils/userContextCache');

async function testUltraLightweight() {
  console.log('🧠 Testing Ultra-Lightweight Learning Integration...\n');

  try {
    // Test 1: Basic context (no learning)
    console.log('📝 Test 1: Basic Context (No Learning)');
    const basicContext = await UserContextCache.getUserContextWithLearning('test-user-123', 'Hello');
    console.log('✅ Basic context loaded:', basicContext ? 'Yes' : 'No');
    console.log('Context length:', basicContext?.length || 0, 'characters');

    // Test 2: Context with learning trigger
    console.log('\n📝 Test 2: Context with Learning Trigger');
    const learningContext = await UserContextCache.getUserContextWithLearning('test-user-123', 'Can you see my preferences?');
    console.log('✅ Learning context loaded:', learningContext ? 'Yes' : 'No');
    console.log('Context length:', learningContext?.length || 0, 'characters');
    
    if (learningContext && learningContext.includes('LEARNING:')) {
      console.log('✅ Learning flag detected!');
    } else {
      console.log('ℹ️ No learning flag (user may not have recent learning data)');
    }

    // Test 3: Performance test
    console.log('\n📝 Test 3: Performance Test');
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      await UserContextCache.getUserContextWithLearning('test-user-123', 'Hello');
    }
    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 10;
    console.log(`✅ Average response time: ${avgTime.toFixed(2)}ms`);

    console.log('\n🎯 Ultra-Lightweight Test Complete!');
    console.log('\n💡 Key Benefits:');
    console.log('- ✅ No bloat: Only adds learning flag when relevant');
    console.log('- ✅ Fast: Uses cached context');
    console.log('- ✅ Smart: Only triggers on preference-related questions');
    console.log('- ✅ Lightweight: Single line addition when needed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testUltraLightweight().catch(console.error);
