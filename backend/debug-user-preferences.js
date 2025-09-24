require('dotenv').config();
const UserContextCache = require('./utils/userContextCache');
const UserProfile = require('./models/UserProfile');
const User = require('./models/User');

async function debugUserPreferences() {
  console.log('🔍 Debugging User Preferences Loading...\n');

  try {
    // Test with a real user ID (you can change this)
    const testUserId = 'test-user-123';
    
    console.log('📝 Step 1: Check if user profile exists');
    const profile = await UserProfile.findOne({ userId: testUserId });
    console.log('UserProfile found:', !!profile);
    
    if (profile) {
      console.log('Profile data:');
      console.log('- Name:', profile.name);
      console.log('- Style preferences:', profile.styleProfile?.preferredStyles || 'None');
      console.log('- Colors love:', profile.styleProfile?.colorsLove || 'None');
      console.log('- Budget:', profile.lifestyle?.monthlyClothingBudget || 'None');
      console.log('- Last updated:', profile.styleProfile?.lastUpdated || 'Never');
    }

    console.log('\n📝 Step 2: Check if legacy user exists');
    const user = await User.findById(testUserId);
    console.log('Legacy User found:', !!user);
    
    if (user) {
      console.log('Legacy user data:');
      console.log('- Name:', user.name);
      console.log('- Onboarding styles:', user.onboarding?.preferredStyles || 'None');
      console.log('- Onboarding colors:', user.onboarding?.colorsLove || 'None');
      console.log('- Onboarding budget:', user.onboarding?.monthlyClothingBudget || 'None');
    }

    console.log('\n📝 Step 3: Test UserContextCache');
    const context = await UserContextCache.getUserContext(testUserId);
    console.log('Context loaded:', !!context);
    console.log('Context length:', context?.length || 0, 'characters');
    
    if (context) {
      console.log('Context content:');
      console.log(context);
    }

    console.log('\n📝 Step 4: Test with learning integration');
    const learningContext = await UserContextCache.getUserContextWithLearning(testUserId, 'Can you see my preferences?');
    console.log('Learning context loaded:', !!learningContext);
    console.log('Learning context length:', learningContext?.length || 0, 'characters');
    
    if (learningContext) {
      console.log('Learning context content:');
      console.log(learningContext);
    }

    console.log('\n📝 Step 5: Check if context includes user data');
    if (context) {
      const hasUserData = context.includes('USER CONTEXT:') || context.includes('preferred') || context.includes('colors') || context.includes('budget');
      console.log('Context includes user data:', hasUserData);
      
      if (!hasUserData) {
        console.log('❌ PROBLEM: User context is empty or missing user data');
        console.log('This means Jules cannot see user preferences');
      } else {
        console.log('✅ User context contains user data');
        console.log('Jules should be able to see preferences');
      }
    }

    console.log('\n🎯 Debug Complete!');
    console.log('\n💡 Next Steps:');
    if (!profile && !user) {
      console.log('- Create a test user with preferences');
    } else if (!context || context.length === 0) {
      console.log('- Fix UserContextCache loading');
    } else {
      console.log('- Check if chat controller is using the context properly');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugUserPreferences().catch(console.error);
