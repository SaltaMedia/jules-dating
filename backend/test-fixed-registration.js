const axios = require('axios');

async function testFixedRegistration() {
  try {
    console.log('🔍 Testing Jules Dating Fixed Registration Process...\n');

    const registerUrl = 'http://localhost:4002/api/auth/register';
    const loginUrl = 'http://localhost:4002/api/auth/login';

    // Test with a new user
    const testEmail = 'jules-dating-test@example.com';
    const testPassword = 'DatingTest123!';
    
    const registrationData = {
      name: 'Jules Dating Test',
      email: testEmail,
      password: testPassword
    };

    console.log('🔍 Step 1: Registering new user in jules-dating...');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);

    try {
      const registerResponse = await axios.post(registerUrl, registrationData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ Registration successful!');
      console.log('Status:', registerResponse.status);
      console.log('User ID:', registerResponse.data.user.id);
      
      // Wait a moment for the database to be updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('\n🔍 Step 2: Testing login with same password...');
      
      try {
        const loginResponse = await axios.post(loginUrl, {
          email: testEmail,
          password: testPassword
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('Status:', loginResponse.status);
        console.log('Has token:', !!loginResponse.data.token);
        console.log('User email:', loginResponse.data.user.email);
        console.log('🎉 JULES DATING FIX WORKED! Registration and login are now working correctly!');
        
      } catch (loginError) {
        console.log('❌ Login still failed:');
        console.log('Status:', loginError.response?.status);
        console.log('Error:', loginError.response?.data?.message || loginError.message);
      }

    } catch (registerError) {
      if (registerError.response?.status === 409) {
        console.log('⚠️ User already exists - testing login with existing user...');
        
        try {
          const loginResponse = await axios.post(loginUrl, {
            email: testEmail,
            password: testPassword
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });

          console.log('✅ LOGIN SUCCESSFUL with existing user!');
          console.log('Status:', loginResponse.status);
          console.log('🎉 JULES DATING FIX WORKED!');
          
        } catch (loginError) {
          console.log('❌ Login failed with existing user:');
          console.log('Status:', loginError.response?.status);
          console.log('Error:', loginError.response?.data?.message || loginError.message);
        }
      } else {
        console.log('❌ Registration failed:');
        console.log('Status:', registerError.response?.status);
        console.log('Error:', registerError.response?.data?.message || registerError.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 JULES DATING FIX TEST SUMMARY:');
    console.log('- If both registration and login work: Fix successful!');
    console.log('- If registration works but login fails: Still have issues');
    console.log('- If both fail: Different problem');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

// Run the test
testFixedRegistration().catch(console.error);
