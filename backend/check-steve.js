const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAndFixSteve() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    
    const steve = await User.findOne({ email: 'steve@juleslabs.com' });
    if (steve) {
      console.log('Steve user found:');
      console.log('- Email:', steve.email);
      console.log('- isAdmin:', steve.isAdmin);
      console.log('- Has password:', !!steve.password);
      console.log('- Created:', steve.createdAt);
      
      // If no password, set one
      if (!steve.password) {
        console.log('Setting password for Steve...');
        const hashedPassword = await bcrypt.hash('steve123', 10);
        steve.password = hashedPassword;
        steve.isAdmin = true;
        await steve.save();
        console.log('✅ Password set to: steve123');
        console.log('✅ Admin status confirmed');
      }
    } else {
      console.log('Steve user not found - creating...');
      const hashedPassword = await bcrypt.hash('steve123', 10);
      const newSteve = new User({
        email: 'steve@juleslabs.com',
        name: 'Steve Salta',
        password: hashedPassword,
        isAdmin: true,
        isVerified: true
      });
      await newSteve.save();
      console.log('✅ Steve user created with password: steve123');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndFixSteve();
