require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const FitCheck = require('./models/FitCheck');
const Conversation = require('./models/Conversation');
const ChatSession = require('./models/ChatSession');
const ClosetItem = require('./models/ClosetItem');

async function debugSpsaltaData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'spsalta@gmail.com';
    console.log(`\n=== DEBUGGING DATA FOR: ${email} ===`);
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    
    console.log(`✅ User found:`);
    console.log(`   ID: ${user._id}`);
    console.log(`   ID as String: ${user._id.toString()}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Created: ${user.createdAt}`);
    
    // Check FitChecks with different ID formats
    console.log(`\n🔍 Checking FitChecks...`);
    
    const fitChecksObjectId = await FitCheck.find({ userId: user._id });
    console.log(`   FitChecks with ObjectId: ${fitChecksObjectId.length}`);
    
    const fitChecksString = await FitCheck.find({ userId: user._id.toString() });
    console.log(`   FitChecks with String: ${fitChecksString.length}`);
    
    // Check Conversations with different ID formats
    console.log(`\n🔍 Checking Conversations...`);
    
    const conversationsObjectId = await Conversation.find({ userId: user._id });
    console.log(`   Conversations with ObjectId: ${conversationsObjectId.length}`);
    
    const conversationsString = await Conversation.find({ userId: user._id.toString() });
    console.log(`   Conversations with String: ${conversationsString.length}`);
    
    // Check ChatSessions with different ID formats
    console.log(`\n🔍 Checking ChatSessions...`);
    
    const chatSessionsObjectId = await ChatSession.find({ userId: user._id });
    console.log(`   ChatSessions with ObjectId: ${chatSessionsObjectId.length}`);
    
    const chatSessionsString = await ChatSession.find({ userId: user._id.toString() });
    console.log(`   ChatSessions with String: ${chatSessionsString.length}`);
    
    // Check ClosetItems with different ID formats
    console.log(`\n🔍 Checking ClosetItems...`);
    
    const closetItemsObjectId = await ClosetItem.find({ userId: user._id });
    console.log(`   ClosetItems with ObjectId: ${closetItemsObjectId.length}`);
    
    const closetItemsString = await ClosetItem.find({ userId: user._id.toString() });
    console.log(`   ClosetItems with String: ${closetItemsString.length}`);
    
    // Show sample data to verify it's the right user
    console.log(`\n📸 Sample FitCheck data:`);
    if (fitChecksObjectId.length > 0) {
      const sample = fitChecksObjectId[0];
      console.log(`   Event: ${sample.eventContext}`);
      console.log(`   Created: ${sample.createdAt}`);
      console.log(`   User ID: ${sample.userId}`);
    }
    
    console.log(`\n💬 Sample ChatSession data:`);
    if (chatSessionsObjectId.length > 0) {
      const sample = chatSessionsObjectId[0];
      console.log(`   Title: ${sample.title}`);
      console.log(`   Messages: ${sample.messages.length}`);
      console.log(`   Created: ${sample.createdAt}`);
      console.log(`   User ID: ${sample.userId}`);
    }
    
    // Check if there are any data with different user ID formats
    console.log(`\n🔍 Checking for data with different ID formats...`);
    
    // Look for any fit checks that might be linked to this user but with different ID
    const allFitChecks = await FitCheck.find({}).limit(10);
    console.log(`   Sample of all FitChecks in database:`);
    allFitChecks.forEach((fc, i) => {
      console.log(`     ${i+1}. User ID: ${fc.userId} (type: ${typeof fc.userId}) - Event: ${fc.eventContext}`);
    });
    
    // Check if the user ID in the data matches what we expect
    console.log(`\n🔍 Verifying user ID consistency...`);
    
    if (fitChecksObjectId.length > 0) {
      const firstFitCheck = fitChecksObjectId[0];
      console.log(`   FitCheck user ID: ${firstFitCheck.userId}`);
      console.log(`   User ObjectId: ${user._id}`);
      console.log(`   Match: ${firstFitCheck.userId.toString() === user._id.toString()}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugSpsaltaData();
