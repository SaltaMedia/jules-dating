// Test Landing Page Visited event
// Run this in browser console on localhost:3002

console.log('🧪 Testing Landing Page Visited Event...');

// Check if Segment is loaded
if (!window.analytics) {
  console.log('❌ Segment not loaded');
  console.log('💡 Try refreshing the page');
  return;
}

console.log('✅ Segment loaded');

// Test the exact same event that should fire on landing page
window.analytics.track('Landing Page Visited', {
  source: 'direct',
  utm_source: 'test',
  utm_medium: 'console',
  utm_campaign: 'debug',
  referrer: 'test',
  test_mode: true,
  timestamp: new Date().toISOString()
});

console.log('📤 Landing Page Visited event sent');
console.log('🔍 Check Segment Debugger for this event');
console.log('🔍 Check Mixpanel Live View for this event');

// Also test with different event name to see if it's a naming issue
setTimeout(() => {
  window.analytics.track('Test Landing Page Event', {
    test: true,
    source: 'console_test'
  });
  console.log('📤 Test Landing Page Event sent (alternative name)');
}, 1000);
