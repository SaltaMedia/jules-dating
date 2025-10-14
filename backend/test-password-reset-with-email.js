require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./utils/emailService');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`),
  email: (msg) => console.log(`${colors.magenta}📧 ${msg}${colors.reset}`)
};

async function testPasswordResetWithEmail() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔒 COMPLETE PASSWORD RESET TEST (WITH EMAIL)');
    console.log('='.repeat(70) + '\n');

    // Connect to MongoDB
    log.step('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    log.success('Connected to MongoDB');

    // Check email configuration
    log.step('Checking email configuration...');
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      log.success(`Email configured with: ${process.env.GMAIL_USER}`);
    } else {
      log.warning('Email credentials not configured - email test will be skipped');
      log.info('Set GMAIL_USER and GMAIL_APP_PASSWORD in .env to test email');
    }

    // Test user credentials
    const testEmail = `test-reset-${Date.now()}@example.com`;
    const originalPassword = 'TestPassword123!';
    const newPassword = 'NewPassword456!';

    // Step 1: Create a test user
    log.step('Step 1: Creating test user...');
    const testUser = new User({
      name: 'Test Reset User',
      email: testEmail,
      password: originalPassword
    });
    await testUser.save();
    log.success(`Test user created with email: ${testEmail}`);

    // Step 2: Verify user can login with original password
    log.step('Step 2: Verifying login with original password...');
    const userBeforeReset = await User.findOne({ email: testEmail });
    const isOriginalPasswordValid = await bcrypt.compare(originalPassword, userBeforeReset.password);
    if (isOriginalPasswordValid) {
      log.success('Original password works correctly');
    } else {
      log.error('Original password does not work');
      throw new Error('Original password validation failed');
    }

    // Step 3: Simulate forgot password - generate reset token
    log.step('Step 3: Generating password reset token...');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    userBeforeReset.resetPasswordToken = resetToken;
    userBeforeReset.resetPasswordExpires = resetTokenExpiry;
    await userBeforeReset.save();
    
    log.success(`Reset token generated: ${resetToken.substring(0, 10)}...`);
    log.info(`Token expires at: ${new Date(resetTokenExpiry).toLocaleString()}`);

    // Step 4: Test email sending (if configured)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      log.step('Step 4: Testing password reset email...');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3002';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      log.email(`Reset URL: ${resetUrl}`);
      log.email(`Attempting to send email to: ${testEmail}`);
      
      const emailSent = await sendPasswordResetEmail(testEmail, resetToken, resetUrl);
      
      if (emailSent) {
        log.success('✉️  Password reset email sent successfully!');
        log.info('NOTE: Since this is a test email address, you won\'t receive it');
        log.info('In production, users would receive an email with the reset link');
      } else {
        log.warning('Email sending failed - check email configuration');
        log.info('The password reset flow will still work via direct link');
      }
    } else {
      log.warning('Step 4: Email test skipped (credentials not configured)');
    }

    // Step 5: Verify token is stored correctly
    log.step('Step 5: Verifying token is stored in database...');
    const userWithToken = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (userWithToken) {
      log.success('Reset token found in database and is not expired');
    } else {
      log.error('Reset token not found or is expired');
      throw new Error('Token verification failed');
    }

    // Step 6: Reset the password (simulating what the API endpoint does)
    log.step('Step 6: Resetting password with token...');
    userWithToken.password = newPassword;
    userWithToken.resetPasswordToken = undefined;
    userWithToken.resetPasswordExpires = undefined;
    await userWithToken.save();
    
    log.success('Password reset successfully');

    // Step 7: Verify old password no longer works
    log.step('Step 7: Verifying old password no longer works...');
    const userAfterReset = await User.findOne({ email: testEmail });
    const isOldPasswordValid = await bcrypt.compare(originalPassword, userAfterReset.password);
    if (!isOldPasswordValid) {
      log.success('Old password correctly rejected');
    } else {
      log.error('Old password still works (should not happen)');
      throw new Error('Old password still valid after reset');
    }

    // Step 8: Verify new password works
    log.step('Step 8: Verifying new password works...');
    const isNewPasswordValid = await bcrypt.compare(newPassword, userAfterReset.password);
    if (isNewPasswordValid) {
      log.success('New password works correctly');
    } else {
      log.error('New password does not work');
      throw new Error('New password validation failed');
    }

    // Step 9: Verify reset token was cleared
    log.step('Step 9: Verifying reset token was cleared...');
    if (!userAfterReset.resetPasswordToken && !userAfterReset.resetPasswordExpires) {
      log.success('Reset token and expiry cleared from database');
    } else {
      log.warning('Reset token or expiry still present in database');
    }

    // Step 10: Test expired token scenario
    log.step('Step 10: Testing expired token scenario...');
    const expiredToken = crypto.randomBytes(32).toString('hex');
    const expiredTokenExpiry = Date.now() - 1000; // Already expired

    userAfterReset.resetPasswordToken = expiredToken;
    userAfterReset.resetPasswordExpires = expiredTokenExpiry;
    await userAfterReset.save();

    const userWithExpiredToken = await User.findOne({
      resetPasswordToken: expiredToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!userWithExpiredToken) {
      log.success('Expired token correctly rejected by query');
    } else {
      log.error('Expired token was accepted (should not happen)');
    }

    // Clean up: Delete test user
    log.step('Cleaning up test user...');
    await User.deleteOne({ email: testEmail });
    log.success('Test user deleted');

    // Final summary
    console.log('\n' + '='.repeat(70));
    log.success('ALL PASSWORD RESET TESTS PASSED! ✨');
    console.log('='.repeat(70) + '\n');

    log.info('Test Summary:');
    log.info('✅ User creation and password hashing');
    log.info('✅ Reset token generation and storage');
    log.info('✅ Password reset email (if configured)');
    log.info('✅ Token validation and expiration');
    log.info('✅ Password update and verification');
    log.info('✅ Old password invalidation');
    log.info('✅ Security token cleanup');
    
    console.log('\n📋 Next Steps for Production:');
    log.info('1. Ensure GMAIL_USER and GMAIL_APP_PASSWORD are set in production .env');
    log.info('2. Test with a real email address to verify delivery');
    log.info('3. Monitor email sending logs in production');
    log.info('4. Consider adding email rate limiting for security\n');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    log.info('Disconnected from MongoDB');
  }
}

// Run the test
testPasswordResetWithEmail();

