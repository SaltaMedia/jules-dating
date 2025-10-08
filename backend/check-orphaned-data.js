require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FitCheck = require('./models/FitCheck');
const ProfilePicReview = require('./models/ProfilePicReview');
const Conversation = require('./models/Conversation');
const ChatSession = require('./models/ChatSession');
const UserProfile = require('./models/UserProfile');
const ClosetItem = require('./models/ClosetItem');
const Outfit = require('./models/Outfit');

async function checkOrphanedData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const targetEmails = ['braxdenm@gmail.com', 'spsalta@gmail.com', 'bolando3@yahoo.com'];
    
    console.log('\n=== CHECKING FOR ORPHANED USER DATA ===');
    
    for (const email of targetEmails) {
      console.log(`\n🔍 Checking data for: ${email}`);
      
      // Find the user
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }
      
      const userId = user._id.toString();
      console.log(`✅ User found: ${email} (ID: ${userId})`);
      
      // Check FitChecks
      const fitChecks = await FitCheck.find({ userId: user._id });
      console.log(`📸 FitChecks: ${fitChecks.length}`);
      if (fitChecks.length > 0) {
        fitChecks.forEach((fc, i) => {
          console.log(`  ${i+1}. ${fc.eventContext} - Rating: ${fc.rating} - Created: ${fc.createdAt}`);
        });
      }
      
      // Check ProfilePicReviews
      const profilePicReviews = await ProfilePicReview.find({ userId: user._id });
      console.log(`🖼️  ProfilePicReviews: ${profilePicReviews.length}`);
      if (profilePicReviews.length > 0) {
        profilePicReviews.forEach((ppr, i) => {
          console.log(`  ${i+1}. Rating: ${ppr.rating} - Created: ${ppr.createdAt}`);
        });
      }
      
      // Check Conversations
      const conversations = await Conversation.find({ userId: userId });
      console.log(`💬 Conversations: ${conversations.length}`);
      if (conversations.length > 0) {
        conversations.forEach((conv, i) => {
          console.log(`  ${i+1}. ${conv.messages.length} messages - Created: ${conv.createdAt}`);
        });
      }
      
      // Check ChatSessions
      const chatSessions = await ChatSession.find({ userId: userId });
      console.log(`💬 ChatSessions: ${chatSessions.length}`);
      if (chatSessions.length > 0) {
        chatSessions.forEach((cs, i) => {
          console.log(`  ${i+1}. ${cs.title} - ${cs.messages.length} messages - Created: ${cs.createdAt}`);
        });
      }
      
      // Check UserProfile
      const userProfile = await UserProfile.findOne({ userId: userId });
      console.log(`👤 UserProfile: ${userProfile ? 'Found' : 'Not found'}`);
      if (userProfile) {
        console.log(`  - About: ${userProfile.aboutMe || 'N/A'}`);
        console.log(`  - Body Info: ${userProfile.bodyInfo ? 'Present' : 'Missing'}`);
        console.log(`  - Style Profile: ${userProfile.styleProfile ? 'Present' : 'Missing'}`);
      }
      
      // Check ClosetItems
      const closetItems = await ClosetItem.find({ userId: user._id });
      console.log(`👕 ClosetItems: ${closetItems.length}`);
      if (closetItems.length > 0) {
        closetItems.forEach((item, i) => {
          console.log(`  ${i+1}. ${item.name} - ${item.category} - Created: ${item.createdAt}`);
        });
      }
      
      // Check Outfits
      const outfits = await Outfit.find({ userId: user._id });
      console.log(`👔 Outfits: ${outfits.length}`);
      if (outfits.length > 0) {
        outfits.forEach((outfit, i) => {
          console.log(`  ${i+1}. ${outfit.name} - Created: ${outfit.createdAt}`);
        });
      }
    }
    
    // Check for orphaned data with email references
    console.log('\n=== CHECKING FOR ORPHANED DATA BY EMAIL ===');
    
    for (const email of targetEmails) {
      console.log(`\n🔍 Checking orphaned data for: ${email}`);
      
      // Check if there are any records that reference this email but don't have a valid user
      const orphanedFitChecks = await FitCheck.find({
        $or: [
          { 'userResponse.notes': { $regex: email, $i: true } },
          { 'analysis.feedback': { $regex: email, $i: true } }
        ]
      });
      console.log(`📸 Orphaned FitChecks by email: ${orphanedFitChecks.length}`);
      
      const orphanedConversations = await Conversation.find({
        $or: [
          { 'messages.content': { $regex: email, $i: true } }
        ]
      });
      console.log(`💬 Orphaned Conversations by email: ${orphanedConversations.length}`);
    }
    
    // Check for data that might be linked to anonymous sessions
    console.log('\n=== CHECKING ANONYMOUS SESSION DATA ===');
    
    const anonymousFitChecks = await FitCheck.find({ 
      userId: { $exists: false },
      anonymousId: { $exists: true }
    }).limit(20);
    
    console.log(`📸 Anonymous FitChecks: ${anonymousFitChecks.length}`);
    if (anonymousFitChecks.length > 0) {
      console.log('Recent anonymous fit checks:');
      anonymousFitChecks.forEach((fc, i) => {
        console.log(`  ${i+1}. ${fc.eventContext} - Anonymous ID: ${fc.anonymousId} - Created: ${fc.createdAt}`);
      });
    }
    
    const anonymousConversations = await Conversation.find({
      userId: { $regex: /^[a-f0-9-]{36}$/ } // UUID pattern for anonymous sessions
    }).limit(20);
    
    console.log(`💬 Anonymous Conversations: ${anonymousConversations.length}`);
    if (anonymousConversations.length > 0) {
      console.log('Recent anonymous conversations:');
      anonymousConversations.forEach((conv, i) => {
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

checkOrphanedData();
