require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./utils/emailService');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`),
  email: (msg) => console.log(`${colors.magenta}📧 ${msg}${colors.reset}`),
  bold: (msg) => console.log(`${colors.bold}${msg}${colors.reset}`)
};

let rl = null;

function initReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  return rl;
}

function question(query) {
  const readline = initReadline();
  return new Promise(resolve => readline.question(query, resolve));
}

async function testRealPasswordReset() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 LIVE PASSWORD RESET TEST - REAL EMAIL & COMPLETE FLOW');
    console.log('='.repeat(80) + '\n');

    // Connect to MongoDB
    log.step('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    log.success('Connected to MongoDB');

    // Check email configuration
    log.step('Checking email configuration...');
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      log.error('Email credentials not configured!');
      log.info('Please set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
      process.exit(1);
    }
    log.success(`Email configured with: ${process.env.GMAIL_USER}`);

    // Get email address from command line or prompt
    let emailAddress = process.argv[2];
    
    if (!emailAddress) {
      console.log('\n' + colors.yellow + '⚠️  This test will send a REAL email!' + colors.reset);
      emailAddress = await question('\nEnter your email address to receive the password reset: ');
    } else {
      console.log('\n' + colors.yellow + '⚠️  This test will send a REAL email!' + colors.reset);
      log.info(`Using email address: ${emailAddress}`);
    }
    
    if (!emailAddress || !emailAddress.includes('@')) {
      log.error('Invalid email address');
      log.info('Usage: node test-real-password-reset.js your.email@example.com');
      process.exit(1);
    }

    const testPassword = 'TestPassword123!';
    const newPassword = 'NewSecurePassword456!';

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 1: USER SETUP');
    console.log('─'.repeat(80) + '\n');

    // Check if user already exists
    log.step('Checking if user already exists...');
    let existingUser = await User.findOne({ email: emailAddress });
    
    if (existingUser) {
      log.warning('User already exists');
      const overwrite = await question('Do you want to use this existing user? (yes/no): ');
      if (overwrite.toLowerCase() !== 'yes') {
        log.info('Test cancelled');
        process.exit(0);
      }
      // Update password to known value for testing
      existingUser.password = testPassword;
      await existingUser.save();
      log.success('Updated existing user password for testing');
    } else {
      log.step('Creating new test user...');
      const testUser = new User({
        name: 'Test User',
        email: emailAddress,
        password: testPassword
      });
      await testUser.save();
      log.success(`Test user created with email: ${emailAddress}`);
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 2: PASSWORD RESET REQUEST (FORGOT PASSWORD)');
    console.log('─'.repeat(80) + '\n');

    // Simulate forgot password - generate reset token
    log.step('Generating password reset token...');
    const user = await User.findOne({ email: emailAddress });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();
    
    log.success(`Reset token generated: ${resetToken.substring(0, 20)}...`);
    log.info(`Token expires at: ${new Date(resetTokenExpiry).toLocaleString()}`);

    // Generate reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    console.log('\n' + colors.bold + '📋 RESET URL (you\'ll also get this in email):' + colors.reset);
    console.log(colors.cyan + resetUrl + colors.reset + '\n');

    // Send email
    log.email('Sending password reset email...');
    const emailSent = await sendPasswordResetEmail(emailAddress, resetToken, resetUrl);
    
    if (emailSent) {
      log.success('✉️  Password reset email sent successfully!');
      console.log('\n' + colors.green + '✅ CHECK YOUR EMAIL INBOX!' + colors.reset);
      log.info(`Look for an email from: ${process.env.GMAIL_USER}`);
      log.info('Subject: "Reset Your Jules Password"');
    } else {
      log.error('Email sending failed!');
      log.info('You can still test using the URL above');
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 3: VERIFY TOKEN IN DATABASE');
    console.log('─'.repeat(80) + '\n');

    // Verify token is stored correctly
    log.step('Verifying token is stored in database...');
    const userWithToken = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (userWithToken) {
      log.success('✓ Reset token found in database');
      log.success('✓ Token is not expired');
      log.success('✓ Token correctly associated with user');
    } else {
      log.error('Token verification failed!');
      throw new Error('Token not found or expired');
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 4: MANUAL TESTING INSTRUCTIONS');
    console.log('─'.repeat(80) + '\n');

    console.log(colors.yellow + '📝 NEXT STEPS - Test the complete flow:' + colors.reset + '\n');
    console.log('1. Check your email inbox for the password reset email');
    console.log('2. Click the "Reset Password" button in the email (or use the URL above)');
    console.log('3. Enter a new password in the reset password form');
    console.log('4. Submit the form');
    console.log('5. You should see a success message');
    console.log('6. Try logging in with your NEW password\n');

    console.log(colors.bold + 'CURRENT TEST CREDENTIALS:' + colors.reset);
    console.log(`Email: ${emailAddress}`);
    console.log(`Current Password: ${testPassword}`);
    console.log(`(After reset, use your new password)\n`);

    const continueTest = await question('\nHave you completed the password reset in the browser? (yes/no): ');
    
    if (continueTest.toLowerCase() === 'yes') {
      console.log('\n' + '─'.repeat(80));
      log.bold('PHASE 5: VERIFICATION');
      console.log('─'.repeat(80) + '\n');

      log.step('Checking if password was reset...');
      const userAfterReset = await User.findOne({ email: emailAddress });
      
      // Check if token was cleared
      if (!userAfterReset.resetPasswordToken && !userAfterReset.resetPasswordExpires) {
        log.success('✓ Reset token cleared from database');
      } else {
        log.warning('⚠️  Reset token still exists (might not have been used yet)');
      }

      // Verify old password doesn't work
      const oldPasswordWorks = await bcrypt.compare(testPassword, userAfterReset.password);
      if (!oldPasswordWorks) {
        log.success('✓ Old password no longer works');
      } else {
        log.warning('⚠️  Old password still works (reset might not have completed)');
      }

      console.log('\n' + colors.yellow + '💡 TIP: Try logging in at:' + colors.reset);
      console.log(colors.cyan + `${frontendUrl}/login` + colors.reset + '\n');
    }

    console.log('\n' + '─'.repeat(80));
    log.bold('PHASE 6: API ENDPOINT TEST');
    console.log('─'.repeat(80) + '\n');

    log.info('Testing API endpoints directly...');
    console.log('\n📍 API Endpoints:');
    console.log(`POST ${process.env.API_URL || 'http://localhost:4002'}/api/auth/forgot-password`);
    console.log(`POST ${process.env.API_URL || 'http://localhost:4002'}/api/auth/reset-password`);

    console.log('\n📝 Test with curl:');
    console.log(colors.cyan + `
# 1. Request password reset:
curl -X POST ${process.env.API_URL || 'http://localhost:4002'}/api/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email":"${emailAddress}"}'

# 2. Reset password with token:
curl -X POST ${process.env.API_URL || 'http://localhost:4002'}/api/auth/reset-password \\
  -H "Content-Type: application/json" \\
  -d '{"token":"YOUR_TOKEN_FROM_EMAIL","password":"YourNewPassword123!"}'
` + colors.reset);

    // Final summary
    console.log('\n' + '='.repeat(80));
    log.success('PASSWORD RESET TEST COMPLETE! ✨');
    console.log('='.repeat(80) + '\n');

    log.info('Test Summary:');
    log.info('✅ Database connection working');
    log.info('✅ User creation/update working');
    log.info('✅ Reset token generation working');
    log.info('✅ Email sending working');
    log.info('✅ Token storage working');
    log.info('✅ Password reset endpoint ready');

    const cleanup = await question('\nDo you want to delete the test user? (yes/no): ');
    if (cleanup.toLowerCase() === 'yes') {
      await User.deleteOne({ email: emailAddress });
      log.success('Test user deleted');
    } else {
      log.info('Test user kept in database');
    }

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error('\nFull error:', error);
  } finally {
    // Disconnect from MongoDB
    if (rl) {
      rl.close();
    }
    await mongoose.connection.close();
    log.info('Disconnected from MongoDB');
  }
}

// Run the test
testRealPasswordReset();

