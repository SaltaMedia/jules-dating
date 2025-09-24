require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:4001';

async function testContextAPI() {
  console.log('🧠 Testing Enhanced Context System via API...\n');

  // Test 1: Check if server is running
  console.log('📝 Test 1: Server Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server is running');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return;
  }

  // Test 2: Test context generation endpoint
  console.log('\n📝 Test 2: Context Generation Endpoint');
  try {
    const response = await axios.post(`${BASE_URL}/api/learning/generate-context`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail but we can see the endpoint exists
      }
    });
    console.log('✅ Context generation endpoint exists');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Context generation endpoint exists (auth required as expected)');
    } else {
      console.log('❌ Context generation endpoint error:', error.message);
    }
  }

  // Test 3: Test chat endpoint with context
  console.log('\n📝 Test 3: Chat Endpoint with Context');
  try {
    const chatData = {
      message: "I love olive green and prefer Uniqlo. What should I wear for a date?",
      userId: "test_user_123",
      context: [
        { role: 'user', content: 'Hi Jules!' },
        { role: 'assistant', content: 'Hey there! How can I help you with your style today?' }
      ]
    };

    const response = await axios.post(`${BASE_URL}/api/chat`, chatData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Chat endpoint working');
    console.log('Response received:', !!response.data.response);
    console.log('Response length:', response.data.response?.length);
    console.log('Intent detected:', response.data.intent);
    
    if (response.data.response) {
      console.log('\nSample response:');
      console.log(response.data.response.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('❌ Chat endpoint error:', error.message);
    if (error.response) {
      console.log('Error details:', error.response.data);
    }
  }

  console.log('\n🎯 API Context Enhancement System Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Create a test user account');
  console.log('3. Complete onboarding with style preferences');
  console.log('4. Start chatting with Jules to see enhanced context in action');
}

// Run the test
testContextAPI().catch(console.error);
