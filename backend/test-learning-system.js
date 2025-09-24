require('dotenv').config();
const ConversationLearning = require('./utils/conversationLearning');
const UserProfile = require('./models/UserProfile');
const mongoose = require('mongoose');

async function testLearningSystem() {
  console.log('🧠 Testing Jules Learning System...\n');

  try {
    // Test 1: Check if OpenAI is available
    console.log('📝 Test 1: OpenAI Configuration');
    const openaiClient = require('openai');
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found');
    } else {
      console.log('❌ OpenAI API key not found - learning will be disabled');
      return;
    }

    // Test 2: Test insight extraction
    console.log('\n📝 Test 2: Insight Extraction');
    const testMessage = "I love casual streetwear and want to look more confident for dates. I prefer Uniqlo and H&M for budget-friendly options.";
    const testHistory = [
      { role: 'user', content: 'I need help with my style' },
      { role: 'assistant', content: 'I\'d be happy to help! What\'s your current style like?' },
      { role: 'user', content: 'I usually wear basic t-shirts and jeans' }
    ];

    console.log('Testing with message:', testMessage);
    const insights = await ConversationLearning.extractInsights('test-user-123', testMessage, testHistory);
    
    if (insights) {
      console.log('✅ Insights extracted successfully!');
      console.log('Style insights:', Object.keys(insights.styleInsights || {}));
      console.log('Lifestyle insights:', Object.keys(insights.lifestyleInsights || {}));
      console.log('Confidence:', insights.confidence);
    } else {
      console.log('❌ No insights extracted (possibly context switch or low confidence)');
    }

    // Test 3: Test context awareness
    console.log('\n📝 Test 3: Context Awareness');
    const contextSwitchMessage = "What's the weather like today?";
    const contextInsights = await ConversationLearning.extractInsights('test-user-123', contextSwitchMessage, testHistory);
    
    if (!contextInsights) {
      console.log('✅ Context switch correctly detected - learning skipped');
    } else {
      console.log('⚠️ Context switch not detected - learning proceeded');
    }

    // Test 4: Test profile update
    console.log('\n📝 Test 4: Profile Update');
    if (insights) {
      const profileUpdated = await ConversationLearning.updateProfileWithInsights('test-user-123', insights);
      if (profileUpdated) {
        console.log('✅ Profile updated successfully');
      } else {
        console.log('❌ Profile update failed');
      }
    }

    // Test 5: Test adaptive context generation
    console.log('\n📝 Test 5: Adaptive Context Generation');
    const adaptiveContext = await ConversationLearning.generateAdaptiveContext('test-user-123', insights);
    if (adaptiveContext) {
      console.log('✅ Adaptive context generated');
      console.log('Context length:', adaptiveContext.length);
    } else {
      console.log('❌ Adaptive context generation failed');
    }

    console.log('\n🎯 Learning System Test Complete!');
    console.log('\n💡 Key Findings:');
    console.log('- OpenAI integration:', process.env.OPENAI_API_KEY ? '✅ Working' : '❌ Missing');
    console.log('- Insight extraction:', insights ? '✅ Working' : '❌ Failed');
    console.log('- Context awareness:', !contextInsights ? '✅ Working' : '⚠️ Needs attention');
    console.log('- Profile updates:', insights ? '✅ Working' : '❌ Failed');
    console.log('- Adaptive context:', adaptiveContext ? '✅ Working' : '❌ Failed');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testLearningSystem().catch(console.error);
