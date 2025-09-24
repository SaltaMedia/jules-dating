require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { migrateUserToProfile } = require('../utils/contextBuilder');

async function migrateUsersToProfiles() {
  try {
    console.log('Starting migration from User to UserProfile...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jules-style');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if profile already exists
        const existingProfile = await UserProfile.findOne({ userId: user._id.toString() });
        
        if (existingProfile) {
          console.log(`Profile already exists for user ${user.email}, skipping...`);
          skippedCount++;
          continue;
        }

        // Migrate user data to profile format
        const profileData = migrateUserToProfile(user);
        
        if (!profileData) {
          console.log(`No valid data to migrate for user ${user.email}`);
          skippedCount++;
          continue;
        }

        // Create new profile
        const profile = new UserProfile(profileData);
        await profile.save();

        console.log(`Successfully migrated user: ${user.email}`);
        migratedCount++;

      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total users: ${users.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Verify migration
    const totalProfiles = await UserProfile.countDocuments();
    console.log(`Total profiles in database: ${totalProfiles}`);

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateUsersToProfiles();
}

module.exports = { migrateUsersToProfiles }; 