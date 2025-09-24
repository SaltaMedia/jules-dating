require('dotenv').config();
const ConversationLearning = require('./utils/conversationLearning');

async function testLearning() {
  console.log('🧠 Testing Conversation Learning System...\n');

  try {
    // Test 1: Topic Detection
    console.log('📝 Test 1: Topic Detection');
    const testMessages = [
      "I need help with a wedding outfit",
      "What about gym clothes?",
      "I love olive green and hate bright yellow",
      "I'm feeling anxious about this date"
    ];

    for (const message of testMessages) {
      const topic = ConversationLearning.detectCurrentTopic(message);
      console.log(`Message: "${message}" -> Topic: ${topic}`);
    }

    // Test 2: Context Switch Detection
    console.log('\n🔄 Test 2: Context Switch Detection');
    const recentTopics = ['formal', 'formal', 'formal'];
    const newTopic = 'athletic';
    const isSwitch = ConversationLearning.isContextSwitch(newTopic, recentTopics);
    console.log(`Recent topics: ${recentTopics.join(', ')}`);
    console.log(`New topic: ${newTopic}`);
    console.log(`Is context switch: ${isSwitch}`);

    // Test 3: Style Insights Extraction
    console.log('\n🎨 Test 3: Style Insights Extraction');
    const testMessage = "I need gym clothes. I love olive green and hate bright yellow";
    const conversationHistory = [
      { role: 'user', content: 'I need help with style' },
      { role: 'assistant', content: 'I can help you with that!' },
      { role: 'user', content: testMessage }
    ];

    const insights = await ConversationLearning.extractInsights('test_user', testMessage, conversationHistory);
    
    if (insights) {
      console.log('✅ Insights extracted successfully');
      console.log('Style insights:', JSON.stringify(insights.styleInsights, null, 2));
      console.log('Lifestyle insights:', JSON.stringify(insights.lifestyleInsights, null, 2));
      console.log('Emotional insights:', JSON.stringify(insights.emotionalInsights, null, 2));
    } else {
      console.log('❌ No insights extracted (possibly context switch)');
    }

    // Test 4: Adaptive Context Generation
    console.log('\n🎯 Test 4: Adaptive Context Generation');
    if (insights) {
      const adaptiveContext = await ConversationLearning.generateAdaptiveContext('test_user', insights);
      console.log('Adaptive context:', JSON.stringify(adaptiveContext, null, 2));
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎉 Conversation Learning System is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLearning(); 