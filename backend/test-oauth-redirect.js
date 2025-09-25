const axios = require('axios');

async function testOAuthRedirect() {
  try {
    console.log('🔍 Testing OAuth Redirect Flow...\n');

    // Test 1: Check the OAuth initiation
    console.log('🔍 Test 1: OAuth initiation...');
    
    try {
      const response = await axios.get('http://localhost:4002/api/auth/google', {
        maxRedirects: 0,
        validateStatus: (status) => status === 302
      });
      
      console.log('✅ OAuth initiation successful');
      console.log('Redirect URL:', response.headers.location);
      
      // Extract the redirect_uri from the Google OAuth URL
      const url = new URL(response.headers.location);
      const redirectUri = url.searchParams.get('redirect_uri');
      console.log('Redirect URI configured:', redirectUri);
      
      // Check if redirect_uri matches our callback
      if (redirectUri === 'http://localhost:4002/api/auth/google/callback') {
        console.log('✅ Redirect URI is correctly configured');
      } else {
        console.log('❌ Redirect URI mismatch:', redirectUri);
      }
      
    } catch (error) {
      if (error.response?.status === 302) {
        console.log('✅ OAuth initiation successful (302 redirect)');
        console.log('Redirect URL:', error.response.headers.location);
      } else {
        console.log('❌ OAuth initiation failed:', error.message);
      }
    }

    // Test 2: Check if frontend URL is accessible
    console.log('\n🔍 Test 2: Frontend URL accessibility...');
    
    const frontendUrl = 'http://localhost:3002';
    console.log('Testing frontend URL:', frontendUrl);
    
    try {
      const response = await axios.get(frontendUrl, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      console.log('✅ Frontend is accessible');
      console.log('Status:', response.status);
      
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Frontend responded with status:', error.response.status);
      } else {
        console.log('❌ Frontend not accessible:', error.message);
        console.log('This could cause OAuth redirect issues');
      }
    }

    // Test 3: Check if the auth callback route exists on frontend
    console.log('\n🔍 Test 3: Frontend auth callback route...');
    
    try {
      const response = await axios.get(`${frontendUrl}/auth/callback`, {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      console.log('✅ Frontend auth callback route exists');
      console.log('Status:', response.status);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ Frontend auth callback route not found (404)');
        console.log('This will cause OAuth redirect to fail');
      } else if (error.response) {
        console.log('⚠️ Frontend auth callback route status:', error.response.status);
      } else {
        console.log('❌ Frontend auth callback route error:', error.message);
      }
    }

    // Test 4: Simulate the OAuth callback flow
    console.log('\n🔍 Test 4: Simulating OAuth callback...');
    
    try {
      // This will fail because we don't have a real OAuth code, but we can see what happens
      const response = await axios.get('http://localhost:4002/api/auth/google/callback?code=test&state=test', {
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: (status) => status < 500
      });
      
      console.log('✅ OAuth callback endpoint responded');
      console.log('Status:', response.status);
      
    } catch (error) {
      if (error.response?.status === 302) {
        console.log('✅ OAuth callback redirecting (expected with invalid code)');
        console.log('Redirect URL:', error.response.headers.location);
        
        // Check if it's redirecting to the frontend
        if (error.response.headers.location?.includes('localhost:3002')) {
          console.log('✅ Redirecting to correct frontend URL');
        } else {
          console.log('❌ Redirecting to wrong URL:', error.response.headers.location);
        }
      } else {
        console.log('❌ OAuth callback error:', error.message);
      }
    }

    console.log('\n🎯 OAUTH REDIRECT TEST SUMMARY:');
    console.log('- OAuth initiation should redirect to Google');
    console.log('- Google should redirect back to /api/auth/google/callback');
    console.log('- Backend should redirect to frontend /auth/callback with token');
    console.log('- Frontend should handle the token and complete login');

  } catch (error) {
    console.error('❌ OAuth redirect test error:', error.message);
  }
}

// Run the test
testOAuthRedirect().catch(console.error);
