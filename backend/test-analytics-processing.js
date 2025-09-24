const mongoose = require('mongoose');
const AnalyticsEvent = require('./models/AnalyticsEvent');

async function testAnalyticsProcessing() {
  try {
    await mongoose.connect('mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs');
    console.log('Connected to MongoDB');
    
    // Simulate the exact same logic as getDashboardMetrics
    const timeRange = '7d';
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get events from database directly
    const dbEvents = await AnalyticsEvent.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
    
    console.log(`Found ${dbEvents.length} events in database for 7d range`);
    
    // Convert database events to the format expected by processComprehensiveAnalytics
    const filteredEvents = dbEvents.map(event => ({
      event_ts: event.timestamp,
      event_name: event.properties?.event_name || event.action,
      user_id: event.userId,
      session_id: event.sessionId,
      page: event.properties?.page,
      button_text: event.properties?.button_text,
      source: event.properties?.source,
      feature: event.properties?.feature,
      rating: event.properties?.rating,
      ...event.properties
    }));
    
    // Test the grouping logic
    const eventsByType = {};
    filteredEvents.forEach(event => {
      const eventName = event.event_name;
      if (!eventsByType[eventName]) {
        eventsByType[eventName] = [];
      }
      eventsByType[eventName].push(event);
    });
    
    // Test CTA click filtering
    const ctaEvents = eventsByType['landing_page_cta_clicked'] || [];
    console.log(`CTA events found: ${ctaEvents.length}`);
    
    if (ctaEvents.length > 0) {
      console.log('CTA events details:');
      ctaEvents.forEach((event, index) => {
        console.log(`${index + 1}. button_text: "${event.button_text}", user_id: "${event.user_id}"`);
      });
    }
    
    const tryFreeFitCheckClicks = ctaEvents.filter(e => e.button_text === 'Try Free Fit Check').length;
    const getStartedForFreeClicks = ctaEvents.filter(e => e.button_text === 'Get Started for Free').length;
    
    console.log(`Try Free Fit Check clicks: ${tryFreeFitCheckClicks}`);
    console.log(`Get Started for Free clicks: ${getStartedForFreeClicks}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAnalyticsProcessing();
