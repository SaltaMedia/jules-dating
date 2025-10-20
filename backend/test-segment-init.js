// Test Segment initialization
require('dotenv').config();

console.log('🧪 Testing Segment Backend Initialization...');
console.log('SEGMENT_WRITE_KEY:', process.env.SEGMENT_WRITE_KEY ? 'SET' : 'NOT SET');

try {
  const segment = require('./utils/segment');
  console.log('✅ Segment service loaded successfully');
  
  // Test if it's enabled
  if (segment.isEnabled) {
    console.log('✅ Segment is enabled and ready');
  } else {
    console.log('❌ Segment is disabled');
  }
  
} catch (error) {
  console.error('❌ Failed to load Segment service:', error.message);
}
