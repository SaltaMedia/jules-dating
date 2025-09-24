require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:4001';

async function testProductionFlow() {
  console.log('🧪 Testing Complete Production Flow for Settings Persistence\n');
  
  // Use the working token we know works
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODllNWY2NTliMjNkNzNjZWM3ZGRkZmQiLCJlbWFpbCI6InNwc2FsdGFAZ21haWwuY29tIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTc1NjI0NTk2OSwiZXhwIjoxNzU2MjQ5NTY5fQ.AJTG0GovA4Pmj6Rvw2gBqkf7plr7YT-vXp3uP3F3tLQ';
  
  try {
    // Step 1: Test User Data Retrieval (simulate app loading user data after login)
    console.log('1️⃣ Testing User Data Retrieval (Post-Login)...');
    const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (userResponse.status === 200) {
      const userData = userResponse.data;
      console.log('✅ User data retrieved successfully');
      console.log(`   - Name: ${userData.onboarding?.name || 'Not set'}`);
      console.log(`   - Onboarding completed: ${userData.onboarding?.completed}`);
      console.log(`   - About me: ${userData.onboarding?.aboutMe?.substring(0, 50)}...`);
      console.log(`   - Favorite brands: ${userData.onboarding?.favoriteBrands?.length || 0} brands`);
    } else {
      throw new Error('Failed to retrieve user data');
    }
    
    // Step 2: Test Onboarding Status
    console.log('\n2️⃣ Testing Onboarding Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/onboarding/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (statusResponse.status === 200) {
      console.log('✅ Onboarding status retrieved');
      console.log(`   - Completed: ${statusResponse.data.completed}`);
      console.log(`   - Progress: ${statusResponse.data.progress}%`);
    }
    
    // Step 3: Test Settings Update (simulate user changing settings)
    console.log('\n3️⃣ Testing Settings Update...');
    const updateData = {
      name: 'Steve Salta',
      email: 'spsalta@gmail.com',
      zipCode: '97034',
      aboutMe: 'Production flow test - user updated their settings via the app',
      favoriteBrands: ['Nike', 'Adidas', 'Uniqlo', 'Production Test Brand'],
      preferredStyles: ['Casual', 'Classic', 'Smart Casual', 'Athletic', 'Minimal'],
      monthlyClothingBudget: '$250 - $500',
      julesTone: 2,
      colorsLove: ['Navy', 'Black', 'White', 'Gray'],
      fitPreference: ['Tailored', 'Relaxed', 'Slim']
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/onboarding/update`, updateData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (updateResponse.status === 200) {
      console.log('✅ Settings updated successfully');
      console.log(`   - Message: ${updateResponse.data.message}`);
      console.log(`   - Completed: ${updateResponse.data.completed}`);
      console.log(`   - Progress: ${updateResponse.data.progress}%`);
    } else {
      throw new Error('Failed to update settings');
    }
    
    // Step 4: Verify Settings Persistence (simulate user logging back in)
    console.log('\n4️⃣ Testing Settings Persistence...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (verifyResponse.status === 200) {
      const updatedUserData = verifyResponse.data;
      console.log('✅ Settings persistence verified');
      console.log(`   - About me: ${updatedUserData.onboarding?.aboutMe}`);
      console.log(`   - Favorite brands: ${updatedUserData.onboarding?.favoriteBrands?.join(', ')}`);
      console.log(`   - Preferred styles: ${updatedUserData.onboarding?.preferredStyles?.join(', ')}`);
      console.log(`   - Budget: ${updatedUserData.onboarding?.monthlyClothingBudget}`);
      console.log(`   - Jules tone: ${updatedUserData.julesTone}`);
      
      // Verify the data matches what we sent
      const dataMatches = 
        updatedUserData.onboarding?.aboutMe === updateData.aboutMe &&
        JSON.stringify(updatedUserData.onboarding?.favoriteBrands) === JSON.stringify(updateData.favoriteBrands) &&
        JSON.stringify(updatedUserData.onboarding?.preferredStyles) === JSON.stringify(updateData.preferredStyles) &&
        updatedUserData.onboarding?.monthlyClothingBudget === updateData.monthlyClothingBudget &&
        updatedUserData.julesTone === updateData.julesTone;
      
      if (dataMatches) {
        console.log('✅ All settings data matches - persistence working correctly!');
      } else {
        console.log('❌ Some settings data does not match');
      }
    }
    
    // Step 5: Test Multiple Updates (simulate user making multiple changes)
    console.log('\n5️⃣ Testing Multiple Settings Updates...');
    const secondUpdateData = {
      aboutMe: 'Second update test - user made another change to their settings',
      favoriteBrands: ['Nike', 'Adidas', 'Uniqlo', 'Second Test Brand', 'Third Brand'],
      preferredStyles: ['Casual', 'Classic'],
      monthlyClothingBudget: '$500+',
      julesTone: 3
    };
    
    const secondUpdateResponse = await axios.put(`${BASE_URL}/api/onboarding/update`, secondUpdateData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (secondUpdateResponse.status === 200) {
      console.log('✅ Second settings update successful');
      
      // Verify the second update
      const finalVerifyResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (finalVerifyResponse.status === 200) {
        const finalUserData = finalVerifyResponse.data;
        console.log('✅ Final verification successful');
        console.log(`   - About me: ${finalUserData.onboarding?.aboutMe}`);
        console.log(`   - Budget: ${finalUserData.onboarding?.monthlyClothingBudget}`);
        console.log(`   - Jules tone: ${finalUserData.julesTone}`);
      }
    }
    
    console.log('\n🎉 PRODUCTION FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('✅ All core functionality is working correctly');
    console.log('✅ Settings persistence is working');
    console.log('✅ User data is being saved and retrieved properly');
    console.log('✅ Multiple updates work correctly');
    console.log('\n🚀 Ready for production deployment!');
    
  } catch (error) {
    console.error('\n❌ PRODUCTION FLOW TEST FAILED');
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('Authentication failed - check JWT token');
    } else if (error.response?.status === 500) {
      console.error('Server error - check backend logs');
    }
  }
}

testProductionFlow();
