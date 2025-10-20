// Quick test to verify Mixpanel is receiving events from Segment
// Run this in browser console on localhost:3002

console.log('🧪 Testing Mixpanel Connection...');

// Test 1: Check if Segment is loaded
console.log('✅ Segment loaded:', !!window.analytics);

// Test 2: Send test event
if (window.analytics) {
  window.analytics.track('Mixpanel Connection Test', {
    test: true,
    timestamp: new Date().toISOString(),
    source: 'connection_test'
  });
  console.log('📤 Test event sent to Segment → Mixpanel');
} else {
  console.log('❌ Segment not loaded');
}

// Test 3: Check Mixpanel directly (if available)
if (window.mixpanel) {
  console.log('✅ Mixpanel SDK loaded directly');
  window.mixpanel.track('Direct Mixpanel Test', {
    test: true,
    source: 'direct_test'
  });
} else {
  console.log('ℹ️ Mixpanel SDK not loaded (expected - using Segment)');
}

console.log('🎯 Check Mixpanel Live View for events!');
