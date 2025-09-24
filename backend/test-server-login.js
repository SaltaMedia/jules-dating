const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testServerLogin() {
  try {
    // Use the exact same connection as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Find Steve
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve found:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
      
      // Test the exact same password comparison as the server
      const password = 'admin123';
      console.log('\nTesting password:', password);
      
      const isMatch = await bcrypt.compare(password, steve.password);
      console.log('Password match:', isMatch);
      
      if (!isMatch) {
        console.log('Password mismatch - setting new password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        steve.password = hashedPassword;
        await steve.save();
        console.log('✅ Password updated');
        
        // Test again
        const newMatch = await bcrypt.compare(password, hashedPassword);
        console.log('New password match:', newMatch);
      }
    } else {
      console.log('❌ Steve not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testServerLogin();
