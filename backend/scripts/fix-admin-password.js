const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Admin user details
    const adminEmail = 'admin@juleslabs.com';
    const adminPassword = 'admin123';

    // Find the admin user
    const adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('❌ Admin user not found. Run setup-admin.js first.');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Update the user's password
    adminUser.password = hashedPassword;
    adminUser.isAdmin = true;
    await adminUser.save();

    console.log('✅ Fixed admin user password');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('🔐 You can now log in with these credentials!');

  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixAdminPassword();
