const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FitCheck = require('./models/FitCheck');
const ClosetItem = require('./models/ClosetItem');

async function checkFitCheckStars() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check FitCheck documents for star symbols
    const fitChecksWithStars = await FitCheck.find({
      $or: [
        { 'analysis.feedback': { $regex: /⭐/ } },
        { advice: { $regex: /⭐/ } }
      ]
    });

    console.log(`Found ${fitChecksWithStars.length} FitCheck documents with star symbols:`);
    
    fitChecksWithStars.forEach((fitCheck, index) => {
      console.log(`\n${index + 1}. FitCheck ID: ${fitCheck._id}`);
      console.log(`   Rating: ${fitCheck.analysis?.overallRating || fitCheck.rating}`);
      console.log(`   Feedback preview: ${(fitCheck.analysis?.feedback || fitCheck.advice || '').substring(0, 100)}...`);
    });

    // Check ClosetItem documents for star symbols
    const closetItemsWithStars = await ClosetItem.find({
      'fitCheck.advice': { $regex: /⭐/ }
    });

    console.log(`\nFound ${closetItemsWithStars.length} ClosetItem documents with star symbols:`);
    
    closetItemsWithStars.forEach((item, index) => {
      console.log(`\n${index + 1}. ClosetItem ID: ${item._id}`);
      console.log(`   Rating: ${item.fitCheck?.rating}`);
      console.log(`   Advice preview: ${(item.fitCheck?.advice || '').substring(0, 100)}...`);
    });

    console.log('\n✅ Star symbol check complete!');
    
  } catch (error) {
    console.error('Error checking star symbols:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkFitCheckStars();
