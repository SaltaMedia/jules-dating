require('dotenv').config();
const UserContextCache = require('./utils/userContextCache');
const ContextSummarizer = require('./utils/contextSummarizer');

async function debugContext() {
  console.log('🔍 Debugging Context System...\n');

  // Test 1: Check if context summarizer is working
  console.log('📝 Test 1: Context Summarizer');
  try {
    const ContextSummarizer = require('./utils/contextSummarizer');
    console.log('✅ ContextSummarizer loaded successfully');
  } catch (error) {
    console.log('❌ ContextSummarizer error:', error.message);
  }

  // Test 2: Check if user context cache is working
  console.log('\n📝 Test 2: User Context Cache');
  try {
    const UserContextCache = require('./utils/userContextCache');
    console.log('✅ UserContextCache loaded successfully');
  } catch (error) {
    console.log('❌ UserContextCache error:', error.message);
  }

  // Test 3: Check if learning system is working
  console.log('\n📝 Test 3: Conversation Learning');
  try {
    const ConversationLearning = require('./utils/conversationLearning');
    console.log('✅ ConversationLearning loaded successfully');
  } catch (error) {
    console.log('❌ ConversationLearning error:', error.message);
  }

  // Test 4: Check system prompt generation
  console.log('\n📝 Test 4: System Prompt Generation');
  try {
    // Simulate what happens in chatController
    const testUserId = 'test_user_123';
    const context = await UserContextCache.getUserContext(testUserId);
    console.log('Context generated:', !!context);
    console.log('Context length:', context?.length || 0);
    if (context) {
      console.log('Context preview:', context.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ Context generation error:', error.message);
  }

  console.log('\n🎯 Debug Complete!');
  console.log('\nPossible Issues:');
  console.log('1. User context not being loaded from database');
  console.log('2. Learning system not processing conversations');
  console.log('3. Context summarization not working');
  console.log('4. System prompt not including enhanced instructions');
}

debugContext().catch(console.error);
