const axios = require('axios');

// Test the exact scenario: register a user and immediately try to login
async function testRegistrationThenLogin() {
  console.log('🧪 Testing Registration → Login Flow in Production');
  
  const testEmail = `production-test-${Date.now()}@example.com`;
  const testPassword = 'ProductionTest123!';
  
  console.log('📧 Test email:', testEmail);
  console.log('🔑 Test password:', testPassword);
  
  try {
    // Step 1: Register user
    console.log('\n1️⃣ Registering user...');
    const registerResponse = await axios.post('https://jules-dating.onrender.com/api/auth/register', {
      name: 'Production Test User',
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Registration successful');
    console.log('   Status:', registerResponse.status);
    console.log('   Token length:', registerResponse.data.token ? registerResponse.data.token.length : 'No token');
    
    // Step 2: Wait a moment for database to be consistent
    console.log('\n⏳ Waiting 2 seconds for database consistency...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Try to login with the same credentials
    console.log('\n2️⃣ Attempting login with same credentials...');
    const loginResponse = await axios.post('https://jules-dating.onrender.com/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login successful');
    console.log('   Status:', loginResponse.status);
    console.log('   Token length:', loginResponse.data.token ? loginResponse.data.token.length : 'No token');
    
    return true;
    
  } catch (error) {
    console.log('❌ Test failed');
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.message || error.response.data?.error || 'Unknown error');
      
      if (error.response.data) {
        console.log('   Full error response:', JSON.stringify(error.response.data, null, 2));
      }
      
      // Check if it's a login error specifically
      if (error.config?.url?.includes('/login')) {
        console.log('\n🔍 LOGIN ERROR ANALYSIS:');
        console.log('   This suggests the double-hashing fix is NOT deployed to production');
        console.log('   Registration worked (password was hashed correctly during signup)');
        console.log('   Login failed (password comparison fails because of double-hashing)');
        console.log('\n💡 SOLUTION: Deploy the double-hashing fix to production backend');
      }
    } else {
      console.log('   Network error:', error.message);
    }
    
    return false;
  }
}

// Test OAuth callback error
async function testOAuthCallbackError() {
  console.log('\n🧪 Testing OAuth Callback Error Handling');
  
  try {
    const response = await axios.get('https://jules-dating.onrender.com/api/auth/google/callback?code=invalid&state=test', {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ OAuth callback handled error gracefully');
    console.log('   Status:', response.status);
    console.log('   Redirect URL:', response.headers.location);
    
    return true;
  } catch (error) {
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.log('✅ OAuth callback handled error gracefully');
      console.log('   Status:', error.response.status);
      console.log('   Redirect URL:', error.response.headers.location);
      return true;
    } else {
      console.log('❌ OAuth callback crashed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.message || error.message);
      
      if (error.response?.status === 500) {
        console.log('\n🔍 OAUTH CALLBACK ERROR ANALYSIS:');
        console.log('   The OAuth callback is crashing with 500 error');
        console.log('   This suggests the OAuth error handling fix is NOT deployed to production');
        console.log('\n💡 SOLUTION: Deploy the OAuth error handling fix to production backend');
      }
      
      return false;
    }
  }
}

// Main test function
async function runProductionDebugTests() {
  console.log('🚀 Production Authentication Debug Tests');
  console.log('=' * 50);
  
  const results = {
    registrationLogin: false,
    oauthCallback: false
  };
  
  // Test registration → login flow
  results.registrationLogin = await testRegistrationThenLogin();
  
  // Test OAuth callback error handling
  results.oauthCallback = await testOAuthCallbackError();
  
  // Summary
  console.log('\n' + '=' * 50);
  console.log('📊 PRODUCTION DEBUG RESULTS');
  console.log('=' * 50);
  
  console.log('Registration → Login Flow:', results.registrationLogin ? '✅ WORKING' : '❌ BROKEN');
  console.log('OAuth Callback Error Handling:', results.oauthCallback ? '✅ WORKING' : '❌ BROKEN');
  
  if (!results.registrationLogin || !results.oauthCallback) {
    console.log('\n⚠️  PRODUCTION ISSUES DETECTED:');
    console.log('   The fixes we made locally are NOT deployed to production');
    console.log('   Users are getting rejected because:');
    
    if (!results.registrationLogin) {
      console.log('   - Login fails after registration (double-hashing issue)');
    }
    
    if (!results.oauthCallback) {
      console.log('   - OAuth callback crashes (error handling issue)');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Deploy the backend fixes to production (Render)');
    console.log('   2. Deploy the Vercel proxy fixes to production');
    console.log('   3. Test again to confirm all issues are resolved');
  } else {
    console.log('\n🎉 All production authentication flows are working!');
  }
}

// Run the tests
runProductionDebugTests().catch(error => {
  console.error('💥 Debug test suite failed:', error);
  process.exit(1);
});
