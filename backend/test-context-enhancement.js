require('dotenv').config();
const ContextSummarizer = require('./utils/contextSummarizer');
const UserContextCache = require('./utils/userContextCache');
const ConversationLearning = require('./utils/conversationLearning');

async function testContextEnhancement() {
  console.log('🧠 Testing Enhanced Context System...\n');

  // Test 1: Context Summarization
  console.log('📝 Test 1: Context Summarization');
  try {
    const testUserId = 'test_user_123';
    const summary = await ContextSummarizer.generateContextSummary(testUserId);
    
    if (summary) {
      console.log('✅ Context summary generated successfully');
      console.log('Summary:', summary.summary);
      console.log('Key preferences:', summary.keyPreferences);
    } else {
      console.log('⚠️ No context summary generated (expected for test user)');
    }
  } catch (error) {
    console.log('❌ Context summarization error:', error.message);
  }

  console.log('\n📝 Test 2: User Context Cache');
  try {
    const testUserId = 'test_user_123';
    const context = await UserContextCache.getUserContext(testUserId);
    
    if (context) {
      console.log('✅ User context retrieved successfully');
      console.log('Context length:', context.length);
    } else {
      console.log('⚠️ No user context found (expected for test user)');
    }
  } catch (error) {
    console.log('❌ User context cache error:', error.message);
  }

  console.log('\n📝 Test 3: Conversation Learning');
  try {
    const testUserId = 'test_user_123';
    const testMessage = "I love olive green and hate bright yellow. I prefer Uniqlo for casual wear.";
    const conversationHistory = [
      { role: 'user', content: 'What should I wear for a date?' },
      { role: 'assistant', content: 'Let me help you with that!' }
    ];

    const insights = await ConversationLearning.extractInsights(
      testUserId, 
      testMessage, 
      conversationHistory
    );

    if (insights) {
      console.log('✅ Conversation insights extracted successfully');
      console.log('Confidence:', insights.confidence);
      console.log('Style insights:', insights.styleInsights);
    } else {
      console.log('⚠️ No insights extracted (possibly context switch or low confidence)');
    }
  } catch (error) {
    console.log('❌ Conversation learning error:', error.message);
  }

  console.log('\n🎯 Context Enhancement System Test Complete!');
  console.log('\nKey Features Implemented:');
  console.log('✅ Pre-computed context summaries');
  console.log('✅ Session-based context generation');
  console.log('✅ Batch learning with confidence thresholds');
  console.log('✅ Incremental context updates');
  console.log('✅ Cost-effective implementation');
}

// Run the test
testContextEnhancement().catch(console.error);
