const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const FitCheck = require('./models/FitCheck');
const ProfilePicReview = require('./models/ProfilePicReview');
const ClosetItem = require('./models/ClosetItem');

async function analyzeRealUserActivity() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-dating';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    console.log('=' .repeat(80));
    console.log('🔍 ANALYZING REAL USER ACTIVITY (ALL TIME)\n');
    console.log('=' .repeat(80));

    // Get all real users (excluding test accounts and admins for now)
    const allUsers = await User.find({
      email: { 
        $not: /test|example|admin/i  // Exclude obvious test accounts
      }
    }).sort({ createdAt: -1 });

    console.log(`\n📊 Found ${allUsers.length} real users (non-test accounts)\n`);

    if (allUsers.length === 0) {
      console.log('\n⚠️  No real users found. Let me check ALL users including test accounts:\n');
      
      const allUsersIncludingTest = await User.find().sort({ createdAt: -1 });
      console.log(`Total users in database: ${allUsersIncludingTest.length}\n`);
      
      allUsersIncludingTest.forEach(user => {
        console.log(`   • ${user.email} - ${user.name} (created: ${user.createdAt.toLocaleDateString()})`);
      });
    }

    // For each user, check their activity
    for (const user of allUsers) {
      console.log('\n' + '='.repeat(80));
      console.log(`\n👤 USER: ${user.name} (${user.email})`);
      console.log(`   Account Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Last Active: ${user.lastActive ? user.lastActive.toLocaleString() : 'Never'}`);
      if (user.isAdmin) console.log(`   🔧 ADMIN ACCOUNT`);
      console.log('\n' + '-'.repeat(80));

      let hasActivity = false;

      // Check Conversations
      const userConversations = await Conversation.find({ 
        userId: user._id.toString() 
      }).sort({ createdAt: -1 });

      if (userConversations.length > 0) {
        hasActivity = true;
        console.log(`\n💬 CHAT CONVERSATIONS: ${userConversations.length} conversation(s)`);
        
        let totalMessages = 0;
        userConversations.forEach((conv, idx) => {
          const userMessages = conv.messages.filter(m => m.role === 'user').length;
          const assistantMessages = conv.messages.filter(m => m.role === 'assistant').length;
          totalMessages += conv.messages.length;
          
          console.log(`\n   Conversation ${idx + 1}:`);
          console.log(`   • Created: ${conv.createdAt.toLocaleString()}`);
          console.log(`   • Last updated: ${conv.updatedAt.toLocaleString()}`);
          console.log(`   • Messages: ${conv.messages.length} (${userMessages} from user, ${assistantMessages} from Jules)`);
          
          if (conv.state.lastIntent) {
            console.log(`   • Last intent: ${conv.state.lastIntent}`);
          }

          // Show a sample of the conversation
          if (conv.messages.length > 0) {
            console.log(`   • Conversation preview:`);
            const messagesToShow = conv.messages.slice(0, 4); // Show first 4 messages
            messagesToShow.forEach(msg => {
              const preview = msg.content.substring(0, 120).replace(/\n/g, ' ');
              console.log(`      ${msg.role === 'user' ? '👨' : '🤖'} ${msg.role}: ${preview}${msg.content.length > 120 ? '...' : ''}`);
            });
            
            if (conv.messages.length > 4) {
              console.log(`      ... (${conv.messages.length - 4} more messages)`);
            }
          }
        });

        console.log(`\n   📈 Total messages exchanged: ${totalMessages}`);
      }

      // Check Fit Checks
      const userFitChecks = await FitCheck.find({ 
        userId: user._id 
      }).sort({ createdAt: -1 });

      if (userFitChecks.length > 0) {
        hasActivity = true;
        console.log(`\n👔 FIT CHECKS: ${userFitChecks.length} submission(s)`);
        
        userFitChecks.forEach((fitCheck, idx) => {
          console.log(`\n   Fit Check ${idx + 1}:`);
          console.log(`   • Date: ${fitCheck.createdAt.toLocaleString()}`);
          console.log(`   • Event context: ${fitCheck.eventContext}`);
          
          if (fitCheck.analysis && fitCheck.analysis.overallRating) {
            console.log(`   • Rating: ${fitCheck.analysis.overallRating}/10`);
          } else if (fitCheck.rating) {
            console.log(`   • Rating: ${fitCheck.rating}/10`);
          }
          
          if (fitCheck.specificQuestion) {
            console.log(`   • User's question: ${fitCheck.specificQuestion}`);
          }
          
          if (fitCheck.analysis && fitCheck.analysis.feedback) {
            const feedback = fitCheck.analysis.feedback.substring(0, 200).replace(/\n/g, ' ');
            console.log(`   • Jules's feedback: ${feedback}${fitCheck.analysis.feedback.length > 200 ? '...' : ''}`);
          }
          
          if (fitCheck.saved) {
            console.log(`   • ⭐ Saved by user`);
          }
        });
      }

      // Check Profile Pic Reviews
      const userProfilePicReviews = await ProfilePicReview.find({ 
        userId: user._id 
      }).sort({ createdAt: -1 });

      if (userProfilePicReviews.length > 0) {
        hasActivity = true;
        console.log(`\n📸 PROFILE PIC REVIEWS: ${userProfilePicReviews.length} submission(s)`);
        
        userProfilePicReviews.forEach((review, idx) => {
          console.log(`\n   Review ${idx + 1}:`);
          console.log(`   • Date: ${review.createdAt.toLocaleString()}`);
          console.log(`   • Overall rating: ${review.rating}/10`);
          
          if (review.specificQuestion) {
            console.log(`   • User's question: ${review.specificQuestion}`);
          }
          
          if (review.analysis) {
            console.log(`   • Detailed scores:`);
            if (review.analysis.lighting) console.log(`      - Lighting: ${review.analysis.lighting}/10`);
            if (review.analysis.grooming) console.log(`      - Grooming: ${review.analysis.grooming}/10`);
            if (review.analysis.eyeContact) console.log(`      - Eye Contact: ${review.analysis.eyeContact}/10`);
            if (review.analysis.smile) console.log(`      - Smile: ${review.analysis.smile}/10`);
            
            if (review.analysis.feedback) {
              const feedback = review.analysis.feedback.substring(0, 200).replace(/\n/g, ' ');
              console.log(`   • Feedback: ${feedback}${review.analysis.feedback.length > 200 ? '...' : ''}`);
            }
          } else if (review.advice) {
            const advice = review.advice.substring(0, 200).replace(/\n/g, ' ');
            console.log(`   • Advice: ${advice}${review.advice.length > 200 ? '...' : ''}`);
          }
          
          if (review.saved) {
            console.log(`   • ⭐ Saved by user`);
          }
        });
      }

      // Check Closet/Wardrobe Items
      const userClosetItems = await ClosetItem.find({ 
        userId: user._id 
      }).sort({ createdAt: -1 });

      if (userClosetItems.length > 0) {
        hasActivity = true;
        console.log(`\n👕 WARDROBE ITEMS: ${userClosetItems.length} item(s) added`);
        
        // Group by category
        const itemsByCategory = {};
        userClosetItems.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!itemsByCategory[category]) {
            itemsByCategory[category] = [];
          }
          itemsByCategory[category].push(item);
        });

        Object.entries(itemsByCategory).forEach(([category, items]) => {
          console.log(`\n   ${category} (${items.length} items):`);
          items.slice(0, 5).forEach(item => {
            console.log(`      • ${item.name || 'Unnamed item'}`);
            if (item.brand) console.log(`        Brand: ${item.brand}`);
            console.log(`        Added: ${item.createdAt.toLocaleDateString()}`);
          });
          if (items.length > 5) {
            console.log(`      ... and ${items.length - 5} more items`);
          }
        });
      }

      // Check onboarding completion
      if (user.onboarding && user.onboarding.completed) {
        console.log(`\n✅ ONBOARDING: Completed`);
        if (user.onboarding.relationshipStatus) {
          console.log(`   • Relationship status: ${user.onboarding.relationshipStatus}`);
        }
        if (user.onboarding.preferredStyles && user.onboarding.preferredStyles.length > 0) {
          console.log(`   • Preferred styles: ${user.onboarding.preferredStyles.join(', ')}`);
        }
      }

      if (!hasActivity) {
        console.log('\n⚠️  No feature usage activity found for this user');
      }

      // Calculate days since last activity
      const lastActivityDates = [];
      if (userConversations.length > 0) {
        lastActivityDates.push(new Date(userConversations[0].updatedAt));
      }
      if (userFitChecks.length > 0) {
        lastActivityDates.push(new Date(userFitChecks[0].createdAt));
      }
      if (userProfilePicReviews.length > 0) {
        lastActivityDates.push(new Date(userProfilePicReviews[0].createdAt));
      }
      if (userClosetItems.length > 0) {
        lastActivityDates.push(new Date(userClosetItems[0].createdAt));
      }

      if (lastActivityDates.length > 0) {
        const mostRecentActivity = new Date(Math.max(...lastActivityDates));
        const daysSinceActivity = Math.floor((new Date() - mostRecentActivity) / (1000 * 60 * 60 * 24));
        console.log(`\n⏰ Last activity: ${mostRecentActivity.toLocaleString()} (${daysSinceActivity} days ago)`);
      }
    }

    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 OVERALL SUMMARY\n');
    console.log('='.repeat(80));

    const totalConversations = await Conversation.countDocuments({ 
      userId: { $ne: 'anonymous' } 
    });
    const totalMessages = await Conversation.aggregate([
      { $match: { userId: { $ne: 'anonymous' } } },
      { $project: { messageCount: { $size: '$messages' } } },
      { $group: { _id: null, total: { $sum: '$messageCount' } } }
    ]);

    const totalFitChecks = await FitCheck.countDocuments({ 
      userId: { $exists: true, $ne: null } 
    });

    const totalProfilePicReviews = await ProfilePicReview.countDocuments({ 
      userId: { $exists: true, $ne: null } 
    });

    const totalClosetItems = await ClosetItem.countDocuments({ 
      userId: { $exists: true, $ne: null } 
    });

    console.log(`Total Real Users: ${allUsers.length}`);
    console.log(`Total Conversations: ${totalConversations}`);
    console.log(`Total Messages Exchanged: ${totalMessages[0]?.total || 0}`);
    console.log(`Total Fit Checks: ${totalFitChecks}`);
    console.log(`Total Profile Pic Reviews: ${totalProfilePicReviews}`);
    console.log(`Total Wardrobe Items: ${totalClosetItems}`);

    // Check for anonymous activity
    console.log('\n' + '-'.repeat(80));
    console.log('\n🕵️  ANONYMOUS USER ACTIVITY:\n');
    
    const anonymousFitChecks = await FitCheck.countDocuments({ 
      anonymousId: { $exists: true, $ne: null } 
    });
    
    const anonymousProfilePicReviews = await ProfilePicReview.countDocuments({ 
      sessionId: { $exists: true, $ne: null },
      userId: { $exists: false }
    });

    console.log(`Anonymous Fit Checks: ${anonymousFitChecks}`);
    console.log(`Anonymous Profile Pic Reviews: ${anonymousProfilePicReviews}`);

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the analysis
analyzeRealUserActivity();

