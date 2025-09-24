const { determineIntent } = require('./controllers/chatController');

// Test intent detection
const portlandContext = [
  { role: 'user', content: 'What can I do with my date this weekend?' },
  { role: 'assistant', content: 'Portland has some great options! Portland Saturday Market is a classic for crafts, art, and treats.' },
  { role: 'user', content: 'can you find specific events for me to bring my date to?' },
  { role: 'assistant', content: 'I can suggest specific events in Portland. Portland Saturday Market runs every weekend.' }
];

const testMessage = 'ok. can you pull up links of things to do in portland this weekend';
const intent = determineIntent(testMessage, portlandContext);

console.log('=== Redis & Intent Detection Test ===');
console.log('Test Message:', testMessage);
console.log('Detected Intent:', intent);
console.log('Expected Intent: conversation (not product_recommendation)');
console.log('Test Result:', intent === 'conversation' ? 'PASS' : 'FAIL');

// Test Redis connection
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

async function testRedis() {
  try {
    await client.connect();
    await client.set('test', 'redis-working');
    const result = await client.get('test');
    console.log('Redis Test:', result === 'redis-working' ? 'PASS' : 'FAIL');
    await client.disconnect();
  } catch (error) {
    console.log('Redis Test: FAIL -', error.message);
  }
}

testRedis(); 