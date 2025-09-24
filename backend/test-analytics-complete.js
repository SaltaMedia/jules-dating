const mongoose = require('mongoose');
const AnalyticsEvent = require('./models/AnalyticsEvent');

async function testAnalyticsComplete() {
  try {
    await mongoose.connect('mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs');
    console.log('Connected to MongoDB');
    
    // Get events from the last 7 days
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dbEvents = await AnalyticsEvent.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
    
    console.log(`Found ${dbEvents.length} events in the last 7 days`);
    
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
    
    console.log('\nEvents grouped by type:');
    Object.keys(eventsByType).forEach(eventName => {
      console.log(`${eventName}: ${eventsByType[eventName].length} events`);
    });
    
    // Test CTA click filtering specifically
    const ctaEvents = eventsByType['landing_page_cta_clicked'] || [];
    console.log(`\nCTA events found: ${ctaEvents.length}`);
    
    ctaEvents.forEach((event, index) => {
      console.log(`${index + 1}. button_text: "${event.button_text}", user_id: "${event.user_id}", timestamp: ${event.event_ts}`);
    });
    
    const tryFreeFitCheckClicks = ctaEvents.filter(e => e.button_text === 'Try Free Fit Check').length;
    const getStartedForFreeClicks = ctaEvents.filter(e => e.button_text === 'Get Started for Free').length;
    
    console.log(`\nTry Free Fit Check clicks: ${tryFreeFitCheckClicks}`);
    console.log(`Get Started for Free clicks: ${getStartedForFreeClicks}`);
    
    // Test fit check events
    const fitCheckEvents = eventsByType['fit_check_completed'] || [];
    console.log(`\nFit check completed events: ${fitCheckEvents.length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAnalyticsComplete();
