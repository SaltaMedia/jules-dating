const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testJulesStyleDatabase() {
  try {
    // Connect to the jules-style database specifically
    const MONGODB_URI = 'mongodb+srv://spsalta:Q4eqe34UHGRz7ZaT@juleslabs.mtrgoxc.mongodb.net/jules-style?retryWrites=true&w=majority&appName=JulesLabs';
    console.log('Connecting to jules-style database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check if Steve exists in this database
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve found in jules-style database:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
    } else {
      console.log('❌ Steve not found in jules-style database');
      
      // Create Steve in this database
      console.log('Creating Steve in jules-style database...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newSteve = new User({
        email: 'steve@juleslabs.com',
        name: 'Steve Salta',
        password: hashedPassword,
        isAdmin: true,
        isVerified: true
      });
      
      await newSteve.save();
      console.log('✅ Steve created in jules-style database');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testJulesStyleDatabase();
