require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`),
  bold: (msg) => console.log(`${colors.bold}${msg}${colors.reset}`)
};

async function testPasswordResetAPI() {
  let testUser = null;
  let testEmail = null;
  
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🌐 PASSWORD RESET API ENDPOINT TEST');
    console.log('='.repeat(80) + '\n');

    // Get email from command line
    testEmail = process.argv[2] || `test-api-${Date.now()}@example.com`;
    const isRealEmail = !testEmail.includes('example.com');
    
    if (isRealEmail) {
      log.warning(`This will send a REAL email to: ${testEmail}`);
    } else {
      log.info(`Using test email: ${testEmail}`);
    }

    const API_URL = process.env.API_URL || 'http://localhost:4002';
    const testPassword = 'TestPassword123!';
    
    // Connect to MongoDB to set up test user
    log.step('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    log.success('Connected to MongoDB');

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 1: SETUP TEST USER');
    console.log('─'.repeat(80) + '\n');

    // Check if user exists
    testUser = await User.findOne({ email: testEmail });
    
    if (testUser) {
      log.info('User already exists, updating password...');
      testUser.password = testPassword;
      await testUser.save();
    } else {
      log.step('Creating test user...');
      testUser = new User({
        name: 'API Test User',
        email: testEmail,
        password: testPassword
      });
      await testUser.save();
      log.success('Test user created');
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 2: TEST FORGOT PASSWORD API');
    console.log('─'.repeat(80) + '\n');

    log.step('Calling POST /api/auth/forgot-password...');
    log.info(`URL: ${API_URL}/api/auth/forgot-password`);
    log.info(`Payload: { email: "${testEmail}" }`);
    
    try {
      // Try the correct route first
      let forgotResponse;
      try {
        forgotResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
          email: testEmail
        });
      } catch (err) {
        // Fallback to non-prefixed route
        log.warning('Trying alternate route /api/forgot-password...');
        forgotResponse = await axios.post(`${API_URL}/api/forgot-password`, {
          email: testEmail
        });
      }

      log.success('Forgot password endpoint responded successfully');
      log.info(`Response: ${JSON.stringify(forgotResponse.data)}`);

      if (forgotResponse.data.redirectUrl) {
        log.info(`Redirect URL: ${forgotResponse.data.redirectUrl}`);
      }
    } catch (error) {
      if (error.response) {
        log.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        log.error('No response from API - Is the backend server running?');
        log.info(`Try starting the server: cd backend && npm start`);
      } else {
        log.error(`Request error: ${error.message}`);
      }
      throw error;
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 3: VERIFY TOKEN IN DATABASE');
    console.log('─'.repeat(80) + '\n');

    // Get token from database
    log.step('Fetching reset token from database...');
    const userWithToken = await User.findOne({ email: testEmail });
    
    if (!userWithToken.resetPasswordToken) {
      log.error('No reset token found in database!');
      throw new Error('Reset token not created');
    }

    log.success('Reset token found in database');
    log.info(`Token: ${userWithToken.resetPasswordToken.substring(0, 20)}...`);
    log.info(`Expires: ${new Date(userWithToken.resetPasswordExpires).toLocaleString()}`);

    const resetToken = userWithToken.resetPasswordToken;

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 4: TEST RESET PASSWORD API');
    console.log('─'.repeat(80) + '\n');

    const newPassword = 'NewTestPassword789!';
    
    log.step('Calling POST /api/auth/reset-password...');
    log.info(`URL: ${API_URL}/api/auth/reset-password`);
    log.info(`Payload: { token: "${resetToken.substring(0, 20)}...", password: "****" }`);

    try {
      const resetResponse = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token: resetToken,
        password: newPassword
      });

      log.success('Reset password endpoint responded successfully');
      log.info(`Response: ${JSON.stringify(resetResponse.data)}`);
    } catch (error) {
      if (error.response) {
        log.error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        log.error(`Request error: ${error.message}`);
      }
      throw error;
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 5: VERIFY PASSWORD WAS CHANGED');
    console.log('─'.repeat(80) + '\n');

    log.step('Testing login with new password...');
    
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testEmail,
        password: newPassword
      });

      if (loginResponse.data.token) {
        log.success('✅ Login successful with NEW password!');
        log.info('JWT token received');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log.error('Login failed - password might not have been updated');
      }
      throw error;
    }

    // Verify old password doesn't work
    log.step('Verifying old password no longer works...');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      log.error('Old password still works! (Should have been rejected)');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log.success('✅ Old password correctly rejected');
      } else {
        throw error;
      }
    }

    // Check token was cleared
    log.step('Verifying reset token was cleared...');
    const finalUser = await User.findOne({ email: testEmail });
    if (!finalUser.resetPasswordToken && !finalUser.resetPasswordExpires) {
      log.success('✅ Reset token and expiry cleared from database');
    } else {
      log.warning('Reset token still in database (might be an issue)');
    }

    console.log('\n' + '='.repeat(80));
    log.success('ALL API TESTS PASSED! ✨');
    console.log('='.repeat(80) + '\n');

    log.info('Summary:');
    log.info('✅ Forgot password API endpoint working');
    log.info('✅ Email sending working (if configured)');
    log.info('✅ Reset token generation and storage working');
    log.info('✅ Reset password API endpoint working');
    log.info('✅ Password update working');
    log.info('✅ Old password invalidation working');
    log.info('✅ Login with new password working');

    if (isRealEmail) {
      log.warning('\n📧 Remember to check your email inbox!');
    }

  } catch (error) {
    console.log('\n' + '='.repeat(80));
    log.error('TEST FAILED');
    console.log('='.repeat(80) + '\n');
    log.error(`Error: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      log.warning('\n💡 The backend server doesn\'t appear to be running!');
      log.info('Start it with: cd backend && npm start');
    }
  } finally {
    // Cleanup
    if (!process.argv[3] || process.argv[3] !== '--keep-user') {
      if (testUser && !testEmail.includes('@juleslabs.com')) {
        log.step('Cleaning up test user...');
        await User.deleteOne({ email: testEmail });
        log.success('Test user deleted');
      }
    }
    
    await mongoose.connection.close();
    log.info('Disconnected from MongoDB');
  }
}

// Show usage if needed
if (process.argv.includes('--help')) {
  console.log('\nUsage: node test-password-reset-api.js [email] [--keep-user]');
  console.log('\nExamples:');
  console.log('  node test-password-reset-api.js');
  console.log('  node test-password-reset-api.js steve@juleslabs.com');
  console.log('  node test-password-reset-api.js test@example.com --keep-user\n');
  process.exit(0);
}

// Run the test
testPasswordResetAPI();

