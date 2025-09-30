const axios = require('axios');

async function testOAuthFlow() {
  try {
    console.log('🔍 Testing Jules Dating OAuth Flow...\n');

    // Test 1: OAuth initiation
    console.log('🔍 Test 1: OAuth initiation...');
    
    try {
      const response = await axios.get('http://localhost:4002/api/auth/google', {
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      });
      
      console.log('✅ OAuth initiation successful');
      console.log('Redirect URL:', response.headers.location);
      
      // Check if it's redirecting to Google
      if (response.headers.location && response.headers.location.includes('accounts.google.com')) {
        console.log('✅ Correctly redirecting to Google OAuth');
      } else {
        console.log('❌ Not redirecting to Google OAuth');
      }
      
    } catch (error) {
      if (error.response?.status === 302) {
        console.log('✅ OAuth initiation successful (302 redirect)');
        console.log('Redirect URL:', error.response.headers.location);
      } else {
        console.log('❌ OAuth initiation failed:', error.message);
      }
    }

    // Test 2: OAuth callback endpoint (this will fail without proper auth, but we can check if it exists)
    console.log('\n🔍 Test 2: OAuth callback endpoint...');
    
    try {
      const response = await axios.get('http://localhost:4002/api/auth/google/callback', {
        maxRedirects: 0,
        validateStatus: (status) => status < 500 // Accept redirects and client errors
      });
      
      console.log('✅ OAuth callback endpoint exists');
      console.log('Status:', response.status);
      
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 401 || error.response?.status === 302) {
        console.log('✅ OAuth callback endpoint exists (expected error without proper auth)');
        console.log('Status:', error.response.status);
      } else {
        console.log('❌ OAuth callback endpoint issue:', error.message);
      }
    }

    // Test 3: Check if server is still running after OAuth tests
    console.log('\n🔍 Test 3: Server health check...');
    
    try {
      const response = await axios.get('http://localhost:4002/', {
        timeout: 5000
      });
      
      console.log('✅ Server is healthy and responding');
      console.log('Response:', response.data);
      
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      console.log('This might indicate the server crashed after OAuth tests');
    }

    console.log('\n🎯 OAUTH FLOW TEST SUMMARY:');
    console.log('- OAuth initiation should redirect to Google');
    console.log('- OAuth callback should handle authentication');
    console.log('- Server should remain stable after OAuth tests');

  } catch (error) {
    console.error('❌ OAuth flow test error:', error.message);
  }
}

// Run the test
testOAuthFlow().catch(console.error);
