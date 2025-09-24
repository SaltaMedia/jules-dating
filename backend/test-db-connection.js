const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testDatabaseConnection() {
  try {
    // Use the exact same connection as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Server MONGODB_URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check if Steve exists in this database
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('✅ Steve found in server database:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
      
      // Test password
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare('admin123', steve.password);
      console.log('- Password match:', isMatch);
    } else {
      console.log('❌ Steve not found in server database');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDatabaseConnection();
