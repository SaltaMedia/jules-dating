require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function searchUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Search for users with similar email patterns
    console.log('\n=== SEARCHING FOR SIMILAR EMAILS ===');
    
    // Search for emails containing "braxden"
    const braxdenUsers = await User.find({ 
      email: { $regex: /braxden/i } 
    }).select('email name createdAt lastActive');

    console.log(`Found ${braxdenUsers.length} users with "braxden" in email:`);
    braxdenUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    // Search for emails containing "brax"
    const braxUsers = await User.find({ 
      email: { $regex: /brax/i } 
    }).select('email name createdAt lastActive');

    console.log(`\nFound ${braxUsers.length} users with "brax" in email:`);
    braxUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    // Search for emails containing "gmail"
    const gmailUsers = await User.find({ 
      email: { $regex: /gmail/i } 
    }).select('email name createdAt lastActive').limit(20);

    console.log(`\nFound ${gmailUsers.length} Gmail users (showing first 20):`);
    gmailUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

    // Get all users to see what's in the database
    console.log('\n=== ALL USERS IN DATABASE ===');
    const allUsers = await User.find({})
      .select('email name createdAt lastActive')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Total users in database: ${allUsers.length}`);
    console.log('\nRecent users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Created: ${user.createdAt}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

searchUsers();
