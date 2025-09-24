const mongoose = require('mongoose');
const AnalyticsEvent = require('./models/AnalyticsEvent');

async function checkEventStructure() {
  try {
    await mongoose.connect('mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs');
    console.log('Connected to MongoDB');
    
    // Get a recent event to see its structure
    const recentEvent = await AnalyticsEvent.findOne({
      action: 'landing_page_cta_clicked'
    });
    
    if (recentEvent) {
      console.log('Event structure:');
      console.log('eventType:', recentEvent.eventType);
      console.log('action:', recentEvent.action);
      console.log('category:', recentEvent.category);
      console.log('properties:', JSON.stringify(recentEvent.properties, null, 2));
      console.log('Has event_name field:', !!recentEvent.event_name);
      console.log('All fields:', Object.keys(recentEvent.toObject()));
    } else {
      console.log('No landing_page_cta_clicked events found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEventStructure();
