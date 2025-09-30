const axios = require('axios');

// Test configuration
const BACKEND_URL = 'https://jules-dating.onrender.com'; // Production URL
const FRONTEND_URL = 'https://dating.juleslabs.com'; // Production URL

// Test 1: Registration Flow
async function testRegistration() {
  console.log('\n🧪 TEST 1: Registration Flow');
  
  const testEmail = `test-registration-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Registration successful');
    console.log('   Status:', response.status);
    console.log('   Token length:', response.data.token ? response.data.token.length : 'No token');
    console.log('   User email:', response.data.user?.email);
    
    return { email: testEmail, password: testPassword, token: response.data.token };
  } catch (error) {
    console.log('❌ Registration failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('   Full error:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 2: Login Flow (with registered user)
async function testLogin(email, password) {
  console.log('\n🧪 TEST 2: Login Flow');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: email,
      password: password
    });
    
    console.log('✅ Login successful');
    console.log('   Status:', response.status);
    console.log('   Token length:', response.data.token ? response.data.token.length : 'No token');
    console.log('   User email:', response.data.user?.email);
    
    return response.data.token;
  } catch (error) {
    console.log('❌ Login failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('   Full error:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Test 3: Get Current User (with token)
async function testGetCurrentUser(token) {
  console.log('\n🧪 TEST 3: Get Current User');
  
  if (!token) {
    console.log('❌ No token provided');
    return false;
  }
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Get current user successful');
    console.log('   Status:', response.status);
    console.log('   User email:', response.data.email);
    console.log('   User name:', response.data.name);
    
    return true;
  } catch (error) {
    console.log('❌ Get current user failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('   Full error:', JSON.stringify(error.response.data, null, 2));
    }
    return false;
  }
}

// Test 4: OAuth Route (should redirect, not crash)
async function testOAuthRoute() {
  console.log('\n🧪 TEST 4: OAuth Route');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/google`, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ OAuth route working (redirected)');
    console.log('   Status:', response.status);
    console.log('   Location header:', response.headers.location ? 'Present' : 'Missing');
    if (response.headers.location) {
      console.log('   Redirect URL:', response.headers.location);
    }
    
    return true;
  } catch (error) {
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.log('✅ OAuth route working (redirected)');
      console.log('   Status:', error.response.status);
      console.log('   Location header:', error.response.headers.location ? 'Present' : 'Missing');
      if (error.response.headers.location) {
        console.log('   Redirect URL:', error.response.headers.location);
      }
      return true;
    } else {
      console.log('❌ OAuth route failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Test 5: OAuth Callback (should handle errors gracefully)
async function testOAuthCallback() {
  console.log('\n🧪 TEST 5: OAuth Callback Error Handling');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/google/callback?code=invalid&state=test`, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ OAuth callback handled error gracefully (redirected)');
    console.log('   Status:', response.status);
    console.log('   Location header:', response.headers.location ? 'Present' : 'Missing');
    if (response.headers.location) {
      console.log('   Redirect URL:', response.headers.location);
    }
    
    return true;
  } catch (error) {
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.log('✅ OAuth callback handled error gracefully (redirected)');
      console.log('   Status:', error.response.status);
      console.log('   Location header:', error.response.headers.location ? 'Present' : 'Missing');
      if (error.response.headers.location) {
        console.log('   Redirect URL:', error.response.headers.location);
      }
      return true;
    } else {
      console.log('❌ OAuth callback failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Test 6: Health Check
async function testHealthCheck() {
  console.log('\n🧪 TEST 6: Health Check');
  
  try {
    // Try different health endpoints
    const endpoints = ['/api/health', '/health', '/', '/api/'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${BACKEND_URL}${endpoint}`, { timeout: 10000 });
        console.log(`✅ Health check successful at ${endpoint}`);
        console.log('   Status:', response.status);
        if (response.data) {
          console.log('   Data:', JSON.stringify(response.data).substring(0, 200));
        }
        return true;
      } catch (err) {
        console.log(`   ${endpoint}: ${err.response?.status || 'No response'}`);
      }
    }
    
    console.log('❌ All health check endpoints failed');
    return false;
  } catch (error) {
    console.log('❌ Health check failed');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Production Authentication Tests for jules-dating');
  console.log('📍 Backend URL:', BACKEND_URL);
  console.log('📍 Frontend URL:', FRONTEND_URL);
  console.log('=' * 60);
  
  const results = {
    healthCheck: false,
    registration: false,
    login: false,
    getCurrentUser: false,
    oauthRoute: false,
    oauthCallback: false
  };
  
  // Test health check first
  results.healthCheck = await testHealthCheck();
  
  if (!results.healthCheck) {
    console.log('❌ Server is not responding. Check if backend is running.');
    return;
  }
  
  // Test registration
  const registrationResult = await testRegistration();
  results.registration = !!registrationResult;
  
  if (registrationResult) {
    // Test login with registered user
    const loginToken = await testLogin(registrationResult.email, registrationResult.password);
    results.login = !!loginToken;
    
    // Test get current user
    results.getCurrentUser = await testGetCurrentUser(loginToken);
  }
  
  // Test OAuth routes
  results.oauthRoute = await testOAuthRoute();
  results.oauthCallback = await testOAuthCallback();
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' * 60);
  
  const tests = [
    { name: 'Health Check', result: results.healthCheck },
    { name: 'Registration', result: results.registration },
    { name: 'Login', result: results.login },
    { name: 'Get Current User', result: results.getCurrentUser },
    { name: 'OAuth Route', result: results.oauthRoute },
    { name: 'OAuth Callback', result: results.oauthCallback }
  ];
  
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test.name}`);
  });
  
  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log('\n🎯 Overall Result:', `${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All authentication flows are working correctly!');
  } else {
    console.log('⚠️  Some authentication flows are failing. Check the errors above.');
  }
  
  console.log('\n💡 To test production, update the URLs at the top of this script:');
  console.log('   BACKEND_URL = "https://jules-dating-backend.onrender.com"');
  console.log('   FRONTEND_URL = "https://dating.juleslabs.com"');
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
