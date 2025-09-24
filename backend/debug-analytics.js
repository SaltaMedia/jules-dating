const mongoose = require('mongoose');
const AnalyticsEvent = require('./models/AnalyticsEvent');

async function debugAnalytics() {
  try {
    await mongoose.connect('mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs');
    console.log('Connected to MongoDB');
    
    // Get recent events and see how they're structured
    const recentEvents = await AnalyticsEvent.find({})
      .sort({ timestamp: -1 })
      .limit(10);
    
    console.log('Recent events structure:');
    recentEvents.forEach((event, index) => {
      console.log(`${index + 1}. Event:`);
      console.log(`   eventType: ${event.eventType}`);
      console.log(`   action: ${event.action}`);
      console.log(`   properties.event_name: ${event.properties?.event_name}`);
      console.log(`   properties.button_text: ${event.properties?.button_text}`);
      console.log(`   properties.page: ${event.properties?.page}`);
      console.log('');
    });
    
    // Test the grouping logic
    const eventsByType = {};
    recentEvents.forEach(event => {
      const eventName = event.properties?.event_name || event.action;
      if (!eventsByType[eventName]) {
        eventsByType[eventName] = [];
      }
      eventsByType[eventName].push(event);
    });
    
    console.log('Events grouped by type:');
    Object.keys(eventsByType).forEach(eventName => {
      console.log(`${eventName}: ${eventsByType[eventName].length} events`);
    });
    
    // Check specific events we need
    const ctaClicks = eventsByType['landing_page_cta_clicked'] || [];
    const fitChecks = eventsByType['fit_check_completed'] || [];
    
    console.log(`\nCTA clicks found: ${ctaClicks.length}`);
    ctaClicks.forEach(click => {
      console.log(`  Button: ${click.properties?.button_text}`);
    });
    
    console.log(`\nFit checks completed: ${fitChecks.length}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugAnalytics();
