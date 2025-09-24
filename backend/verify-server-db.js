const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function verifyServerDatabase() {
  try {
    // Use the exact same connection as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check if the users collection exists and has data
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);
    
    // Find Steve specifically
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve found:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
      console.log('- Created:', steve.createdAt);
    } else {
      console.log('❌ Steve not found');
    }
    
    // Check if there are any other databases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyServerDatabase();
