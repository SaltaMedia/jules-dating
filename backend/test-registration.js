const axios = require('axios');

const API_BASE_URL = 'http://localhost:4001';

async function testRegistration() {
  console.log('🧪 Testing Registration Validation...\n');

  const tests = [
    {
      name: 'Valid Registration',
      data: {
        name: 'Test User',
        email: 'valid@example.com',
        password: 'Password123'
      },
      expectedStatus: 201
    },
    {
      name: 'Weak Password (no uppercase)',
      data: {
        name: 'Test User',
        email: 'weak1@example.com',
        password: 'password123'
      },
      expectedStatus: 400
    },
    {
      name: 'Weak Password (no lowercase)',
      data: {
        name: 'Test User',
        email: 'weak2@example.com',
        password: 'PASSWORD123'
      },
      expectedStatus: 400
    },
    {
      name: 'Weak Password (no number)',
      data: {
        name: 'Test User',
        email: 'weak3@example.com',
        password: 'Password'
      },
      expectedStatus: 400
    },
    {
      name: 'Short Password',
      data: {
        name: 'Test User',
        email: 'short@example.com',
        password: 'Pass1'
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid Email',
      data: {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123'
      },
      expectedStatus: 400
    },
    {
      name: 'Short Name',
      data: {
        name: 'A',
        email: 'shortname@example.com',
        password: 'Password123'
      },
      expectedStatus: 400
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, test.data);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.status}`);
        if (response.data.token) {
          console.log(`   Token generated: ${response.data.token.substring(0, 20)}...`);
        }
      } else {
        console.log(`❌ FAIL - Expected ${test.expectedStatus}, got ${response.status}`);
      }
    } catch (error) {
      if (error.response?.status === test.expectedStatus) {
        console.log(`✅ PASS - Expected error: ${error.response.status}`);
        if (error.response.data.details) {
          console.log(`   Validation errors: ${error.response.data.details.map(e => e.message).join(', ')}`);
        } else if (error.response.data.message) {
          console.log(`   Error message: ${error.response.data.message}`);
        }
      } else {
        console.log(`❌ FAIL - Expected ${test.expectedStatus}, got ${error.response?.status || 'Network Error'}`);
        console.log(`   Error: ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('🎉 Registration validation tests completed!');
}

testRegistration().catch(console.error);
