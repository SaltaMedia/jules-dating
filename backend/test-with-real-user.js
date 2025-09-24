require('dotenv').config();
const UserProfile = require('./models/UserProfile');
const User = require('./models/User');

async function testWithRealUser() {
  console.log('🔍 Testing with Real User Data...\n');

  try {
    // Check if there are any user profiles
    console.log('📝 Step 1: Check for existing user profiles');
    const profiles = await UserProfile.find({}).limit(5);
    console.log(`Found ${profiles.length} user profiles`);
    
    if (profiles.length > 0) {
      console.log('Sample profile data:');
      const profile = profiles[0];
      console.log('- User ID:', profile.userId);
      console.log('- Name:', profile.name);
      console.log('- Style preferences:', profile.styleProfile?.preferredStyles || 'None');
      console.log('- Colors love:', profile.styleProfile?.colorsLove || 'None');
      console.log('- Budget:', profile.lifestyle?.monthlyClothingBudget || 'None');
    }

    // Check if there are any legacy users
    console.log('\n📝 Step 2: Check for existing legacy users');
    const users = await User.find({}).limit(5);
    console.log(`Found ${users.length} legacy users`);
    
    if (users.length > 0) {
      console.log('Sample legacy user data:');
      const user = users[0];
      console.log('- User ID:', user._id);
      console.log('- Name:', user.name);
      console.log('- Onboarding styles:', user.onboarding?.preferredStyles || 'None');
      console.log('- Onboarding colors:', user.onboarding?.colorsLove || 'None');
      console.log('- Onboarding budget:', user.onboarding?.monthlyClothingBudget || 'None');
    }

    // Test chat with a real user if available
    if (profiles.length > 0 || users.length > 0) {
      console.log('\n📝 Step 3: Test chat with real user');
      const testUserId = profiles.length > 0 ? profiles[0].userId : users[0]._id.toString();
      console.log('Using user ID:', testUserId);
      
      // Test the chat endpoint with this user
      const axios = require('axios');
      try {
        const response = await axios.post('http://localhost:3001/api/chat/test', {
          message: 'Can you see my preferences?',
          userId: testUserId
        });
        
        console.log('Chat response:', response.data.response);
        console.log('Response length:', response.data.response.length);
        
        if (response.data.response.includes('preferences') || response.data.response.includes('style')) {
          console.log('✅ Jules seems to be referencing user data');
        } else {
          console.log('❌ Jules is not referencing user data');
        }
      } catch (error) {
        console.log('Chat test failed:', error.response?.data || error.message);
      }
    } else {
      console.log('\n❌ No users found in the system');
      console.log('You need to create a user with preferences first');
    }

    console.log('\n🎯 Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWithRealUser().catch(console.error);
