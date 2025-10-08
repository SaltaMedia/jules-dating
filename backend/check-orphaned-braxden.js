require('dotenv').config();
const mongoose = require('mongoose');
const FitCheck = require('./models/FitCheck');
const ProfilePicReview = require('./models/ProfilePicReview');
const Conversation = require('./models/Conversation');
const ChatSession = require('./models/ChatSession');
const UserProfile = require('./models/UserProfile');
const ClosetItem = require('./models/ClosetItem');

async function checkOrphanedBraxdenData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== CHECKING FOR ORPHANED DATA THAT MIGHT BELONG TO BRAXDEN ===');
    
    // Check for data that might be linked to anonymous sessions
    console.log('\n🔍 Checking anonymous session data...');
    
    const anonymousFitChecks = await FitCheck.find({ 
      userId: { $exists: false },
      anonymousId: { $exists: true }
    }).sort({ createdAt: -1 }).limit(50);
    
    console.log(`📸 Anonymous FitChecks: ${anonymousFitChecks.length}`);
    if (anonymousFitChecks.length > 0) {
      console.log('Recent anonymous fit checks:');
      anonymousFitChecks.forEach((fc, i) => {
        console.log(`  ${i+1}. ${fc.eventContext} - Anonymous ID: ${fc.anonymousId} - Created: ${fc.createdAt}`);
      });
    }
    
    const anonymousConversations = await Conversation.find({
      userId: { $regex: /^[a-f0-9-]{36}$/ } // UUID pattern for anonymous sessions
    }).sort({ createdAt: -1 }).limit(50);
    
    console.log(`💬 Anonymous Conversations: ${anonymousConversations.length}`);
    if (anonymousConversations.length > 0) {
      console.log('Recent anonymous conversations:');
      anonymousConversations.forEach((conv, i) => {
        console.log(`  ${i+1}. ${conv.messages.length} messages - User ID: ${conv.userId} - Created: ${conv.createdAt}`);
        if (conv.messages.length > 0) {
          const firstMessage = conv.messages[0];
          console.log(`     First message: "${firstMessage.content.substring(0, 100)}..."`);
        }
      });
    }
    
    // Check for data that might contain "braxden" in content
    console.log('\n🔍 Checking for data containing "braxden"...');
    
    const braxdenFitChecks = await FitCheck.find({
      $or: [
        { eventContext: { $regex: /braxden/i } },
        { 'analysis.feedback': { $regex: /braxden/i } },
        { 'userResponse.notes': { $regex: /braxden/i } }
      ]
    });
    
    console.log(`📸 FitChecks mentioning "braxden": ${braxdenFitChecks.length}`);
    if (braxdenFitChecks.length > 0) {
      braxdenFitChecks.forEach((fc, i) => {
        console.log(`  ${i+1}. ${fc.eventContext} - User ID: ${fc.userId} - Created: ${fc.createdAt}`);
      });
    }
    
    const braxdenConversations = await Conversation.find({
      'messages.content': { $regex: /braxden/i }
    });
    
    console.log(`💬 Conversations mentioning "braxden": ${braxdenConversations.length}`);
    if (braxdenConversations.length > 0) {
      braxdenConversations.forEach((conv, i) => {
        console.log(`  ${i+1}. ${conv.messages.length} messages - User ID: ${conv.userId} - Created: ${conv.createdAt}`);
      });
    }
    
    // Check for data created around the time braxden was active (Oct 1, 2025)
    console.log('\n🔍 Checking for data created around Oct 1, 2025...');
    
    const oct1Start = new Date('2025-10-01T00:00:00.000Z');
    const oct1End = new Date('2025-10-02T00:00:00.000Z');
    
    const oct1FitChecks = await FitCheck.find({
      createdAt: { $gte: oct1Start, $lt: oct1End }
    }).sort({ createdAt: -1 });
    
    console.log(`📸 FitChecks on Oct 1, 2025: ${oct1FitChecks.length}`);
    if (oct1FitChecks.length > 0) {
      oct1FitChecks.forEach((fc, i) => {
        console.log(`  ${i+1}. ${fc.eventContext} - User ID: ${fc.userId} - Anonymous ID: ${fc.anonymousId} - Created: ${fc.createdAt}`);
      });
    }
    
    const oct1Conversations = await Conversation.find({
      createdAt: { $gte: oct1Start, $lt: oct1End }
    }).sort({ createdAt: -1 });
    
    console.log(`💬 Conversations on Oct 1, 2025: ${oct1Conversations.length}`);
    if (oct1Conversations.length > 0) {
      oct1Conversations.forEach((conv, i) => {
        console.log(`  ${i+1}. ${conv.messages.length} messages - User ID: ${conv.userId} - Created: ${conv.createdAt}`);
      });
    }
    
    // Check for recent data that might be orphaned
    console.log('\n🔍 Checking for recent orphaned data (last 7 days)...');
    
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentFitChecks = await FitCheck.find({
      createdAt: { $gte: recentDate },
      userId: { $exists: false }
    }).sort({ createdAt: -1 });
    
    console.log(`📸 Recent orphaned FitChecks: ${recentFitChecks.length}`);
    if (recentFitChecks.length > 0) {
      recentFitChecks.forEach((fc, i) => {
        console.log(`  ${i+1}. ${fc.eventContext} - Anonymous ID: ${fc.anonymousId} - Created: ${fc.createdAt}`);
      });
    }
    
    const recentConversations = await Conversation.find({
      createdAt: { $gte: recentDate },
      userId: { $regex: /^[a-f0-9-]{36}$/ }
    }).sort({ createdAt: -1 });
    
    console.log(`💬 Recent anonymous Conversations: ${recentConversations.length}`);
    if (recentConversations.length > 0) {
      recentConversations.forEach((conv, i) => {
        console.log(`  ${i+1}. ${conv.messages.length} messages - User ID: ${conv.userId} - Created: ${conv.createdAt}`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkOrphanedBraxdenData();
