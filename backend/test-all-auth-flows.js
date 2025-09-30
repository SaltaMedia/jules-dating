const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Connect to database
async function connectDB() {
  try {
    // Use the same connection logic as the main server
    let MONGODB_URI = process.env.MONGODB_URI;
    const atlasUri = process.env.MONGODB_URI;
    
    if (atlasUri && atlasUri.includes('mongodb+srv://')) {
      if (!atlasUri.includes('/jules_dating')) {
        MONGODB_URI = atlasUri.replace('mongodb.net/?', 'mongodb.net/jules_dating?');
        console.log('🔧 Fixed Atlas URI with database name:', MONGODB_URI);
      } else {
        MONGODB_URI = atlasUri;
        console.log('✅ Atlas URI already has database name:', MONGODB_URI);
      }
    } else {
      MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating';
      console.log('🔧 Using local MongoDB URI:', MONGODB_URI);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Test 1: Registration Flow
async function testRegistration() {
  console.log('\n🧪 TEST 1: Registration Flow');
  
  const testEmail = `test-registration-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const response = await axios.post('http://localhost:4002/api/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Registration successful');
    console.log('   Status:', response.status);
    console.log('   Token length:', response.data.token ? response.data.token.length : 'No token');
    
    return { email: testEmail, password: testPassword, token: response.data.token };
  } catch (error) {
    console.log('❌ Registration failed');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: Login Flow (with registered user)
async function testLogin(email, password) {
  console.log('\n🧪 TEST 2: Login Flow');
  
  try {
    const response = await axios.post('http://localhost:4002/api/auth/login', {
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
    const response = await axios.get('http://localhost:4002/api/auth/me', {
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
    return false;
  }
}

// Test 4: OAuth Route (should redirect, not crash)
async function testOAuthRoute() {
  console.log('\n🧪 TEST 4: OAuth Route');
  
  try {
    const response = await axios.get('http://localhost:4002/api/auth/google', {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ OAuth route working (redirected)');
    console.log('   Status:', response.status);
    console.log('   Location header:', response.headers.location ? 'Present' : 'Missing');
    
    return true;
  } catch (error) {
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.log('✅ OAuth route working (redirected)');
      console.log('   Status:', error.response.status);
      console.log('   Location header:', error.response.headers.location ? 'Present' : 'Missing');
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
    const response = await axios.get('http://localhost:4002/api/auth/google/callback?code=invalid&state=test', {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept redirects
      }
    });
    
    console.log('✅ OAuth callback handled error gracefully (redirected)');
    console.log('   Status:', response.status);
    console.log('   Location header:', response.headers.location ? 'Present' : 'Missing');
    
    return true;
  } catch (error) {
    if (error.response?.status >= 300 && error.response?.status < 400) {
      console.log('✅ OAuth callback handled error gracefully (redirected)');
      console.log('   Status:', error.response.status);
      console.log('   Location header:', error.response.headers.location ? 'Present' : 'Missing');
      return true;
    } else {
      console.log('❌ OAuth callback failed');
      console.log('   Status:', error.response?.status);
      console.log('   Error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

// Test 6: Database User Verification
async function testDatabaseUser(email) {
  console.log('\n🧪 TEST 6: Database User Verification');
  
  try {
    const User = mongoose.model('User');
    const user = await User.findOne({ email: email });
    
    if (user) {
      console.log('✅ User found in database');
      console.log('   User ID:', user._id);
      console.log('   Email:', user.email);
      console.log('   Name:', user.name);
      console.log('   Has password:', !!user.password);
      console.log('   Password hash length:', user.password ? user.password.length : 0);
      
      // Test password comparison
      const testPassword = 'TestPassword123!';
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('   Password validation:', isValid ? '✅ Valid' : '❌ Invalid');
      
      return true;
    } else {
      console.log('❌ User not found in database');
      return false;
    }
  } catch (error) {
    console.log('❌ Database verification failed');
    console.log('   Error:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Authentication Tests for jules-dating');
  console.log('=' * 60);
  
  await connectDB();
  
  const results = {
    registration: false,
    login: false,
    getCurrentUser: false,
    oauthRoute: false,
    oauthCallback: false,
    databaseVerification: false
  };
  
  // Test registration
  const registrationResult = await testRegistration();
  results.registration = !!registrationResult;
  
  if (registrationResult) {
    // Test login with registered user
    const loginToken = await testLogin(registrationResult.email, registrationResult.password);
    results.login = !!loginToken;
    
    // Test get current user
    results.getCurrentUser = await testGetCurrentUser(loginToken);
    
    // Test database verification
    results.databaseVerification = await testDatabaseUser(registrationResult.email);
  }
  
  // Test OAuth routes
  results.oauthRoute = await testOAuthRoute();
  results.oauthCallback = await testOAuthCallback();
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' * 60);
  
  const tests = [
    { name: 'Registration', result: results.registration },
    { name: 'Login', result: results.login },
    { name: 'Get Current User', result: results.getCurrentUser },
    { name: 'OAuth Route', result: results.oauthRoute },
    { name: 'OAuth Callback', result: results.oauthCallback },
    { name: 'Database Verification', result: results.databaseVerification }
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
  
  await mongoose.disconnect();
  console.log('\n✅ Database disconnected');
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
