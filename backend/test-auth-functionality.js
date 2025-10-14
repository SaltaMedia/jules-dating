require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

const API_URL = process.env.API_URL || 'http://localhost:4002';

console.log('\n=== Testing Existing Auth Functionality ===\n');

async function testAuthFunctionality() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    
    const testEmail = `auth-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Test 1: Register
    console.log('1️⃣  Testing REGISTER...');
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Auth Test User',
      email: testEmail,
      password: testPassword
    });
    
    if (registerResponse.data.token) {
      console.log('✅ Register works - JWT token received\n');
    } else {
      throw new Error('No token in register response');
    }
    
    // Test 2: Login
    console.log('2️⃣  Testing LOGIN...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login works - JWT token received\n');
    } else {
      throw new Error('No token in login response');
    }
    
    // Test 3: Get current user (protected route)
    console.log('3️⃣  Testing PROTECTED ROUTE (GET /me)...');
    const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginResponse.data.token}`
      }
    });
    
    if (meResponse.data.email === testEmail) {
      console.log('✅ Protected route works - User data retrieved\n');
    } else {
      throw new Error('User data mismatch');
    }
    
    // Test 4: Wrong password
    console.log('4️⃣  Testing LOGIN with WRONG PASSWORD...');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: testEmail,
        password: 'WrongPassword123!'
      });
      throw new Error('Should have rejected wrong password');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Wrong password correctly rejected\n');
      } else {
        throw error;
      }
    }
    
    // Cleanup
    await User.deleteOne({ email: testEmail });
    
    console.log('===========================================');
    console.log('✅ ALL AUTH TESTS PASSED!');
    console.log('===========================================\n');
    console.log('✅ User registration working');
    console.log('✅ User login working');
    console.log('✅ Protected routes working');
    console.log('✅ Password validation working');
    console.log('✅ No regressions detected\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testAuthFunctionality();

