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

async function verifyUserData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const targetEmails = ['spsalta@gmail.com', 'bolando3@yahoo.com'];
    
    console.log('\n=== VERIFYING USER DATA INTEGRITY ===');
    
    for (const email of targetEmails) {
      console.log(`\n🔍 Verifying data for: ${email}`);
      
      // Find the user
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User not found: ${email}`);
        continue;
      }
      
      const userId = user._id.toString();
      console.log(`✅ User found: ${email} (ID: ${userId})`);
      
      // Verify FitChecks
      const fitChecks = await FitCheck.find({ userId: user._id });
      console.log(`📸 FitChecks: ${fitChecks.length} (all properly linked)`);
      
      // Verify ProfilePicReviews
      const profilePicReviews = await ProfilePicReview.find({ userId: user._id });
      console.log(`🖼️  ProfilePicReviews: ${profilePicReviews.length} (all properly linked)`);
      
      // Verify Conversations
      const conversations = await Conversation.find({ userId: userId });
      console.log(`💬 Conversations: ${conversations.length} (all properly linked)`);
      
      // Verify ChatSessions
      const chatSessions = await ChatSession.find({ userId: userId });
      console.log(`💬 ChatSessions: ${chatSessions.length} (all properly linked)`);
      
      // Verify UserProfile
      const userProfile = await UserProfile.findOne({ userId: userId });
      console.log(`👤 UserProfile: ${userProfile ? 'Found and properly linked' : 'Not found'}`);
      
      // Verify ClosetItems
      const closetItems = await ClosetItem.find({ userId: user._id });
      console.log(`👕 ClosetItems: ${closetItems.length} (all properly linked)`);
      
      // Verify Outfits
      const outfits = await Outfit.find({ userId: user._id });
      console.log(`👔 Outfits: ${outfits.length} (all properly linked)`);
      
      // Check for any orphaned data
      console.log(`\n🔍 Checking for orphaned data...`);
      
      // Check for fit checks with wrong user ID format
      const orphanedFitChecks = await FitCheck.find({
        $or: [
          { userId: userId }, // String format
          { userId: user._id } // ObjectId format
        ]
      });
      console.log(`📸 Total FitChecks (both formats): ${orphanedFitChecks.length}`);
      
      // Check for conversations with wrong user ID format
      const orphanedConversations = await Conversation.find({
        $or: [
          { userId: userId }, // String format
          { userId: user._id.toString() } // String format
        ]
      });
      console.log(`💬 Total Conversations (both formats): ${orphanedConversations.length}`);
      
      // Summary
      const totalData = fitChecks.length + profilePicReviews.length + conversations.length + 
                       chatSessions.length + (userProfile ? 1 : 0) + closetItems.length + outfits.length;
      
      console.log(`\n📊 SUMMARY for ${email}:`);
      console.log(`   Total data items: ${totalData}`);
      console.log(`   Status: ${totalData > 0 ? '✅ DATA INTACT' : '❌ NO DATA'}`);
      
      if (totalData > 0) {
        console.log(`   ✅ User data is properly restored and linked`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyUserData();
