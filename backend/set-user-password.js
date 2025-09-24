require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function setUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'testertester@example.com' });
    
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', user.email);
    console.log('Current password field:', user.password ? 'Set' : 'Not set');

    // Hash a new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password set successfully for user:', user.email);
    console.log('🔑 Password: password123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

setUserPassword();
