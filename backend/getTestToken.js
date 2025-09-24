const axios = require('axios');

const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123'
};

async function getTestToken() {
  try {
    console.log('Logging in test user...');
    
    const response = await axios.post('http://localhost:4001/api/auth/login', TEST_USER);
    
    if (response.status === 200) {
      console.log('✅ Login successful!');
      console.log('🔑 Token:', response.data.token);
      console.log('\nTo use this token in the frontend:');
      console.log('1. Open browser dev tools');
      console.log('2. Go to Application/Storage tab');
      console.log('3. Set localStorage.token = "' + response.data.token + '"');
      console.log('4. Refresh the page');
    } else {
      console.log('❌ Failed to login');
    }
  } catch (error) {
    console.error('❌ Error logging in:', error.response?.data || error.message);
  }
}

getTestToken();


