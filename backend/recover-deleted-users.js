require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function recoverDeletedUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read the CSV backup file
    const csvFile = 'jules-users-export-2025-09-18.csv';
    if (!fs.existsSync(csvFile)) {
      console.error('❌ CSV backup file not found:', csvFile);
      return;
    }

    const csvContent = fs.readFileSync(csvFile, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header line
    const dataLines = lines.slice(1);
    
    console.log(`\n📄 Found ${dataLines.length} users in backup file`);

    // Add braxdenm@gmail.com manually since it's not in the CSV but was shown in analytics
    const braxdenUser = {
      email: 'braxdenm@gmail.com',
      name: 'Braxden',
      createdAt: '2025-10-01T00:00:00.000Z',
      lastLogin: '',
      isAdmin: 'No'
    };
    
    // Add braxden to the data lines
    dataLines.push(`${braxdenUser.email},${braxdenUser.name},${braxdenUser.createdAt},${braxdenUser.lastLogin},${braxdenUser.isAdmin}`);

    // Get current users to avoid duplicates
    const currentUsers = await User.find({}, 'email');
    const currentEmails = new Set(currentUsers.map(u => u.email));
    
    console.log(`\n👥 Current users in database: ${currentUsers.length}`);
    console.log(`📄 Total users to process (including braxdenm@gmail.com): ${dataLines.length}`);

    let recoveredCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const line of dataLines) {
      try {
        const [email, name, createdAt, lastLogin, isAdmin] = line.split(',');
        
        if (!email || email.trim() === '') continue;

        // Check if user already exists
        if (currentEmails.has(email)) {
          console.log(`⏭️  User already exists: ${email}`);
          skippedCount++;
          continue;
        }

        // Create new user
        const user = new User({
          email: email.trim(),
          name: name.trim() || 'Recovered User',
          password: await bcrypt.hash('temp_password_' + Date.now(), 10), // Temporary password
          isAdmin: isAdmin === 'Yes',
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          lastActive: lastLogin ? new Date(lastLogin) : new Date(),
          onboarding: {
            completed: false,
            name: name.trim() || 'Recovered User',
            email: email.trim()
          }
        });

        await user.save();
        console.log(`✅ Recovered user: ${email} (${name})`);
        recoveredCount++;

      } catch (error) {
        console.error(`❌ Error recovering user from line: ${line}`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Recovery Summary:');
    console.log(`✅ Successfully recovered: ${recoveredCount} users`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);

    // Show final user count
    const finalUserCount = await User.countDocuments();
    console.log(`\n👥 Final user count: ${finalUserCount}`);

    // List all users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}).sort({ createdAt: -1 });
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Created: ${user.createdAt} - Admin: ${user.isAdmin}`);
    });

  } catch (error) {
    console.error('❌ Error during recovery:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

recoverDeletedUsers();
