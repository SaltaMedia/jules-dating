const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/User');
require('dotenv').config();

async function exportUsersToCSV() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'email name createdAt lastLoginAt isAdmin')
      .sort({ createdAt: -1 });

    console.log(`Found ${users.length} users in database`);

    // Create CSV content
    const csvHeader = 'Email,Name,Created At,Last Login,Is Admin\n';
    const csvRows = users.map(user => {
      const email = user.email || '';
      const name = (user.name || 'Unknown').replace(/,/g, ';'); // Replace commas to avoid CSV issues
      const createdAt = user.createdAt ? new Date(user.createdAt).toISOString() : '';
      const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : '';
      const isAdmin = user.isAdmin ? 'Yes' : 'No';
      
      return `${email},${name},${createdAt},${lastLogin},${isAdmin}`;
    });

    const csvContent = csvHeader + csvRows.join('\n');

    // Write to file
    const filename = `jules-users-export-${new Date().toISOString().split('T')[0]}.csv`;
    fs.writeFileSync(filename, csvContent);

    console.log(`✅ Exported ${users.length} users to ${filename}`);
    console.log('\nFirst 5 users:');
    users.slice(0, 5).forEach((user, i) => {
      console.log(`${i+1}. ${user.email} - ${user.name || 'Unknown'} - ${user.isAdmin ? 'Admin' : 'User'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

exportUsersToCSV();
