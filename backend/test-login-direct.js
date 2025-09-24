const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLoginDirect() {
  try {
    // Use the exact same connection as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all users with steve in the email
    const users = await User.find({ email: { $regex: /steve/i } });
    console.log('Found users:', users.length);
    users.forEach(user => {
      console.log(`- ${user.email} (admin: ${user.isAdmin})`);
    });
    
    // Find the specific user
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('\nSteve user details:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
      
      // Test password
      const testPassword = 'admin123';
      const isMatch = await bcrypt.compare(testPassword, steve.password);
      console.log('- Password match:', isMatch);
      
      if (!isMatch) {
        console.log('\nCreating new password hash...');
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(testPassword, salt);
        steve.password = newHash;
        await steve.save();
        console.log('✅ Password updated');
        
        // Test again
        const newMatch = await bcrypt.compare(testPassword, newHash);
        console.log('New password match:', newMatch);
      }
    } else {
      console.log('❌ Steve user not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLoginDirect();
