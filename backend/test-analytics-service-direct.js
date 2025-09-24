const mongoose = require('mongoose');
const AnalyticsService = require('./utils/analyticsService');

async function testAnalyticsServiceDirect() {
  try {
    await mongoose.connect('mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs');
    console.log('Connected to MongoDB');
    
    const analyticsService = new AnalyticsService();
    
    console.log('Testing getDashboardMetrics...');
    try {
      const metrics = await analyticsService.getDashboardMetrics('7d');
      console.log('Success! Metrics:');
      console.log('tryFreeFitCheckClicks:', metrics.tryFreeFitCheckClicks);
      console.log('getStartedForFreeClicks:', metrics.getStartedForFreeClicks);
      console.log('fitChecksCompleted:', metrics.fitChecksCompleted);
      console.log('fitChecksStarted:', metrics.fitChecksStarted);
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAnalyticsServiceDirect();