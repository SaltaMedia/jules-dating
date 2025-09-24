const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve user found:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
      
      // Test common passwords
      const passwords = ['admin123', 'steve123', 'password', 'admin', 'steve'];
      
      for (const password of passwords) {
        const isMatch = await bcrypt.compare(password, steve.password);
        console.log(`- Password "${password}": ${isMatch ? '✅ MATCH' : '❌ No match'}`);
      }
      
      // If none match, let's set a simple password
      const testMatch = await bcrypt.compare('admin123', steve.password);
      if (!testMatch) {
        console.log('\nSetting password to "admin123"...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        steve.password = hashedPassword;
        await steve.save();
        console.log('✅ Password set to: admin123');
      }
    } else {
      console.log('❌ Steve user not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPassword();
