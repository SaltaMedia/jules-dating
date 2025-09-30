const axios = require('axios');

async function debugLoginIssue() {
  try {
    console.log('🔍 Debugging Jules Dating Login Issue...\n');

    const registerUrl = 'http://localhost:4002/api/auth/register';
    const loginUrl = 'http://localhost:4002/api/auth/login';

    // Test 1: Register a new user and immediately try to login
    console.log('🔍 Test 1: Register new user and immediate login...');
    
    const testEmail = 'debug-login-test@example.com';
    const testPassword = 'DebugLogin123!';
    
    const registrationData = {
      name: 'Debug Login Test',
      email: testEmail,
      password: testPassword
    };

    try {
      console.log('Registering user...');
      const registerResponse = await axios.post(registerUrl, registrationData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ Registration successful!');
      console.log('Status:', registerResponse.status);
      console.log('User ID:', registerResponse.data.user.id);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('\nAttempting login...');
      const loginResponse = await axios.post(loginUrl, {
        email: testEmail,
        password: testPassword
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ Login successful!');
      console.log('Status:', loginResponse.status);
      console.log('Has token:', !!loginResponse.data.token);
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ User already exists - testing login with existing user...');
        
        try {
          const loginResponse = await axios.post(loginUrl, {
            email: testEmail,
            password: testPassword
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });

          console.log('✅ Login successful with existing user!');
          console.log('Status:', loginResponse.status);
          
        } catch (loginError) {
          console.log('❌ Login failed with existing user:');
          console.log('Status:', loginError.response?.status);
          console.log('Error:', loginError.response?.data?.message || loginError.message);
          
          // Try different passwords
          console.log('\n🔍 Testing different passwords...');
          const passwords = ['DebugLogin123!', 'debuglogin123!', 'DEBUGLOGIN123!', 'DebugLogin123', 'debuglogin123'];
          
          for (const password of passwords) {
            try {
              const testResponse = await axios.post(loginUrl, {
                email: testEmail,
                password: password
              }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
              });

              if (testResponse.status === 200) {
                console.log(`🎯 FOUND WORKING PASSWORD: "${password}"`);
                break;
              }
            } catch (testError) {
              // Ignore errors, just testing
            }
          }
        }
      } else {
        console.log('❌ Registration failed:');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data?.message || error.message);
      }
    }

    // Test 2: Test with a known working user
    console.log('\n🔍 Test 2: Testing with steve@juleslabs.com...');
    
    try {
      const loginResponse = await axios.post(loginUrl, {
        email: 'steve@juleslabs.com',
        password: 'admin123'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log('✅ Login successful with steve@juleslabs.com!');
      console.log('Status:', loginResponse.status);
      
    } catch (error) {
      console.log('❌ Login failed with steve@juleslabs.com:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Debug script error:', error.message);
  }
}

// Run the test
debugLoginIssue().catch(console.error);
