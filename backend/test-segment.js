#!/usr/bin/env node

// Test script to verify Segment analytics is working
require('dotenv').config();

console.log('🧪 Testing Segment Analytics...');
console.log('Environment variables:');
console.log('- SEGMENT_WRITE_KEY:', process.env.SEGMENT_WRITE_KEY ? 'SET' : 'NOT SET');

// Test backend Segment service
try {
  const segment = require('./utils/segment');
  console.log('✅ Backend Segment service loaded successfully');
  
  // Test tracking
  segment.track('test-user-123', 'Test Event', {
    test: true,
    timestamp: new Date().toISOString()
  }).then(() => {
    console.log('✅ Backend tracking test completed');
  }).catch((error) => {
    console.error('❌ Backend tracking test failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Backend Segment service failed to load:', error.message);
}

console.log('\n🧪 Test completed. Check Segment dashboard for events.');
