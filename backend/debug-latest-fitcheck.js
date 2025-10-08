const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FitCheck = require('./models/FitCheck');

async function debugLatestFitCheck() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the most recent FitCheck document
    const recentFitCheck = await FitCheck.findOne({}, {}, { sort: { 'createdAt': -1 } });

    if (recentFitCheck) {
      console.log('Most recent FitCheck:');
      console.log('ID:', recentFitCheck._id);
      console.log('Created:', recentFitCheck.createdAt);
      console.log('Rating in analysis:', recentFitCheck.analysis?.overallRating);
      console.log('\nFull feedback:');
      console.log(recentFitCheck.analysis?.feedback);
    } else {
      console.log('No fit checks found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugLatestFitCheck();