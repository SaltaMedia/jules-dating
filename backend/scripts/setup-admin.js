const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Admin user details
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@juleslabs.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Check if admin user already exists
    let adminUser = await User.findOne({ email: adminEmail });

    if (adminUser) {
      // Update existing user to be admin
      adminUser.isAdmin = true;
      await adminUser.save();
      console.log(`✅ Updated existing user ${adminEmail} to admin`);
    } else {
      // Create new admin user
      adminUser = new User({
        email: adminEmail,
        password: adminPassword, // This will be hashed by the User model
        name: 'Analytics Admin',
        isAdmin: true,
        isVerified: true
      });
      await adminUser.save();
      console.log(`✅ Created new admin user: ${adminEmail}`);
    }

    console.log('\n📊 Analytics Dashboard Access:');
    console.log(`URL: http://localhost:3001/admin/analytics`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('\n🔐 Make sure to change the password after first login!');

  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup
setupAdmin();

