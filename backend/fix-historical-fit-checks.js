#!/usr/bin/env node

/**
 * Fix Historical Fit Checks Script
 * 
 * This script fixes all historical fit check data to ensure consistency:
 * 1. Removes star symbols from feedback text
 * 2. Ensures rating consistency between stored rating and feedback text
 * 3. Updates any malformed data structures
 * 4. Ensures proper X/10 format throughout
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const FitCheck = require('./models/FitCheck');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean up feedback text
const cleanFeedbackText = (text) => {
  if (!text) return text;
  
  // Remove star symbols (all types: ⭐★☆)
  let cleaned = text.replace(/[⭐★☆]+/g, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove any "Overall Rating:" headers that might be inconsistent
  cleaned = cleaned.replace(/^\*\*Overall Rating[:\s]*\d*[-\s]*/i, '');
  
  return cleaned;
};

// Extract rating from feedback text
const extractRatingFromText = (text) => {
  if (!text) return null;
  
  // Try to find rating in the opening line like "I'd give this outfit a solid [X]/10"
  const ratingMatch = text.match(/(?:give this|rate this|give this outfit).*?(\d+)\/10/i);
  if (ratingMatch) {
    const foundRating = parseInt(ratingMatch[1]);
    if (foundRating >= 1 && foundRating <= 10) {
      return foundRating;
    }
  }
  
  // Fallback: try to find any number followed by /10
  const fallbackMatch = text.match(/(\d+)\/10/i);
  if (fallbackMatch) {
    const foundRating = parseInt(fallbackMatch[1]);
    if (foundRating >= 1 && foundRating <= 10) {
      return foundRating;
    }
  }
  
  return null;
};

// Fix a single fit check
const fixFitCheck = async (fitCheck) => {
  let needsUpdate = false;
  const updates = {};
  
  // Clean up the main feedback text
  if (fitCheck.analysis && fitCheck.analysis.feedback) {
    const cleanedFeedback = cleanFeedbackText(fitCheck.analysis.feedback);
    if (cleanedFeedback !== fitCheck.analysis.feedback) {
      updates['analysis.feedback'] = cleanedFeedback;
      needsUpdate = true;
    }
    
    // Check if rating in text matches stored rating
    const textRating = extractRatingFromText(cleanedFeedback);
    if (textRating && textRating !== fitCheck.rating) {
      console.log(`  🔄 Rating mismatch: stored=${fitCheck.rating}, text=${textRating} - updating to ${textRating}`);
      updates.rating = textRating;
      updates['analysis.overallRating'] = textRating;
      needsUpdate = true;
    }
  }
  
  // Clean up advice field if it exists
  if (fitCheck.advice) {
    const cleanedAdvice = cleanFeedbackText(fitCheck.advice);
    if (cleanedAdvice !== fitCheck.advice) {
      updates.advice = cleanedAdvice;
      needsUpdate = true;
    }
  }
  
  // Ensure analysis structure is consistent
  if (fitCheck.analysis) {
    if (!fitCheck.analysis.overallRating || fitCheck.analysis.overallRating !== fitCheck.rating) {
      updates['analysis.overallRating'] = fitCheck.rating;
      needsUpdate = true;
    }
  } else {
    // Create analysis structure if missing
    updates.analysis = {
      overallRating: fitCheck.rating,
      feedback: fitCheck.advice || ''
    };
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    try {
      await FitCheck.findByIdAndUpdate(fitCheck._id, updates);
      console.log(`  ✅ Fixed fit check ${fitCheck._id}`);
      return true;
    } catch (error) {
      console.error(`  ❌ Error fixing fit check ${fitCheck._id}:`, error.message);
      return false;
    }
  }
  
  return false;
};

// Main function
const main = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Finding all fit checks...');
    const fitChecks = await FitCheck.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${fitChecks.length} fit checks to process`);
    
    let fixedCount = 0;
    let errorCount = 0;
    
    for (const fitCheck of fitChecks) {
      console.log(`\n🔧 Processing fit check ${fitCheck._id} (${fitCheck.createdAt.toISOString().split('T')[0]})`);
      
      const wasFixed = await fixFitCheck(fitCheck);
      if (wasFixed) {
        fixedCount++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`  ✅ Fixed: ${fixedCount} fit checks`);
    console.log(`  ❌ Errors: ${errorCount} fit checks`);
    console.log(`  📊 Total processed: ${fitChecks.length} fit checks`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 Historical fit check data has been cleaned up!');
    } else {
      console.log('\n✨ All fit check data was already clean!');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanFeedbackText, extractRatingFromText, fixFitCheck };
