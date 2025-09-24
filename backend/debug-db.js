const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function debugDatabase() {
  try {
    // Use the exact same connection as the server
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style';
    console.log('Connecting to:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // Check if the users collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Find all users
    const allUsers = await User.find({});
    console.log('Total users:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`- ${user.email} (admin: ${user.isAdmin})`);
    });
    
    // Find Steve specifically
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('\nSteve found:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Password hash:', steve.password);
    } else {
      console.log('\n❌ Steve not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugDatabase();
