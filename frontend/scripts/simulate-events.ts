#!/usr/bin/env tsx

const API_ENDPOINT = 'http://localhost:3001/api/analytics/events';
const NUM_EVENTS = 100;

interface AnalyticsEvent {
  eventType: string;
  sessionId: string;
  timestamp: string;
  userId?: string;
  page?: string;
  properties?: Record<string, any>;
}

function generateRandomEvent(): AnalyticsEvent {
  const eventTypes = ['page_view', 'chat_message', 'feature_usage', 'onboarding_step'];
  const pages = ['/', '/chat', '/shop', '/closet', '/onboarding'];
  
  return {
    eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    sessionId: `session-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    userId: Math.random() > 0.5 ? `user-${Math.random().toString(36).substr(2, 9)}` : undefined,
    page: pages[Math.floor(Math.random() * pages.length)],
    properties: {
      source: 'simulation',
      testRun: true,
      randomValue: Math.random()
    }
  };
}

async function sendEvent(event: AnalyticsEvent): Promise<{ success: boolean; duration: number }> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event)
    });
    
    const duration = Date.now() - startTime;
    const success = response.ok;
    
    if (!success) {
      console.error(`Event failed: ${response.status} ${response.statusText}`);
    }
    
    return { success, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Network error: ${error}`);
    return { success: false, duration };
  }
}

async function simulateEvents() {
  console.log(`🚀 Starting analytics event simulation...`);
  console.log(`📊 Sending ${NUM_EVENTS} events to ${API_ENDPOINT}`);
  console.log('');
  
  const startTime = Date.now();
  const results: { success: boolean; duration: number }[] = [];
  
  // Send events in batches of 10
  const batchSize = 10;
  for (let i = 0; i < NUM_EVENTS; i += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, NUM_EVENTS - i) }, () => generateRandomEvent());
    
    const batchPromises = batch.map(event => sendEvent(event));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Progress indicator
    const progress = Math.round(((i + batchSize) / NUM_EVENTS) * 100);
    process.stdout.write(`\r📈 Progress: ${progress}% (${i + batchSize}/${NUM_EVENTS})`);
  }
  
  const totalTime = Date.now() - startTime;
  const successfulEvents = results.filter(r => r.success).length;
  const failedEvents = results.filter(r => !r.success).length;
  const durations = results.map(r => r.duration).filter(d => d > 0);
  
  // Calculate statistics
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const p50Duration = durations.length > 0 ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)] : 0;
  const p95Duration = durations.length > 0 ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)] : 0;
  
  console.log('\n\n📊 Simulation Results:');
  console.log(`✅ Successful events: ${successfulEvents}/${NUM_EVENTS} (${Math.round((successfulEvents/NUM_EVENTS)*100)}%)`);
  console.log(`❌ Failed events: ${failedEvents}/${NUM_EVENTS} (${Math.round((failedEvents/NUM_EVENTS)*100)}%)`);
  console.log(`⏱️  Total time: ${totalTime}ms`);
  console.log(`📈 Average latency: ${Math.round(avgDuration)}ms`);
  console.log(`📊 P50 latency: ${Math.round(p50Duration)}ms`);
  console.log(`📊 P95 latency: ${Math.round(p95Duration)}ms`);
  console.log(`🚀 Events per second: ${Math.round((NUM_EVENTS / totalTime) * 1000)}`);
  
  // Performance criteria
  const p50Pass = p50Duration < 100;
  const successRatePass = (successfulEvents / NUM_EVENTS) > 0.95;
  
  console.log('\n🎯 Performance Criteria:');
  console.log(`P50 < 100ms: ${p50Pass ? '✅ PASS' : '❌ FAIL'} (${Math.round(p50Duration)}ms)`);
  console.log(`Success rate > 95%: ${successRatePass ? '✅ PASS' : '❌ FAIL'} (${Math.round((successfulEvents/NUM_EVENTS)*100)}%)`);
  
  if (p50Pass && successRatePass) {
    console.log('\n🎉 All performance criteria met!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some performance criteria failed');
    process.exit(1);
  }
}

// Run simulation
simulateEvents().catch(error => {
  console.error('❌ Simulation failed:', error);
  process.exit(1);
});

