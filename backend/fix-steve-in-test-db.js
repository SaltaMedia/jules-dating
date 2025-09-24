const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixSteveInTestDatabase() {
  try {
    // Connect to the same database the server is using (test database)
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Find Steve in the test database
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve found in test database:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Current password hash:', steve.password);
      
      // Set a fresh password
      const newPassword = 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      steve.password = hashedPassword;
      steve.isAdmin = true;
      await steve.save();
      
      console.log('✅ Password updated for Steve in test database');
      console.log('📧 Email: steve@juleslabs.com');
      console.log('🔑 Password: admin123');
      console.log('👑 Admin: true');
      console.log('🔐 New hash:', hashedPassword);
      
      // Test the password
      const isMatch = await bcrypt.compare(newPassword, hashedPassword);
      console.log('🧪 Password test:', isMatch ? 'PASS' : 'FAIL');
      
    } else {
      console.log('❌ Steve not found in test database');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixSteveInTestDatabase();
