const axios = require('axios');

const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123'
};

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    const response = await axios.post('http://localhost:4001/api/auth/register', TEST_USER);
    
    if (response.status === 201) {
      console.log('✅ Test user created successfully!');
      console.log('📧 Email:', TEST_USER.email);
      console.log('🔑 Password:', TEST_USER.password);
      console.log('\nYou can now use these credentials to test the onboarding flow.');
    } else {
      console.log('❌ Failed to create test user');
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️ Test user already exists!');
      console.log('📧 Email:', TEST_USER.email);
      console.log('🔑 Password:', TEST_USER.password);
      console.log('\nYou can use these credentials to test the onboarding flow.');
    } else {
      console.error('❌ Error creating test user:', error.message);
      console.log('\nMake sure your backend server is running on http://localhost:4001');
    }
  }
}

createTestUser();
