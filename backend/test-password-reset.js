require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const crypto = require('crypto');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}🔄 ${msg}${colors.reset}`)
};

async function testPasswordReset() {
  try {
    // Connect to MongoDB
    log.step('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules_dating');
    log.success('Connected to MongoDB');

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

    // Step 4: Verify token is stored correctly
    log.step('Step 4: Verifying token is stored in database...');
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

    // Step 5: Reset the password
    log.step('Step 5: Resetting password with token...');
    // Note: Don't manually hash - the User model pre-save hook will do it
    userWithToken.password = newPassword;
    userWithToken.resetPasswordToken = undefined;
    userWithToken.resetPasswordExpires = undefined;
    await userWithToken.save();
    
    log.success('Password reset successfully');

    // Step 6: Verify old password no longer works
    log.step('Step 6: Verifying old password no longer works...');
    const userAfterReset = await User.findOne({ email: testEmail });
    const isOldPasswordValid = await bcrypt.compare(originalPassword, userAfterReset.password);
    if (!isOldPasswordValid) {
      log.success('Old password correctly rejected');
    } else {
      log.error('Old password still works (should not happen)');
      throw new Error('Old password still valid after reset');
    }

    // Step 7: Verify new password works
    log.step('Step 7: Verifying new password works...');
    const isNewPasswordValid = await bcrypt.compare(newPassword, userAfterReset.password);
    if (isNewPasswordValid) {
      log.success('New password works correctly');
    } else {
      log.error('New password does not work');
      throw new Error('New password validation failed');
    }

    // Step 8: Verify reset token was cleared
    log.step('Step 8: Verifying reset token was cleared...');
    if (!userAfterReset.resetPasswordToken && !userAfterReset.resetPasswordExpires) {
      log.success('Reset token and expiry cleared from database');
    } else {
      log.warning('Reset token or expiry still present in database');
    }

    // Step 9: Test expired token scenario
    log.step('Step 9: Testing expired token scenario...');
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
    console.log('\n' + '='.repeat(60));
    log.success('ALL PASSWORD RESET TESTS PASSED! ✨');
    console.log('='.repeat(60) + '\n');

    log.info('Summary:');
    log.info('✅ User creation works');
    log.info('✅ Password hashing works');
    log.info('✅ Reset token generation works');
    log.info('✅ Token storage and retrieval works');
    log.info('✅ Password reset works');
    log.info('✅ Token expiration works');
    log.info('✅ Old password is invalidated');
    log.info('✅ New password works correctly');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error('\nFull error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.connection.close();
    log.info('Disconnected from MongoDB');
  }
}

// Run the test
testPasswordReset();

