const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function debugLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve user found:');
      console.log('- Email:', steve.email);
      console.log('- Password hash:', steve.password);
      console.log('- isAdmin:', steve.isAdmin);
      
      // Test password comparison
      const testPassword = 'admin123';
      console.log('\nTesting password:', testPassword);
      
      const isMatch = await bcrypt.compare(testPassword, steve.password);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('\nPassword mismatch - creating new hash...');
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(testPassword, salt);
        console.log('New hash:', newHash);
        
        const newMatch = await bcrypt.compare(testPassword, newHash);
        console.log('New hash match:', newMatch);
        
        // Update the user
        steve.password = newHash;
        await steve.save();
        console.log('✅ User password updated');
      }
    } else {
      console.log('❌ Steve user not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugLogin();
